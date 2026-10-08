"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { TripKind, TripStatus } from "@prisma/client";
import { saveTrip } from "@/actions/admin";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { ALL_STATUSES, KIND_OPTION_LABEL, STATUS_HELP, STATUS_LABEL, TRIP_KINDS, WHO_CAN_JOIN } from "@/lib/trips";

export type TripFormValues = {
  title: string;
  kind: TripKind;
  coverPhotoId: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  maxCapacity: string;
  budgetEst: string;
  adultBudgetEst: string;
  childBudgetEst: string;
  status: TripStatus;
  itinerary: Array<{ title: string; details: string }>;
};

export const EMPTY_TRIP: TripFormValues = {
  title: "",
  kind: "DAY_TRIP",
  coverPhotoId: "",
  location: "",
  description: "",
  startDate: "",
  endDate: "",
  maxCapacity: "20",
  budgetEst: "",
  adultBudgetEst: "",
  childBudgetEst: "",
  status: "DRAFT",
  itinerary: [{ title: "", details: "" }],
};

/** A gallery photo an organiser can pick as the trip's cover. */
export type CoverOption = { id: string; thumb: string; album: string };

export function TripForm({
  tripId,
  initial,
  photos,
}: {
  tripId: string | null;
  initial: TripFormValues;
  photos: CoverOption[];
}) {
  const router = useRouter();
  const { pending, result, run, fieldErrors } = useActionRunner();
  const [values, setValues] = useState<TripFormValues>(initial);

  const set =
    <K extends keyof TripFormValues>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const setDay = (index: number, key: "title" | "details", value: string) =>
    setValues((v) => ({ ...v, itinerary: v.itinerary.map((d, i) => (i === index ? { ...d, [key]: value } : d)) }));

  const moveDay = (index: number, by: -1 | 1) =>
    setValues((v) => {
      const target = index + by;
      if (target < 0 || target >= v.itinerary.length) return v;
      const days = [...v.itinerary];
      [days[index], days[target]] = [days[target], days[index]];
      return { ...v, itinerary: days };
    });

  const err = (key: string) => fieldErrors[key];
  const aria = (id: string, key: string, hasHint = false) => ({
    "aria-invalid": Boolean(err(key)),
    "aria-describedby": err(key) ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  });

  return (
    <form
      noValidate
      className="grid gap-10"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => {
            // Editing: the status has its own control on the trip page, so don't send a possibly stale one.
            const { status, ...rest } = values;
            return saveTrip(tripId, tripId ? rest : { ...rest, status });
          },
          (r) => {
            const id = r.ok ? (r.data?.id as string | undefined) : undefined;
            if (!tripId && id) router.push(`/admin/trips/${id}`);
          },
        );
      }}
    >
      <fieldset className="grid gap-5">
        <legend className="stretch-semiwide mb-2 text-xl font-bold">The trip</legend>
        <Field label="Name" htmlFor="trip-title" error={err("title")}>
          <Input id="trip-title" value={values.title} onChange={set("title")} {...aria("trip-title", "title")} />
        </Field>
        <Field
          label="Type"
          htmlFor="trip-kind"
          hint={`Who can join, as the trip page will say: ${WHO_CAN_JOIN[values.kind]}`}
          error={err("kind")}
        >
          <NativeSelect id="trip-kind" value={values.kind} onChange={set("kind")} {...aria("trip-kind", "kind", true)}>
            {TRIP_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_OPTION_LABEL[k]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Where" htmlFor="trip-location" hint="Town or area, for example: Kolli Hills, Namakkal" error={err("location")}>
          <Input id="trip-location" value={values.location} onChange={set("location")} {...aria("trip-location", "location", true)} />
        </Field>
        <Field label="Description" htmlFor="trip-description" hint="Shown on the trip page. Blank lines start new paragraphs." error={err("description")}>
          <Textarea
            id="trip-description"
            rows={7}
            value={values.description}
            onChange={set("description")}
            {...aria("trip-description", "description", true)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" htmlFor="trip-start" error={err("startDate")}>
            <Input id="trip-start" type="date" value={values.startDate} onChange={set("startDate")} {...aria("trip-start", "startDate")} />
          </Field>
          <Field label="Ends" htmlFor="trip-end" error={err("endDate")}>
            <Input id="trip-end" type="date" value={values.endDate} onChange={set("endDate")} {...aria("trip-end", "endDate")} />
          </Field>
          <Field label="Seats" htmlFor="trip-capacity" hint="Registrations beyond this join the waitlist." error={err("maxCapacity")}>
            <Input
              id="trip-capacity"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={values.maxCapacity}
              onChange={set("maxCapacity")}
              {...aria("trip-capacity", "maxCapacity", true)}
            />
          </Field>
          {values.kind !== "MEETUP" ? <><Field label="Adult cost (₹)" htmlFor="trip-adult-budget" hint="Optional. Used for adults; legacy cost is used if blank." error={err("adultBudgetEst")}>
            <Input
              id="trip-adult-budget"
              inputMode="decimal"
              value={values.adultBudgetEst}
              onChange={set("adultBudgetEst")}
              {...aria("trip-adult-budget", "adultBudgetEst", true)}
            />
          </Field>
          <Field label="Child cost (₹)" htmlFor="trip-child-budget" hint="Optional. Applies under 18s." error={err("childBudgetEst")}>
            <Input id="trip-child-budget" inputMode="decimal" value={values.childBudgetEst} onChange={set("childBudgetEst")} {...aria("trip-child-budget", "childBudgetEst", true)} />
          </Field>
          </> : <p className="self-end rounded-xl border border-signal/25 bg-signal/5 p-4 text-sm text-mist sm:col-span-2">Meetups are free two-hour gatherings. Payment and gear checks are not used.</p>}
        </div>
        {!tripId ? (
          <Field label="Status" htmlFor="trip-status" hint={STATUS_HELP[values.status]} error={err("status")}>
            <NativeSelect id="trip-status" value={values.status} onChange={set("status")} aria-describedby="trip-status-hint">
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="stretch-semiwide mb-2 text-xl font-bold">Cover photo</legend>
        <p className="-mt-1 text-sm text-lichen">
          Shown on trip cards and at the top of the trip page. Photos come from the shared Drive gallery folder.
        </p>
        {err("coverPhotoId") ? <p className="text-sm text-ember">{err("coverPhotoId")}</p> : null}
        {photos.length === 0 ? (
          <p className="text-sm text-mist">No gallery photos yet. Add some to the Drive folder, then pick one here.</p>
        ) : (
          <div className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-[10px] border border-ridge p-2 text-center text-xs font-semibold text-lichen has-[:checked]:border-signal has-[:checked]:text-mist has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-signal">
              <input
                type="radio"
                name="trip-cover"
                value=""
                checked={values.coverPhotoId === ""}
                onChange={() => setValues((v) => ({ ...v, coverPhotoId: "" }))}
                className="sr-only"
              />
              No cover photo
            </label>
            {photos.map((photo, i) => (
              <label
                key={photo.id}
                className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[10px] border-2 border-transparent has-[:checked]:border-signal has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal"
              >
                <input
                  type="radio"
                  name="trip-cover"
                  value={photo.id}
                  checked={values.coverPhotoId === photo.id}
                  onChange={() => setValues((v) => ({ ...v, coverPhotoId: photo.id }))}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail from our own photo proxy */}
                <img src={photo.thumb} alt={`Photo ${i + 1} from ${photo.album}`} loading="lazy" className="size-full object-cover" />
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="stretch-semiwide mb-2 text-xl font-bold">Day by day</legend>
        <ol className="grid gap-4">
          {values.itinerary.map((day, i) => (
            <li key={i} className="grid gap-4 rounded-[14px] border border-ridge p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="stretch-narrow text-sm font-semibold tabular-nums text-lichen">Day {i + 1}</p>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => moveDay(i, -1)} disabled={i === 0} aria-label={`Move day ${i + 1} up`}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9"
                    onClick={() => moveDay(i, 1)}
                    disabled={i === values.itinerary.length - 1}
                    aria-label={`Move day ${i + 1} down`}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 text-ember"
                    onClick={() => setValues((v) => ({ ...v, itinerary: v.itinerary.filter((_, j) => j !== i) }))}
                    aria-label={`Remove day ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <Field label="Title" htmlFor={`day-${i}-title`} error={err(`itinerary.${i}.title`)}>
                <Input
                  id={`day-${i}-title`}
                  value={day.title}
                  onChange={(e) => setDay(i, "title", e.target.value)}
                  {...aria(`day-${i}-title`, `itinerary.${i}.title`)}
                />
              </Field>
              <Field label="Details" htmlFor={`day-${i}-details`} hint="Optional: meeting points, timings, what to carry." error={err(`itinerary.${i}.details`)}>
                <Textarea
                  id={`day-${i}-details`}
                  rows={3}
                  className="min-h-20"
                  value={day.details}
                  onChange={(e) => setDay(i, "details", e.target.value)}
                  {...aria(`day-${i}-details`, `itinerary.${i}.details`, true)}
                />
              </Field>
            </li>
          ))}
        </ol>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValues((v) => ({ ...v, itinerary: [...v.itinerary, { title: "", details: "" }] }))}
            disabled={values.itinerary.length >= 30}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add a day
          </Button>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-ridge pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : tripId ? "Save changes" : "Create trip"}
        </Button>
        <FormMessage result={result} />
      </div>
    </form>
  );
}
