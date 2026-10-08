"use client";
import { useState } from "react";
import { recordPayment, saveAttendance, saveCarpool } from "@/actions/operations";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/form";
import { formatINR } from "@/lib/format";

export type OperationsPerson = { id: string; name: string; email: string; partySize: number; checkedInCount: number; confirmed: boolean; expected: number | null; net: number; paymentStatus: string; carpoolChoice: string; carpoolLocation: string | null; carpoolSeats: number | null; carpoolMatched: boolean; phone: string | null };
export type LedgerEntry = { id: string; name: string; amount: string; method: string; reference: string | null; note: string | null; by: string; date: string };

export function OperationsPanel({ people, events, paymentsEnabled = true }: { people: OperationsPerson[]; events: LedgerEntry[]; paymentsEnabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [view, setView] = useState("ATTENDANCE");
  const filtered = people.filter((p) => (p.name + " " + p.email).toLowerCase().includes(query.toLowerCase()) && (filter === "ALL" || paymentsEnabled && filter === "UNPAID" && p.confirmed && p.paymentStatus !== "PAID" || filter === "ARRIVING" && p.confirmed && p.checkedInCount < p.partySize || filter === "CARPOOL" && p.carpoolChoice !== "NONE" || filter === "WAITLIST" && !p.confirmed));
  const confirmed = people.filter((p) => p.confirmed);
  return <section className="space-y-6">
    <div className={`grid gap-3 ${paymentsEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <Metric label="Checked in / confirmed" value={confirmed.reduce((n,p) => n+p.checkedInCount,0) + " / " + confirmed.reduce((n,p) => n+p.partySize,0)} />
      {paymentsEnabled ? <Metric label="Recorded net receipts" value={formatINR(people.reduce((n,p) => n+p.net,0)/100)} /> : null}
      <Metric label="Ride requests to coordinate" value={String(confirmed.filter((p) => p.carpoolChoice === "NEED_RIDE" && !p.carpoolMatched).length)} />
    </div>
    {paymentsEnabled ? <p className="text-sm text-lichen">Receipts are entered manually; no money is charged here. Earlier payment status labels have no amount history. Record their opening receipts before using the totals. Refunds remain in the ledger.</p> : <p className="text-sm text-lichen">This is a short meetup. Use attendance and ride coordination only; payment and gear checks are intentionally unavailable.</p>}
    <div className="flex flex-wrap gap-2">{(paymentsEnabled ? ["ATTENDANCE", "PAYMENTS", "CARPOOL", "HISTORY"] : ["ATTENDANCE", "CARPOOL"]).map((v) => <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => setView(v)}>{v === "HISTORY" ? "Payment history" : v.charAt(0) + v.slice(1).toLowerCase()}</Button>)}</div>
    {paymentsEnabled && view === "HISTORY" ? <div className="space-y-3">{events.length ? events.map((event) => <article key={event.id} className="rounded-panel border border-ridge p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{event.name}</strong><strong className={Number(event.amount) < 0 ? "text-ember" : "text-signal"}>{formatINR(event.amount)}</strong></div><p className="text-sm text-lichen">{event.method} · {event.reference || "No reference"} · {event.date} · Recorded by {event.by}</p><p className="mt-1 text-sm">{event.note}</p></article>) : <p>No receipts recorded yet.</p>}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2"><label>Search members<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" /></label><label>Show<NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">Everyone</option>{paymentsEnabled ? <option value="UNPAID">Not fully paid</option> : null}<option value="ARRIVING">Still arriving</option><option value="CARPOOL">Carpool</option><option value="WAITLIST">Waitlist</option></NativeSelect></label></div>
      <div className="grid gap-4 lg:grid-cols-2">{filtered.filter((p) => view !== "CARPOOL" || p.carpoolChoice !== "NONE").map((p) => <article key={p.id} className="rounded-panel border border-ridge bg-basalt p-5">
        <h3 className="font-semibold">{p.name}</h3><p className="text-xs text-lichen">{p.partySize} traveller(s) · {p.confirmed ? "Confirmed" : "Waitlist"}</p>
        {view === "ATTENDANCE" && <Attendance person={p} />}
        {view === "PAYMENTS" && <Payment person={p} />}
        {view === "CARPOOL" && <Carpool person={p} />}
      </article>)}</div>{filtered.length === 0 && <p className="text-lichen">No registrations match this filter.</p>}
    </>}
  </section>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-panel border border-ridge bg-basalt p-4"><p className="text-sm text-lichen">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
export function Attendance({ person }: { person: Pick<OperationsPerson, "id" | "checkedInCount" | "partySize" | "confirmed"> }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); const count = Number(new FormData(e.currentTarget).get("count")); void run(() => saveAttendance(person.id, count)); }}><label>Travellers present<Input key={person.checkedInCount} name="count" type="number" min={0} max={person.partySize} required defaultValue={person.checkedInCount} disabled={!person.confirmed} /></label><Button size="sm" disabled={pending || !person.confirmed}>Save check-in</Button><FormMessage result={result} /></form>;
}
export function Payment({ person }: { person: Pick<OperationsPerson, "id" | "expected" | "net"> }) {
  const { run, pending, result } = useActionRunner();
  const [requestId, setRequestId] = useState<string | null>(null);
  return <div className="mt-4"><p className="text-sm">Expected: {person.expected === null ? "Not set" : formatINR(person.expected/100)} · Recorded: {formatINR(person.net/100)}</p><p className="mt-1 text-sm text-signal">Balance: {person.expected === null ? "Set trip prices first" : formatINR((person.expected-person.net)/100)}</p>
    <details className="mt-3"><summary className="cursor-pointer text-sm">Record receipt / refund</summary><form className="mt-3 grid gap-3" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const id = requestId ?? crypto.randomUUID(); setRequestId(id); const values = Object.fromEntries(new FormData(form)); void run(() => recordPayment({ ...values, registrationId: person.id, requestId: id }), () => { setRequestId(null); form.reset(); }); }}>
      <label>Entry type<NativeSelect name="kind"><option value="RECEIPT">Receipt</option><option value="REFUND">Refund</option></NativeSelect></label>
      <label>Amount (₹)<Input name="amount" type="number" min="0.01" max="9999999" step="0.01" required /></label>
      <label>Method<NativeSelect name="method"><option>UPI</option><option>BANK</option><option>CASH</option></NativeSelect></label>
      <label>Reference<Input name="reference" maxLength={120} /></label><label>Notes<Textarea name="note" maxLength={500} /></label>
      <Button disabled={pending}>Record entry</Button><FormMessage result={result} />
    </form></details></div>;
}
export function Carpool({ person }: { person: Pick<OperationsPerson, "id" | "carpoolChoice" | "carpoolSeats" | "carpoolLocation" | "carpoolMatched" | "phone" | "confirmed"> }) {
  const { run, pending, result } = useActionRunner();
  return <div className="mt-4 space-y-3"><p>{person.carpoolChoice === "OFFER_RIDE" ? "Offers" : "Needs"} {person.carpoolSeats ?? "unspecified"} seats · {person.carpoolLocation || "Location missing"}</p>{!person.confirmed && <p className="text-sm text-lichen">Waitlisted; do not allocate a ride until confirmed.</p>}{person.phone && <a className="block text-signal underline" href={"tel:" + person.phone}>Call organiser contact: {person.phone}</a>}{person.carpoolChoice === "NEED_RIDE" && <Button variant="outline" disabled={pending || !person.confirmed} onClick={() => void run(() => saveCarpool(person.id, !person.carpoolMatched))}>{person.carpoolMatched ? "Reopen ride request" : "Mark ride arranged"}</Button>}<FormMessage result={result} /></div>;
}
