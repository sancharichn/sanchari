"use client";

import { useState } from "react";
import type { PaymentStatus } from "@prisma/client";
import { setRegistrationApproval, updateRegistration } from "@/actions/admin";
import { useActionRunner } from "@/components/forms/use-action-runner";
import { PAYMENT_LABEL, PAYMENT_STATUSES } from "@/lib/trips";
import { cn } from "@/lib/utils";

/** Payment status for one registration; saves as soon as it changes. */
export function PaymentSelect({
  registrationId,
  status,
  memberName,
}: {
  registrationId: string;
  status: PaymentStatus;
  memberName: string;
}) {
  const [value, setValue] = useState(status);
  const { pending, result, run } = useActionRunner();

  return (
    <div className="grid gap-1">
      <select
        aria-label={`Payment status for ${memberName}`}
        value={value}
        disabled={pending}
        onChange={async (e) => {
          const next = e.target.value as PaymentStatus;
          const previous = value;
          setValue(next);
          const res = await run(() => updateRegistration(registrationId, { paymentStatus: next }));
          if (!res.ok) setValue(previous);
        }}
        className={cn(
          "h-9 rounded-[8px] border bg-night px-2 text-sm text-mist focus-visible:border-signal focus-visible:outline-none",
          value === "PAID" ? "border-signal/70" : "border-ridge",
        )}
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PAYMENT_LABEL[s]}
          </option>
        ))}
      </select>
      {result && !result.ok ? (
        <span role="alert" className="text-xs text-ember">
          {result.message}
        </span>
      ) : null}
    </div>
  );
}

/** The gear-check tick for one registration; saves as soon as it changes. */
export function GearToggle({
  registrationId,
  checked,
  memberName,
}: {
  registrationId: string;
  checked: boolean;
  memberName: string;
}) {
  const [value, setValue] = useState(checked);
  const { pending, result, run } = useActionRunner();

  return (
    <div className="grid gap-1">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[#E6D65C]"
          checked={value}
          disabled={pending}
          onChange={async (e) => {
            const next = e.target.checked;
            setValue(next);
            const res = await run(() => updateRegistration(registrationId, { gearChecked: next }));
            if (!res.ok) setValue(!next);
          }}
        />
        <span className={value ? "text-mist" : "text-lichen"}>{value ? "Checked" : "Not yet"}</span>
        <span className="sr-only">gear check for {memberName}</span>
      </label>
      {result && !result.ok ? (
        <span role="alert" className="text-xs text-ember">
          {result.message}
        </span>
      ) : null}
    </div>
  );
}

export function ApprovalSelect({ registrationId, status }: { registrationId: string; status: "PENDING" | "APPROVED" | "DECLINED" }) {
  const { run, pending, result } = useActionRunner();
  return <div className="grid gap-1"><select aria-label="Registration approval" disabled={pending} value={status} className="rounded border border-ridge bg-night px-2 py-1 text-sm" onChange={(event) => void run(() => setRegistrationApproval(registrationId, event.target.value))}><option value="PENDING">Pending review</option><option value="APPROVED">Approved</option><option value="DECLINED">Declined</option></select>{result && !result.ok ? <span className="text-xs text-ember">{result.message}</span> : null}</div>;
}
