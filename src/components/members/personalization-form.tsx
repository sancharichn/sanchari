"use client";

import { Check, Compass, MapPin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { savePersonalization } from "@/actions/personalization";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";

export const tripChoices = [
  { value: "MEETUP", label: "Meetups", detail: "Easy community time" },
  { value: "DAY_TRIP", label: "Day trips", detail: "Explore and return" },
  { value: "STAY_BACK", label: "Multi-day", detail: "Slow, immersive journeys" },
  { value: "TREK", label: "Treks", detail: "Active trails" },
  { value: "INTERNATIONAL", label: "International", detail: "Journeys abroad" },
] as const;

export type PersonalizationDefaults = { preferredTripKinds: string[]; travelPace: string | null; homeArea: string | null };

export function PersonalizationForm({ defaults, compact = false }: { defaults: PersonalizationDefaults; compact?: boolean }) {
  const [values, setValues] = useState({ preferredTripKinds: defaults.preferredTripKinds, travelPace: defaults.travelPace ?? "", homeArea: defaults.homeArea ?? "" });
  const { pending, result, run, fieldErrors } = useActionRunner();
  const toggle = (kind: string) => setValues((current) => ({ ...current, preferredTripKinds: current.preferredTripKinds.includes(kind) ? current.preferredTripKinds.filter((entry) => entry !== kind) : [...current.preferredTripKinds, kind] }));
  return <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void run(() => savePersonalization(values)); }}>
    <fieldset><legend className="flex items-center gap-2 text-sm font-bold"><Compass className="size-4 text-signal" />What do you want to see first?</legend><div className={`mt-3 grid gap-2 ${compact ? "sm:grid-cols-5" : "sm:grid-cols-2"}`}>{tripChoices.map((choice) => { const selected = values.preferredTripKinds.includes(choice.value); return <label key={choice.value} className={`cursor-pointer rounded-xl border p-3 transition ${selected ? "border-signal bg-signal/10" : "border-ridge bg-night/30 hover:border-mist/30"}`}><input type="checkbox" className="sr-only" checked={selected} onChange={() => toggle(choice.value)} /><span className="flex items-center justify-between gap-2 text-sm font-semibold">{choice.label}{selected ? <Check className="size-4 text-signal" /> : null}</span>{compact ? null : <span className="mt-1 block text-xs text-lichen">{choice.detail}</span>}</label>; })}</div></fieldset>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Preferred travel pace" htmlFor={`travel-pace-${compact ? "compact" : "full"}`}><NativeSelect id={`travel-pace-${compact ? "compact" : "full"}`} value={values.travelPace} onChange={(event) => setValues((current) => ({ ...current, travelPace: event.target.value }))}><option value="">No preference</option><option value="RELAXED">Relaxed</option><option value="BALANCED">Balanced</option><option value="ACTIVE">Active</option></NativeSelect></Field><Field label="Where do you usually start from?" htmlFor={`home-area-${compact ? "compact" : "full"}`} hint={compact ? undefined : "Used only to make carpool and departure information more useful."} error={fieldErrors.homeArea}><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-lichen" /><Input id={`home-area-${compact ? "compact" : "full"}`} className="pl-10" value={values.homeArea} onChange={(event) => setValues((current) => ({ ...current, homeArea: event.target.value }))} placeholder="For example, Velachery" /></div></Field></div>
    <FormMessage result={result} /><Button type="submit" className={compact ? "w-full sm:w-fit" : "w-full sm:w-fit"} disabled={pending}><SlidersHorizontal className="size-4" />{pending ? "Saving…" : "Save my preferences"}</Button>
  </form>;
}
