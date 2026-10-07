"use client";
import { saveFeedbackFollowUp } from "@/actions/operations";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/form";

export function FeedbackFollowUp({ id, status, note }: { id: string; status: string; note: string | null }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-3 grid gap-3" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(() => saveFeedbackFollowUp(id, String(data.get("status")), String(data.get("note")))); }}>
    <label>Follow-up status<NativeSelect name="status" defaultValue={status}><option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></NativeSelect></label>
    <label>Private organiser notes<Textarea name="note" defaultValue={note ?? ""} maxLength={4000} /></label>
    <Button disabled={pending} size="sm">Save follow-up</Button><FormMessage result={result} />
  </form>;
}
