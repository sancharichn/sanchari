"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send, Users } from "lucide-react";
import { sendTripInterestCommunication } from "@/actions/admin-trip-interest";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

const PUBLIC_URL = "https://sancharichennai.vercel.app/trips/international-trip-to-sri-lanka-2027";
const PRESETS = {
  update: { label: "Planning update", subject: "Sri Lanka 2027 planning update", details: "Thank you for registering your interest. We are working on the dates, itinerary and estimated cost. We will share the confirmed details before asking anyone to book." },
  preferences: { label: "Check traveller preferences", subject: "Help us plan Sri Lanka 2027", details: "Please review your saved group size and planning note on the interest page. Keeping these details current helps us plan dates, rooms and transport for the group." },
  session: { label: "Information session", subject: "Sri Lanka 2027 information session", details: "We are arranging an information session for interested members. Add the meeting date, time and joining details here before sending." },
} as const;

type WhatsappMember = { id: string; name: string; number: string };

function newCampaignId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-0000-4000-8000-000000000000`.replace(/^\d+/, (value) => value.slice(-8).padStart(8, "0"));
}

export function TripInterestCommunication({ emailAudienceCount, whatsappMembers }: { emailAudienceCount: number; whatsappMembers: WhatsappMember[] }) {
  const [preset, setPreset] = useState<keyof typeof PRESETS>("update");
  const [subject, setSubject] = useState<string>(PRESETS.update.subject);
  const [details, setDetails] = useState<string>(PRESETS.update.details);
  const [campaignId, setCampaignId] = useState(newCampaignId);
  const email = useActionRunner();
  function choose(next: keyof typeof PRESETS) { setPreset(next); setSubject(PRESETS[next].subject); setDetails(PRESETS[next].details); }
  const whatsappText = `${subject}\n\n${details}\n\nReview your Sri Lanka 2027 interest: ${PUBLIC_URL}\n\nSanchari Chennai · Travel with Nature`;

  return <section className="admin-communication-panel my-8 overflow-hidden" aria-labelledby="interest-communication-heading">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.15em] text-signal">Interest-group communication</p><h2 id="interest-communication-heading" className="mt-1 text-2xl font-bold">Keep the planning circle informed</h2><p className="mt-2 max-w-2xl text-sm text-lichen">Email everyone who registered interest, or open a private WhatsApp chat for members who explicitly enabled WhatsApp messages.</p></div>
      <div className="flex gap-3"><span className="rounded-full border border-ridge bg-night/60 px-3 py-2 text-xs"><Mail className="mr-1.5 inline size-4 text-signal" />{emailAudienceCount} email</span><span className="rounded-full border border-ridge bg-night/60 px-3 py-2 text-xs"><MessageCircle className="mr-1.5 inline size-4 text-signal" />{whatsappMembers.length} WhatsApp</span></div>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-2xl border border-ridge bg-night/45 p-5">
        <div className="flex items-center gap-2"><Mail className="size-5 text-signal" /><h3 className="font-bold">Branded group email</h3></div>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold">Template<select value={preset} onChange={(event) => choose(event.target.value as keyof typeof PRESETS)} className="h-11 rounded-lg border border-ridge bg-night px-3 font-normal">{Object.entries(PRESETS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-semibold">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={140} className="h-11 rounded-lg border border-ridge bg-night px-3 font-normal" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Planning update<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={5000} rows={6} className="rounded-lg border border-ridge bg-night px-3 py-3 font-normal leading-relaxed" /></label>
          <div className="flex flex-wrap items-center gap-3"><Button disabled={email.pending || !subject.trim() || !details.trim() || !emailAudienceCount} onClick={() => void email.run(() => sendTripInterestCommunication({ campaignId, subject, details }), (result) => { if (result.ok) setCampaignId(newCampaignId()); })}><Send className="size-4" />{email.pending ? "Sending…" : `Email ${emailAudienceCount} household${emailAudienceCount === 1 ? "" : "s"}`}</Button><span className="text-xs text-lichen">The email clearly identifies this as planning interest.</span></div>
          <FormMessage result={email.result} />
        </div>
      </div>
      <div className="rounded-2xl border border-ridge bg-night/45 p-5">
        <div className="flex items-center gap-2"><MessageCircle className="size-5 text-signal" /><h3 className="font-bold">Individual WhatsApp messages</h3></div>
        <p className="mt-2 text-sm leading-relaxed text-lichen">Each button opens a prefilled private chat. Review it and press Send in WhatsApp. Only members with WhatsApp consent appear here.</p>
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">{whatsappMembers.map((member) => <a key={member.id} href={`https://wa.me/${member.number}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-ridge bg-basalt px-4 py-3 transition hover:border-signal/60 hover:bg-fern/20"><span className="min-w-0 truncate text-sm font-semibold">{member.name}</span><span className="shrink-0 text-xs font-bold text-signal">Open chat ↗</span></a>)}</div>
        {!whatsappMembers.length ? <div className="mt-4 rounded-xl border border-dashed border-ridge p-4 text-sm text-lichen"><Users className="mb-2 size-5" />No interested member has enabled WhatsApp messages with a valid number.</div> : null}
      </div>
    </div>
  </section>;
}
