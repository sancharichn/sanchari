"use client";
import { useState } from "react";
import { createTripIncident, createTripTask, toggleTripTask } from "@/actions/admin";
import { resolveIncident, saveTaskDetails } from "@/actions/operations";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Input, Textarea, NativeSelect } from "@/components/ui/form";

export function TripTaskControls({ tripId }: { tripId: string }) {
  const [title, setTitle] = useState("");
  const { run, pending, result } = useActionRunner();
  return <form className="mt-6 grid gap-3" onSubmit={(e) => { e.preventDefault(); void run(() => createTripTask(tripId, title), () => setTitle("")); }}>
    <label>New task<Input required minLength={3} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Confirm transport" /></label>
    <Button disabled={pending} className="w-fit">Add task</Button><FormMessage result={result} />
  </form>;
}
export function TaskToggle({ id, completed }: { id: string; completed: boolean }) {
  const { run, pending, result } = useActionRunner();
  return <div><Button size="sm" variant="outline" disabled={pending} onClick={() => void run(() => toggleTripTask(id, !completed))}>{completed ? "Reopen" : "Complete"}</Button><FormMessage result={result} /></div>;
}
export function TaskEditor({ id, title, ownerId, dueAt, organisers }: { id: string; title: string; ownerId: string; dueAt: string; organisers: Array<{ id: string; label: string }> }) {
  const { run, pending, result } = useActionRunner();
  return <details className="mt-3"><summary className="cursor-pointer text-sm text-signal">Edit assignment and deadline</summary><form className="mt-3 grid gap-3" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(() => saveTaskDetails(id, Object.fromEntries(data))); }}>
    <label>Task<Input name="title" defaultValue={title} required maxLength={160} /></label>
    <label>Owner<NativeSelect name="ownerId" defaultValue={ownerId}><option value="">Unassigned</option>{organisers.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</NativeSelect></label>
    <label>Due date<Input type="date" name="dueAt" defaultValue={dueAt} /></label><Button disabled={pending}>Save task</Button><FormMessage result={result} />
  </form></details>;
}
export function IncidentControls({ tripId }: { tripId: string }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-6 grid gap-3 rounded-xl border border-ridge p-4" onSubmit={(e) => {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form);
    void run(() => createTripIncident(tripId, String(data.get("title")), String(data.get("description")), String(data.get("severity"))), () => form.reset());
  }}>
    <label>Incident title<Input name="title" required minLength={3} maxLength={160} /></label>
    <label>Severity<NativeSelect name="severity" defaultValue="MEDIUM">{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s}>{s}</option>)}</NativeSelect></label>
    <label>What happened?<Textarea name="description" required minLength={5} maxLength={4000} /></label>
    <Button disabled={pending} className="w-fit">Log incident</Button><FormMessage result={result} />
  </form>;
}
export function IncidentClose({ id, actionTaken = "", closed = false }: { id: string; actionTaken?: string; closed?: boolean }) {
  const { run, pending, result } = useActionRunner();
  return <form className="mt-4 grid gap-2" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(() => resolveIncident(id, String(data.get("actionTaken")), data.get("closed") === "on")); }}>
    <label>Follow-up and resolution<Textarea name="actionTaken" defaultValue={actionTaken} required minLength={5} maxLength={4000} /></label>
    <label className="flex gap-2"><input type="checkbox" name="closed" defaultChecked={closed} />Resolved</label>
    <Button size="sm" disabled={pending} className="w-fit">Save follow-up</Button><FormMessage result={result} />
  </form>;
}
