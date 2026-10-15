import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  user: vi.fn(), admin: vi.fn(), findProducts: vi.fn(), reserve: vi.fn(), createOrder: vi.fn(),
  findOrder: vi.fn(), updateOrder: vi.fn(), updateProduct: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getCurrentUser: mock.user, getAdmin: mock.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: vi.fn(async (callback) => callback({
    shopProduct: { findMany: mock.findProducts, updateMany: mock.reserve, update: mock.updateProduct },
    shopOrder: { create: mock.createOrder, findUnique: mock.findOrder, update: mock.updateOrder },
  })),
  shopProduct: { update: vi.fn(), create: vi.fn() },
} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { placeShopOrder, updateShopOrderStatus } from "./shop";

beforeEach(() => {
  vi.resetAllMocks();
  mock.user.mockResolvedValue({ id: "member" });
  mock.admin.mockResolvedValue({ id: "admin" });
  mock.findProducts.mockResolvedValue([{ id: "shirt", name: "T-shirt", sizes: "S, M", price: 500, stock: 4, active: true }]);
  mock.reserve.mockResolvedValue({ count: 1 });
  mock.createOrder.mockResolvedValue({ id: "order-reference" });
});

describe("pickup checkout", () => {
  it("requires a signed-in member and pickup confirmation", async () => {
    mock.user.mockResolvedValue(null);
    expect((await placeShopOrder({ items: [] })).ok).toBe(false);
    mock.user.mockResolvedValue({ id: "member" });
    expect((await placeShopOrder({ items: [{ productId: "shirt", size: "M", quantity: 1 }] })).ok).toBe(false);
    expect(mock.createOrder).not.toHaveBeenCalled();
  });

  it("prices on the server, reserves stock and snapshots the item", async () => {
    const result = await placeShopOrder({ items: [{ productId: "shirt", size: "M", quantity: 2 }], pickupNote: "Meetup", pickupConfirmed: true });
    expect(result.ok).toBe(true);
    expect(mock.reserve).toHaveBeenCalledWith({ where: { id: "shirt", active: true, stock: { gte: 2 } }, data: { stock: { decrement: 2 } } });
    expect(mock.createOrder).toHaveBeenCalledWith({ data: { userId: "member", total: 1000, pickupNote: "Meetup", items: { create: [{ productId: "shirt", productName: "T-shirt", size: "M", quantity: 2, unitPrice: 500 }] } }, select: { id: true } });
  });

  it("rejects missing sizes and changed stock", async () => {
    expect((await placeShopOrder({ items: [{ productId: "shirt", quantity: 1 }], pickupConfirmed: true })).ok).toBe(false);
    mock.findProducts.mockResolvedValue([{ id: "shirt", name: "T-shirt", sizes: "S, M", price: 500, stock: 0, active: true }]);
    expect((await placeShopOrder({ items: [{ productId: "shirt", size: "M", quantity: 1 }], pickupConfirmed: true })).ok).toBe(false);
  });
});

describe("order fulfilment", () => {
  it("restores stock when an organiser cancels", async () => {
    mock.findOrder.mockResolvedValue({ id: "order", status: "REQUESTED", items: [{ productId: "shirt", quantity: 2 }] });
    expect((await updateShopOrderStatus("order", "CANCELLED")).ok).toBe(true);
    expect(mock.updateProduct).toHaveBeenCalledWith({ where: { id: "shirt" }, data: { stock: { increment: 2 } } });
    expect(mock.updateOrder).toHaveBeenCalledWith({ where: { id: "order" }, data: { status: "CANCELLED" } });
  });
});
