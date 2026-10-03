"use client";

import { useState } from "react";
import type { TripStatus } from "@prisma/client";
import { setTripStatus } from "@/actions/admin";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form";
import { ALL_STATUSES, STATUS_HELP, STATUS_LABEL } from "@/lib/trips";

export function StatusSwitcher({ tripId, status }: { tripId: string; status: TripStatus }) {
  const [value, setValue] = useState<TripStatus>(status);
  const { pending, result, run } = useActionRunner();

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => setTripStatus(tripId, value));
      }}
    >
      <label htmlFor="status-switch" className="text-sm font-semibold text-mist">
        Status
      </label>
      <div className="flex gap-2">
        <div className="min-w-44 flex-1">
          <NativeSelect
            id="status-switch"
            value={value}
            onChange={(e) => setValue(e.target.value as TripStatus)}
            aria-describedby="status-switch-hint"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline" disabled={pending || value === status}>
          {pending ? "Saving…" : "Set status"}
        </Button>
      </div>
      <p id="status-switch-hint" className="text-sm text-lichen">
        {STATUS_HELP[value]}
      </p>
      <FormMessage result={result} />
    </form>
  );
}
