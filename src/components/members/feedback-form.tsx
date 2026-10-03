"use client";

import { useState } from "react";
import { submitFeedback } from "@/actions/member";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Poor", "Below par", "Good", "Great", "Loved it"];

type TripOption = { id: string; title: string };

/**
 * Feedback for one completed trip (tripId fixed), or a choice between the
 * member's completed trips and general feedback about the group.
 */
export function FeedbackForm({
  trips = [],
  fixedTripId,
  idPrefix = "fb",
}: {
  trips?: TripOption[];
  fixedTripId?: string;
  idPrefix?: string;
}) {
  const { pending, result, setResult, run, fieldErrors } = useActionRunner();
  const [tripId, setTripId] = useState(fixedTripId ?? "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (result?.ok) {
    return (
      <div className="grid gap-4 rounded-panel border border-ridge bg-basalt p-6">
        <FormMessage result={result} />
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              setRating(0);
              setComment("");
            }}
          >
            Write another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-5 rounded-panel border border-ridge bg-basalt p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => submitFeedback({ tripId: tripId || undefined, rating, comment }));
      }}
    >
      {!fixedTripId ? (
        <Field label="About" htmlFor={`${idPrefix}-trip`}>
          <NativeSelect id={`${idPrefix}-trip`} value={tripId} onChange={(e) => setTripId(e.target.value)}>
            <option value="">The group in general</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      <fieldset className="grid gap-2" aria-describedby={fieldErrors.rating ? `${idPrefix}-rating-error` : undefined}>
        <legend className="mb-2 text-sm font-semibold text-mist">How was it?</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const id = `${idPrefix}-rating-${n}`;
            return (
              <span key={n}>
                <input
                  id={id}
                  type="radio"
                  name={`${idPrefix}-rating`}
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal",
                    rating === n ? "border-signal bg-signal text-night" : "border-ridge text-mist hover:border-mist/40",
                  )}
                >
                  <span className="stretch-narrow tabular-nums">{n}</span>
                  <span className={rating === n ? "text-night/80" : "text-lichen"}>{RATING_WORDS[n]}</span>
                </label>
              </span>
            );
          })}
        </div>
        {fieldErrors.rating ? (
          <p id={`${idPrefix}-rating-error`} className="text-sm text-ember">
            {fieldErrors.rating}
          </p>
        ) : null}
      </fieldset>

      <Field
        label="What should we know?"
        htmlFor={`${idPrefix}-comment`}
        hint="Shown on the site with your first name."
        error={fieldErrors.comment}
      >
        <Textarea
          id={`${idPrefix}-comment`}
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={Boolean(fieldErrors.comment)}
          aria-describedby={fieldErrors.comment ? `${idPrefix}-comment-error` : `${idPrefix}-comment-hint`}
        />
      </Field>

      <FormMessage result={result} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post feedback"}
        </Button>
      </div>
    </form>
  );
}
