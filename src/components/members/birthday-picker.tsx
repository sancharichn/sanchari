"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function daysInMonth(month: number) {
  // February 29 is valid for birthday wishes: the delivery job only sends it in leap years.
  return month === 2 ? 29 : [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function BirthdayPicker({
  id,
  month,
  day,
  onChange,
  error,
  compact = false,
}: {
  id: string;
  month: number | null;
  day: number | null;
  onChange: (month: number | null, day: number | null) => void;
  error?: string;
  compact?: boolean;
}) {
  const days = month ? daysInMonth(month) : 31;
  const updateMonth = (next: number | null) => onChange(next, next && day && day > daysInMonth(next) ? null : day);
  return <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_auto] sm:items-end"}>
    <label className="grid gap-1.5 text-sm font-semibold text-mist" htmlFor={`${id}-month`}>
      <span className={compact ? "sr-only" : undefined}>Birthday month</span>
      <NativeSelect id={`${id}-month`} aria-label={compact ? "Birthday month" : undefined} value={month?.toString() ?? ""} onChange={(event) => updateMonth(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Month</option>
        {MONTHS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
      </NativeSelect>
    </label>
    <label className="grid gap-1.5 text-sm font-semibold text-mist" htmlFor={`${id}-day`}>
      <span className={compact ? "sr-only" : undefined}>Birthday day</span>
      <NativeSelect id={`${id}-day`} aria-label={compact ? "Birthday day" : undefined} value={day?.toString() ?? ""} disabled={!month} onChange={(event) => onChange(month, event.target.value ? Number(event.target.value) : null)}>
        <option value="">Day</option>
        {Array.from({ length: days }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
      </NativeSelect>
    </label>
    {!compact && (month || day) ? <Button type="button" size="sm" variant="outline" className="h-11" onClick={() => onChange(null, null)}>Clear</Button> : null}
    {error ? <p className="col-span-full text-sm text-ember">{error}</p> : null}
  </div>;
}

/** Local preview only; it demonstrates the picker without touching a profile. */
export function BirthdayPickerDemo() {
  const [birthday, setBirthday] = useState<{ month: number | null; day: number | null }>({ month: 9, day: 14 });
  const [familyBirthday, setFamilyBirthday] = useState<{ month: number | null; day: number | null }>({ month: 2, day: 29 });
  return <div className="grid max-w-xl gap-7 rounded-panel border border-ridge bg-basalt p-5 sm:p-6"><div><h2 className="font-semibold text-mist">Your birthday</h2><p className="mt-1 text-sm text-lichen">Optional, for a private birthday wish.</p><div className="mt-4"><BirthdayPicker id="preview-birthday" month={birthday.month} day={birthday.day} onChange={(month, day) => setBirthday({ month, day })} /></div></div><div className="border-t border-ridge pt-6"><h2 className="font-semibold text-mist">Family member</h2><p className="mt-1 text-sm text-lichen">February automatically offers 29 days; other months show their real number of days.</p><div className="mt-4 max-w-sm"><BirthdayPicker compact id="preview-family-birthday" month={familyBirthday.month} day={familyBirthday.day} onChange={(month, day) => setFamilyBirthday({ month, day })} /></div></div></div>;
}
