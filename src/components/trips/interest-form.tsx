"use client";
import { saveTripInterest, withdrawTripInterest } from "@/actions/trip-interest";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
export function InterestForm({ saved }: { saved: { partySize: number; note: string | null } | null }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-5 grid max-w-xl gap-4" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => saveTripInterest(Object.fromEntries(data))); }}>
    {saved && <p className="rounded-xl border border-signal/40 p-3 text-signal">Your interest is registered. You can update it below.</p>}
    <label className="grid gap-2 text-sm">How many people might join, including you?<Input key={`size-${saved?.partySize}`} name="partySize" type="number" min={1} max={20} required defaultValue={saved?.partySize ?? 1} /></label>
    <label className="grid gap-2 text-sm">Preferred months, interests or questions (optional)<Textarea key={`note-${saved?.note}`} name="note" maxLength={1000} defaultValue={saved?.note ?? ""} placeholder="Tell us what would help you decide. Please leave passport and medical details out." /></label>
    <label className="flex items-start gap-3 text-sm text-lichen"><input type="checkbox" name="consent" required className="mt-1" />I understand that dates, itinerary and prices are not final. Organisers may contact me using my member details about this journey.</label>
    <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-signal/30 bg-night/90 p-3 shadow-2xl backdrop-blur-xl sm:static sm:flex-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>{pending ? "Submitting…" : saved ? "Save updated interest" : "Submit my interest"}</Button>{saved && <Button type="button" variant="outline" disabled={pending} onClick={() => void run(withdrawTripInterest)}>Withdraw interest</Button>}</div>
    <FormMessage result={result} />
  </form>;
}
