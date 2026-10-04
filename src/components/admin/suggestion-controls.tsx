"use client";

import { useState } from "react";
import type { SuggestionStatus } from "@prisma/client";
import { updateSuggestion } from "@/actions/admin-feedback";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/form";
import { SUGGESTION_STATUS_LABEL, TOPICS } from "@/lib/feedback";

const STATUSES = Object.keys(SUGGESTION_STATUS_LABEL) as SuggestionStatus[];

/** Status and topic save as soon as they change; the note saves with its button. */
export function SuggestionControls({
  id,
  status,
  topic,
  note,
}: {
  id: string;
  status: SuggestionStatus;
  topic: string;
  note: string | null;
}) {
  const { pending, result, run } = useActionRunner();
  const [noteDraft, setNoteDraft] = useState(note ?? "");
  const noteChanged = noteDraft.trim() !== (note ?? "");

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor={`sg-${id}-status`} className="text-xs font-semibold text-lichen">
            Status
          </label>
          <NativeSelect
            id={`sg-${id}-status`}
            className="h-9 text-sm"
            defaultValue={status}
            disabled={pending}
            onChange={(e) => void run(() => updateSuggestion(id, { status: e.target.value }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {SUGGESTION_STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1">
          <label htmlFor={`sg-${id}-topic`} className="text-xs font-semibold text-lichen">
            Topic
          </label>
          <NativeSelect
            id={`sg-${id}-topic`}
            className="h-9 text-sm"
            defaultValue={topic}
            disabled={pending}
            onChange={(e) => void run(() => updateSuggestion(id, { topic: e.target.value }))}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => updateSuggestion(id, { note: noteDraft }));
        }}
      >
        <Input
          aria-label="Organisers' note"
          placeholder="Note for organisers, e.g. trying this on the January trip"
          className="h-9 text-sm"
          maxLength={300}
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !noteChanged}>
          Save
        </Button>
      </form>
      <FormMessage result={result} />
    </div>
  );
}
