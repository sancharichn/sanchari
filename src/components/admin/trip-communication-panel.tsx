"use client";

import { useState } from "react";
import { sendTripCommunication } from "@/actions/admin";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

const PRESETS = {
  meetup: { label: "Meetup reminder", subject: "Reminder: meetup today", details: "Our meetup is today. Please arrive a few minutes early and keep your phone reachable for organiser updates. We look forward to seeing you." },
  briefing: { label: "Trip briefing", subject: "Trip briefing and what to bring", details: "Your place is confirmed. Please review the itinerary, meeting point and travel arrangements before departure. Contact the organiser if anything is unclear." },
  payment: { label: "Payment reminder", subject: "Payment reminder", details: "Our roster shows a pending or partial payment. Please contact the organiser to confirm the trip cost and payment arrangements." },
} as const;

export function TripCommunicationPanel({ tripId, meetup, audienceCount }: { tripId: string; meetup: boolean; audienceCount: number }) {
  const initial = meetup ? PRESETS.meetup : PRESETS.briefing;
  const [preset, setPreset] = useState<keyof typeof PRESETS>(meetup ? "meetup" : "briefing");
  const [subject, setSubject] = useState<string>(initial.subject);
  const [details, setDetails] = useState<string>(initial.details);
  const { pending, result, run } = useActionRunner();
  function choose(next: keyof typeof PRESETS) { setPreset(next); setSubject(PRESETS[next].subject); setDetails(PRESETS[next].details); }
  return <section className="admin-communication-panel mt-8" aria-labelledby="communication-heading">
    <div><p className="text-xs font-bold uppercase tracking-[.15em] text-signal">Trip communication</p><h2 id="communication-heading" className="mt-1 text-xl font-bold">Send an update to approved attendees</h2><p className="mt-1 text-sm text-lichen">Use a template, then add the details your group needs. Audience: {audienceCount} approved attendee{audienceCount === 1 ? "" : "s"} with email.</p></div>
    <div className="mt-5 grid gap-4">
      <label className="grid gap-1.5 text-sm font-semibold text-mist">Message template<select value={preset} onChange={(event) => choose(event.target.value as keyof typeof PRESETS)} className="h-11 rounded-lg border border-ridge bg-night px-3 font-normal"><option value="meetup">{PRESETS.meetup.label}</option><option value="briefing">{PRESETS.briefing.label}</option>{!meetup ? <option value="payment">{PRESETS.payment.label}</option> : null}</select></label>
      <label className="grid gap-1.5 text-sm font-semibold text-mist">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={140} className="h-11 rounded-lg border border-ridge bg-night px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-semibold text-mist">Trip-specific details<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={5000} rows={5} className="rounded-lg border border-ridge bg-night px-3 py-3 font-normal leading-relaxed" placeholder="Add meeting point, time, what to bring or a payment instruction." /></label>
      <div className="flex flex-wrap items-center gap-3"><Button type="button" disabled={pending || !subject.trim() || !details.trim()} onClick={() => void run(() => sendTripCommunication(tripId, { subject, details }))}>{pending ? "Sending…" : "Send to approved attendees"}</Button><span className="text-xs text-lichen">This sends one email per approved attendee.</span></div>
      <FormMessage result={result} />
    </div>
  </section>;
}
