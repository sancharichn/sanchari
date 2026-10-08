"use client";
import { useState } from "react";
import { assignStaff, requestDeletion, reviewDataRequest, retryNotification, saveWhatsappPreference } from "@/actions/governance";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/form";

export function AccessEditor({ member, trips }: { member: { id: string; staffRole: string | null; tripIds: string[] }; trips: { id: string; title: string }[] }) {
  const [role, setRole] = useState(member.staffRole ?? "");
  const { run, pending, result } = useActionRunner();
  return <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void run(() => assignStaff({ userId: member.id, role, tripIds: form.getAll("trips").map(String) })); }}>
    <label>Staff access<NativeSelect value={role} onChange={e => setRole(e.target.value)}><option value="">Member only</option><option value="FINANCE">Finance organiser</option><option value="LEADER">Trip leader</option><option value="MODERATOR">Feedback moderator</option></NativeSelect></label>
    {role === "LEADER" && <fieldset className="max-h-56 overflow-y-auto rounded-xl border border-ridge p-3"><legend>Assigned trips</legend>{trips.map(t => <label className="flex gap-3 py-2" key={t.id}><input type="checkbox" name="trips" value={t.id} defaultChecked={member.tripIds.includes(t.id)} />{t.title}</label>)}{!trips.length && <p>No trips yet.</p>}</fieldset>}
    <Button size="sm" disabled={pending}>Save access</Button><FormMessage result={result} />
  </form>;
}
export function MemberDataControls({ optIn, number }: { optIn: boolean; number: string | null }) {
  const preferences = useActionRunner(), deletion = useActionRunner();
  return <section className="mt-12 space-y-8 rounded-panel border border-ridge bg-basalt p-6">
    <div><h2 className="text-2xl font-bold">Notifications & your data</h2><form className="mt-4 grid gap-3" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void preferences.run(() => saveWhatsappPreference(data.get("enabled") === "on", String(data.get("number")))); }}>
      <label className="flex items-start gap-3"><input className="mt-1" name="enabled" type="checkbox" defaultChecked={optIn} />Send me WhatsApp trip updates from Sanchari Chennai, including waitlist confirmations. I can turn this off here or reply STOP.</label>
      <label>WhatsApp number with country code<Input type="tel" name="number" defaultValue={number ? "+" + number : ""} placeholder="+919876543210" maxLength={24} /></label>
      <Button className="w-fit" disabled={preferences.pending}>Save notification preference</Button><FormMessage result={preferences.result} />
    </form></div>
    <div><h3 className="font-bold">Download your information</h3><p className="mt-2 text-sm text-lichen">Your profile, family details, bookings, payments and feedback linked to your account.</p><a className="mt-3 inline-block text-signal underline" href="/api/member/export">Download personal data (JSON)</a></div>
    <details><summary className="cursor-pointer font-bold">Request account deletion</summary><p className="mt-3 text-sm text-lichen">Organisers will review your request and any outstanding trips. Removing your account includes family profiles and photos. Anonymised accounting history is retained; organisers review free-text records separately. Download your data first.</p><form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void deletion.run(() => requestDeletion(String(data.get("confirmation")))); }}><label>Type DELETE<Input name="confirmation" required pattern="DELETE" /></label><Button variant="outline" disabled={deletion.pending}>Request deletion</Button><FormMessage result={deletion.result} /></form></details>
  </section>;
}
export function DataRequestReview({ id }: { id: string }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(() => reviewDataRequest(id, String(data.get("status")), String(data.get("note")))); }}>
    <label>Decision<NativeSelect name="status"><option value="REVIEWING">Reviewing outstanding records</option><option value="DECLINED">Decline with explanation</option><option value="COMPLETED">Remove personal details and close account</option></NativeSelect></label>
    <label>Explanation visible to the member<Textarea name="note" minLength={10} maxLength={1000} required /></label>
    <label className="flex gap-2"><input type="checkbox" required />I have reviewed accounting, incident notes and other free-text records for personal information. Completing removal is irreversible.</label>
    <Button disabled={pending}>Apply decision</Button><FormMessage result={result} />
  </form>;
}
export function DeliveryRetry({ id }: { id: string }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(() => retryNotification(id, data.get("checked") === "on")); }}><label className="flex gap-2"><input name="checked" type="checkbox" required />I checked the provider: this message was not delivered.</label><Button size="sm" disabled={pending}>Queue retry</Button><FormMessage result={result} /></form>;
}
