import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentUserSafe } from "@/lib/session";

const statusLabels: Record<string, string> = { REQUESTED: "Awaiting confirmation", CONFIRMED: "Confirmed", READY: "Ready for pickup", COLLECTED: "Collected", CANCELLED: "Cancelled" };
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export default async function ShopPage() {
  const user = await getCurrentUserSafe();
  if (!user) redirect("/signin?callbackUrl=%2Fshop");
  const [products, orders] = await Promise.all([
    prisma.shopProduct.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    prisma.shopOrder.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
  ]);
  return <main className="mobile-glass-screen container py-14 md:py-20"><p className="text-sm text-signal">Sanchari goods</p><h1 className="mt-2 text-4xl font-black">Pickup shop</h1><p className="mt-4 max-w-2xl text-lichen">Build a cart, review the total and place one pickup request. No online payment is taken; organisers confirm availability and contact you with pickup details.</p>
    {products.length ? <ShopCatalog products={products.map((product) => ({ ...product, price: product.price.toString() }))} /> : <p className="mt-10 rounded-panel border border-ridge p-6 text-lichen">The shop is being stocked. Check back soon.</p>}
    <section className="mt-16 border-t border-ridge pt-10" aria-labelledby="orders-heading"><p className="text-sm text-signal">Your requests</p><h2 id="orders-heading" className="mt-2 text-2xl font-bold">Pickup orders</h2>{orders.length ? <div className="mt-6 grid gap-4">{orders.map((order) => <article key={order.id} className="rounded-panel border border-ridge bg-basalt p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">Order {order.id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-lichen">{order.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div><span className="rounded-full border border-signal/35 px-3 py-1 text-xs font-semibold text-signal">{statusLabels[order.status]}</span></div><ul className="mt-4 grid gap-2 text-sm">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{item.quantity} × {item.productName}{item.size ? ` · ${item.size}` : ""}</span><span>{money.format(Number(item.unitPrice) * item.quantity)}</span></li>)}</ul><p className="mt-4 border-t border-ridge pt-4 text-right font-bold text-signal">{money.format(Number(order.total))}</p>{order.pickupNote ? <p className="mt-3 text-sm text-lichen">Pickup note: {order.pickupNote}</p> : null}</article>)}</div> : <p className="mt-5 text-sm text-lichen">You have not placed a pickup order yet.</p>}</section>
    <Link href="/" className="mt-10 inline-block text-sm text-signal underline">← Back home</Link></main>;
}
