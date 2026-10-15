"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { placeShopOrder } from "@/actions/shop";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

type Product = { id: string; name: string; description: string | null; sizes: string | null; price: string; imageUrl: string | null; stock: number };
type CartItem = { productId: string; name: string; price: number; size: string | null; quantity: number; stock: number; imageUrl: string | null };

const CART_KEY = "sanchari-pickup-cart-v1";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ShopCatalog({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [pickupNote, setPickupNote] = useState("");
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { pending, result, run } = useActionRunner();

  useEffect(() => {
    try { const saved = localStorage.getItem(CART_KEY); if (saved) setCart(JSON.parse(saved)); } catch { localStorage.removeItem(CART_KEY); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, loaded]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function add(product: Product) {
    const allowed = product.sizes?.split(",").map((size) => size.trim()).filter(Boolean) ?? [];
    const size = allowed.length ? sizes[product.id] : null;
    if (allowed.length && !size) { document.getElementById(`size-${product.id}`)?.focus(); return; }
    setCart((current) => {
      const index = current.findIndex((item) => item.productId === product.id && item.size === size);
      if (index >= 0) return current.map((item, i) => i === index ? { ...item, quantity: Math.min(item.quantity + 1, Math.min(10, product.stock)) } : item);
      return [...current, { productId: product.id, name: product.name, price: Number(product.price), size: size ?? null, quantity: 1, stock: product.stock, imageUrl: product.imageUrl }];
    });
  }

  function change(index: number, amount: number) {
    setCart((current) => current.flatMap((item, i) => i !== index ? [item] : item.quantity + amount <= 0 ? [] : [{ ...item, quantity: Math.min(item.quantity + amount, Math.min(10, item.stock)) }]));
  }

  async function checkout() {
    const outcome = await run(() => placeShopOrder({ items: cart.map(({ productId, size, quantity }) => ({ productId, size, quantity })), pickupNote, pickupConfirmed }));
    if (outcome.ok) { setCart([]); setPickupNote(""); setPickupConfirmed(false); localStorage.removeItem(CART_KEY); }
  }

  return <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
    <section aria-labelledby="products-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-signal">Merchandise</p><h2 id="products-heading" className="mt-1 text-2xl font-bold">Choose your trail goods</h2></div><a href="#cart" className="rounded-full border border-ridge px-4 py-2 text-sm text-mist lg:hidden"><ShoppingBag className="mr-2 inline size-4" />Cart · {count}</a></div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{products.map((product) => { const options = product.sizes?.split(",").map((size) => size.trim()).filter(Boolean) ?? []; const soldOut = product.stock <= 0; return <article key={product.id} className="overflow-hidden rounded-panel border border-ridge bg-basalt">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_30%_20%,#476c60,#101918_70%)]"><ShoppingBag className="size-12 text-signal/60" aria-hidden="true" /></div>}
        <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{product.name}</h3><p className="shrink-0 font-bold text-signal">{money.format(Number(product.price))}</p></div><p className="mt-2 min-h-10 text-sm text-lichen">{product.description}</p>
          {options.length ? <label className="mt-4 grid gap-1.5 text-sm text-lichen">Size<select id={`size-${product.id}`} value={sizes[product.id] ?? ""} onChange={(event) => setSizes((current) => ({ ...current, [product.id]: event.target.value }))} className="h-11 rounded-lg border border-ridge bg-night px-3 text-mist"><option value="">Choose a size</option>{options.map((size) => <option key={size}>{size}</option>)}</select></label> : null}
          <p className="mt-3 text-xs text-lichen">{soldOut ? "Currently unavailable" : `${product.stock} available for pickup`}</p><Button type="button" className="mt-4 w-full" disabled={soldOut} onClick={() => add(product)}><Plus className="size-4" />{soldOut ? "Unavailable" : "Add to cart"}</Button>
        </div></article>; })}</div>
    </section>

    <aside id="cart" className="scroll-mt-24 rounded-panel border border-signal/25 bg-basalt p-5 shadow-2xl lg:sticky lg:top-24" aria-labelledby="cart-heading"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-signal">Pickup only</p><h2 id="cart-heading" className="mt-1 text-xl font-bold">Your cart</h2></div><span className="grid size-10 place-items-center rounded-full bg-signal text-night" aria-label={`${count} items`}><ShoppingBag className="size-5" /></span></div>
      {!cart.length ? <p className="mt-6 rounded-xl border border-dashed border-ridge p-5 text-sm text-lichen">Your cart is empty. Add an item to begin.</p> : <div className="mt-5 grid gap-4">{cart.map((item, index) => <div key={`${item.productId}:${item.size ?? ""}`} className="grid grid-cols-[1fr_auto] gap-3 border-b border-ridge pb-4"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-lichen">{item.size ? `Size ${item.size} · ` : ""}{money.format(item.price)} each</p></div><button type="button" aria-label={`Remove ${item.name}`} onClick={() => setCart((current) => current.filter((_, i) => i !== index))} className="text-lichen hover:text-ember"><Trash2 className="size-4" /></button><div className="flex items-center gap-2"><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => change(index, -1)} className="grid size-9 place-items-center rounded-lg border border-ridge"><Minus className="size-3" /></button><span className="min-w-6 text-center font-bold">{item.quantity}</span><button type="button" aria-label={`Increase ${item.name}`} onClick={() => change(index, 1)} className="grid size-9 place-items-center rounded-lg border border-ridge"><Plus className="size-3" /></button></div><p className="self-center text-right font-semibold">{money.format(item.price * item.quantity)}</p></div>)}</div>}
      <div className="mt-5 flex items-center justify-between border-t border-ridge pt-5 text-lg font-bold"><span>Total</span><span className="text-signal">{money.format(total)}</span></div><p className="mt-1 text-xs text-lichen">No online payment. The organiser will contact you about confirmation and pickup.</p>
      <label className="mt-5 grid gap-2 text-sm">Pickup note (optional)<textarea value={pickupNote} onChange={(event) => setPickupNote(event.target.value)} maxLength={500} rows={3} placeholder="Preferred meetup or anything organisers should know" className="rounded-lg border border-ridge bg-night px-3 py-2 text-mist" /></label>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-ridge p-3 text-sm text-lichen"><input type="checkbox" checked={pickupConfirmed} onChange={(event) => setPickupConfirmed(event.target.checked)} className="mt-1" />I understand this is a pickup request and the organiser will confirm availability.</label>
      <Button type="button" size="lg" className="mt-5 w-full" disabled={!cart.length || !pickupConfirmed || pending} onClick={() => void checkout()}>{pending ? "Placing order…" : "Place pickup order"}</Button><FormMessage result={result} />
      {result?.ok && result.data?.orderReference ? <p className="mt-3 rounded-xl border border-signal/30 bg-signal/5 p-3 text-sm">Order reference: <strong>{String(result.data.orderReference)}</strong></p> : null}
    </aside>
  </div>;
}
