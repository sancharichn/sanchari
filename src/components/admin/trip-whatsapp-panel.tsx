"use client";

import { Copy, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { saveTripWhatsappGroup, sendTripGroupInviteEmails } from "@/actions/admin-whatsapp";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

type WhatsappMember = { name: string; number: string };

export function TripWhatsappPanel({ tripId, tripTitle, initialUrl, audienceCount, members, lastSent }: { tripId: string; tripTitle: string; initialUrl: string; audienceCount: number; members: WhatsappMember[]; lastSent: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [savedUrl, setSavedUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const save = useActionRunner();
  const email = useActionRunner();
  const cleanUrl = url.trim().replace(/\?.*$/, "");
  async function saveLink() {
    await save.run(async () => {
      const result = await saveTripWhatsappGroup(tripId, url);
      if (result.ok) setSavedUrl(cleanUrl);
      return result;
    });
  }
  const message = savedUrl ? `Join the ${tripTitle} WhatsApp group: ${savedUrl}` : "";
  return <section className="mt-8 rounded-panel border border-ridge bg-basalt/75 p-5 sm:p-6" aria-labelledby="whatsapp-group-heading">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-signal"><MessageCircle className="size-4" aria-hidden="true" /> WhatsApp trip group</p><h2 id="whatsapp-group-heading" className="mt-2 text-xl font-bold">{tripTitle}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-lichen">Create the group in WhatsApp with this trip name, then paste its invite link. Email the audience at once or open a prepared WhatsApp chat for each opted-in member.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(tripTitle).then(() => setCopied(true)).catch(() => setCopied(false))}><Copy className="size-4" aria-hidden="true" />{copied ? "Name copied" : "Copy group name"}</Button><a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ridge px-4 text-sm font-semibold text-mist hover:border-signal"><ExternalLink className="size-4" aria-hidden="true" /> Open WhatsApp</a></div></div>
    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><label className="grid gap-1.5 text-sm font-semibold text-mist">Group invite link<input value={url} onChange={(event) => setUrl(event.target.value)} inputMode="url" autoComplete="url" placeholder="https://chat.whatsapp.com/..." className="h-12 rounded-lg border border-ridge bg-night px-3 font-normal" /></label><Button type="button" variant="outline" className="self-end" disabled={save.pending} onClick={() => void saveLink()}>{save.pending ? "Saving…" : "Save group link"}</Button></div>
    <FormMessage result={save.result} />
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-ridge pt-5"><div><p className="text-sm text-mist"><strong>{audienceCount}</strong> approved/waitlisted accounts can receive the link by email.</p><p className="mt-1 text-xs text-lichen">{members.length} also have a WhatsApp number and opt-in.{lastSent ? ` Last emailed ${lastSent}.` : ""}</p></div><Button type="button" disabled={email.pending || !savedUrl || savedUrl !== cleanUrl} onClick={() => void email.run(() => sendTripGroupInviteEmails(tripId))}><Mail className="size-4" aria-hidden="true" />{email.pending ? "Emailing…" : "Email group invite"}</Button></div>
    {savedUrl !== cleanUrl ? <p className="mt-2 text-xs text-signal">Save the changed link before sharing.</p> : null}<FormMessage result={email.result} />
    {savedUrl && members.length ? <details className="mt-5 rounded-xl border border-ridge bg-night/45 p-4"><summary className="cursor-pointer text-sm font-bold text-mist">Open individual WhatsApp chats ({members.length})</summary><p className="mt-2 text-xs leading-5 text-lichen">Each button prepares the invite in WhatsApp. Review it and press Send. A WhatsApp Business account is not required.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{members.map((member) => <a key={`${member.number}-${member.name}`} href={`https://wa.me/${member.number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-ridge px-3 text-sm font-semibold text-mist transition hover:border-signal"><span className="truncate">{member.name}</span><MessageCircle className="size-4 shrink-0 text-signal" aria-hidden="true" /></a>)}</div></details> : null}
  </section>;
}
