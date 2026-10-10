"use server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { done, fail, type ActionResult } from "@/lib/action-result";

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
