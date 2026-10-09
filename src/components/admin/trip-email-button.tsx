"use client";

import { sendTripBriefingNow } from "@/actions/admin";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

export function TripEmailButton({ tripId, meetup }: { tripId: string; meetup: boolean }) {
  const { pending, result, run } = useActionRunner();
  return <div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void run(() => sendTripBriefingNow(tripId))}>{pending ? "Sending…" : meetup ? "Email meetup details" : "Send trip briefing"}</Button>{result ? <FormMessage result={result} /> : null}</div>;
}
