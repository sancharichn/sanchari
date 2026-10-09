"use client";

import { sendBirthdayTestEmail } from "@/actions/birthdays";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

export function BirthdayTestSend() {
  const { pending, result, run } = useActionRunner();
  return <div className="rounded-2xl border border-signal/25 bg-signal/[.05] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-bold text-mist">Test delivery</h2><p className="mt-1 max-w-xl text-sm text-lichen">Send one sample birthday card to the organiser inbox before enabling automatic wishes.</p></div>
      <Button type="button" size="sm" disabled={pending} onClick={() => void run(sendBirthdayTestEmail)}>{pending ? "Sending…" : "Send test card"}</Button>
    </div>
    <div className="mt-3"><FormMessage result={result} /></div>
  </div>;
}
