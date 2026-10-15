"use client";

import { updateShopOrderStatus } from "@/actions/shop";
import { useActionRunner } from "@/components/forms/use-action-runner";

const labels = { REQUESTED: "Requested", CONFIRMED: "Confirmed", READY: "Ready for pickup", COLLECTED: "Collected", CANCELLED: "Cancelled" };

export function ShopOrderStatus({ orderId, value }: { orderId: string; value: keyof typeof labels }) {
  const { pending, result, run } = useActionRunner();
  return <div className="grid gap-1"><select aria-label="Order status" defaultValue={value} disabled={pending} onChange={(event) => void run(() => updateShopOrderStatus(orderId, event.target.value))} className="h-10 rounded-lg border border-ridge bg-night px-3 text-sm text-mist">{Object.entries(labels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select>{result ? <span className={result.ok ? "text-xs text-lichen" : "text-xs text-ember"}>{result.message}</span> : null}</div>;
}
