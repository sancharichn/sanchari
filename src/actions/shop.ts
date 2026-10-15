"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin, getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    size: z.string().trim().max(30).optional().nullable(),
    quantity: z.coerce.number().int().min(1).max(10),
  })).min(1, "Add at least one item to your cart.").max(20),
  pickupNote: z.string().trim().max(500).optional().default(""),
  pickupConfirmed: z.literal(true, { errorMap: () => ({ message: "Confirm that this is a pickup order." }) }),
});

const ORDER_STATUSES = ["REQUESTED", "CONFIRMED", "READY", "COLLECTED", "CANCELLED"] as const;

export async function placeShopOrder(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to place a pickup order.");
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const grouped = new Map<string, { productId: string; size: string | null; quantity: number }>();
  for (const item of parsed.data.items) {
    const size = item.size?.trim() || null;
    const key = `${item.productId}:${size ?? ""}`;
    const current = grouped.get(key);
    grouped.set(key, { productId: item.productId, size, quantity: (current?.quantity ?? 0) + item.quantity });
  }
  const items = [...grouped.values()];
  if (items.some((item) => item.quantity > 10)) return fail("Limit each product and size to 10 per order.");

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.shopProduct.findMany({ where: { id: { in: items.map((item) => item.productId) }, active: true } });
      if (products.length !== new Set(items.map((item) => item.productId)).size) throw new Error("PRODUCT_UNAVAILABLE");
      const byId = new Map(products.map((product) => [product.id, product]));
      let total = 0;
      const snapshots = items.map((item) => {
        const product = byId.get(item.productId);
        if (!product) throw new Error("PRODUCT_UNAVAILABLE");
        const allowedSizes = product.sizes?.split(",").map((size) => size.trim()).filter(Boolean) ?? [];
        if (allowedSizes.length && (!item.size || !allowedSizes.includes(item.size))) throw new Error("SIZE_REQUIRED");
        if (!allowedSizes.length && item.size) throw new Error("SIZE_INVALID");
        if (product.stock < item.quantity) throw new Error("STOCK_CHANGED");
        const unitPrice = Number(product.price);
        total += unitPrice * item.quantity;
        return { productId: product.id, productName: product.name, size: item.size, quantity: item.quantity, unitPrice };
      });
      for (const item of items) {
        const reserved = await tx.shopProduct.updateMany({ where: { id: item.productId, active: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (reserved.count !== 1) throw new Error("STOCK_CHANGED");
      }
      return tx.shopOrder.create({
        data: { userId: user.id, total, pickupNote: parsed.data.pickupNote || null, items: { create: snapshots } },
        select: { id: true },
      });
    });
    revalidatePath("/shop"); revalidatePath("/admin/shop"); revalidatePath("/profile");
    return done("Pickup order submitted. An organiser will confirm when it is ready.", { orderReference: order.id.slice(-8).toUpperCase() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "SIZE_REQUIRED" || code === "SIZE_INVALID") return fail("Choose a valid size for every sized item.");
    if (code === "PRODUCT_UNAVAILABLE") return fail("An item in your cart is no longer available. Refresh the shop and try again.");
    if (code === "STOCK_CHANGED") return fail("Stock changed while you were checking out. Refresh the shop and adjust your cart.");
    console.error("[shop] Could not place pickup order", error);
    return fail("The order could not be placed. Please try again.");
  }
}

export async function updateShopOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("You don't have access to that.");
  if (!orderId || !ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) return fail("Choose a valid order status.");
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.shopOrder.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new Error("ORDER_MISSING");
      if (order.status === status) return;
      if (order.status !== "CANCELLED" && status === "CANCELLED") {
        for (const item of order.items) await tx.shopProduct.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      } else if (order.status === "CANCELLED" && status !== "CANCELLED") {
        for (const item of order.items) {
          const reserved = await tx.shopProduct.updateMany({ where: { id: item.productId, active: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (reserved.count !== 1) throw new Error("STOCK_CHANGED");
        }
      }
      await tx.shopOrder.update({ where: { id: orderId }, data: { status: status as typeof ORDER_STATUSES[number] } });
    });
    revalidatePath("/shop"); revalidatePath("/admin/shop"); revalidatePath("/profile");
    return done("Order status updated.");
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") return fail("There is not enough stock to reopen this order.");
    if (error instanceof Error && error.message === "ORDER_MISSING") return fail("This order no longer exists.");
    console.error("[shop] Could not update order", error);
    return fail("The order could not be updated.");
  }
}

export async function saveShopProduct(input: { id?: string; name: string; description: string; sizes: string; price: string; imageUrl: string; stock: string; active: boolean }): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("You don't have access to that.");
  const name = input.name.trim(); const price = Number(input.price); const stock = Number(input.stock);
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return fail("Add a product name, a valid price and a whole-number stock count.");
  const data = { name, description: input.description.trim() || null, sizes: input.sizes.trim() || null, price, imageUrl: input.imageUrl.trim() || null, stock, active: input.active };
  if (input.id) await prisma.shopProduct.update({ where: { id: input.id }, data });
  else await prisma.shopProduct.create({ data });
  revalidatePath("/"); revalidatePath("/shop"); revalidatePath("/admin/shop");
  return done(input.id ? "Product updated." : "Product added.");
}
