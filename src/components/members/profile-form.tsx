"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/member";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { BLOOD_GROUPS } from "@/lib/validation";
import type { ProfileDefaults } from "./register-dialog";

export function ProfileForm({ profile }: { profile: ProfileDefaults }) {
  const { pending, result, run, fieldErrors } = useActionRunner();
  const [values, setValues] = useState({
    phone: profile.phone ?? "",
    emergencyContact: profile.emergencyContact ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    birthdayMonth: profile.birthdayMonth?.toString() ?? "",
    birthdayDay: profile.birthdayDay?.toString() ?? "",
    image: profile.image ?? "",
    familyMembers: profile.familyMembers ?? [],
  });
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form
      noValidate
      className="grid max-w-xl gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => updateProfile(values));
      }}
    >
      <Field label="Phone" htmlFor="profile-phone" error={fieldErrors.phone}>
        <Input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={set("phone")}
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? "profile-phone-error" : undefined}
        />
      </Field>
      <Field
        label="Emergency contact"
        htmlFor="profile-emergency"
        hint="Name and phone number, for example: Priya (sister), 98400 12345"
        error={fieldErrors.emergencyContact}
      >
        <Input
          id="profile-emergency"
          value={values.emergencyContact}
          onChange={set("emergencyContact")}
          aria-invalid={Boolean(fieldErrors.emergencyContact)}
          aria-describedby={fieldErrors.emergencyContact ? "profile-emergency-error" : "profile-emergency-hint"}
        />
      </Field>
      <Field label="Blood group" htmlFor="profile-blood" hint="Optional." error={fieldErrors.bloodGroup}>
        <NativeSelect id="profile-blood" value={values.bloodGroup} onChange={set("bloodGroup")}>
          <option value="">Prefer not to say</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <fieldset className="grid gap-4 rounded-panel border border-ridge bg-night/30 p-5">
        <legend className="px-1 font-semibold text-mist">Birthday wishes</legend>
        <p className="text-sm text-lichen">Optional. We store only the day and month so organisers can send a private birthday wish. No birth year is collected.</p>
        <Field label="Profile photo URL" htmlFor="profile-image" hint="Optional. Your existing Google profile photo can be used automatically."><Input id="profile-image" type="url" placeholder="https://…" value={values.image} onChange={set("image")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Birthday month" htmlFor="profile-birthday-month" error={fieldErrors.birthdayMonth}>
            <Input id="profile-birthday-month" type="number" min={1} max={12} value={values.birthdayMonth} onChange={set("birthdayMonth")} />
          </Field>
          <Field label="Birthday day" htmlFor="profile-birthday-day" error={fieldErrors.birthdayDay}>
            <Input id="profile-birthday-day" type="number" min={1} max={31} value={values.birthdayDay} onChange={set("birthdayDay")} />
          </Field>
        </div>
        <p className="text-sm font-semibold text-mist">Family birthdays</p>
        {values.familyMembers.map((member, index) => <div key={member.id || index} className="grid gap-3 rounded-xl border border-ridge p-4 sm:grid-cols-4">
          <Input aria-label={`Family member ${index + 1} name`} placeholder="Name" value={member.name} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, name: e.target.value } : m) }))} />
          <Input aria-label={`Family member ${index + 1} relationship`} placeholder="Relationship" value={member.relationship} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, relationship: e.target.value } : m) }))} />
          <Input aria-label={`Family member ${index + 1} birthday month`} type="number" min={1} max={12} placeholder="Month" value={member.birthdayMonth ?? ""} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, birthdayMonth: e.target.value ? Number(e.target.value) : null } : m) }))} />
          <Input aria-label={`Family member ${index + 1} birthday day`} type="number" min={1} max={31} placeholder="Day" value={member.birthdayDay ?? ""} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, birthdayDay: e.target.value ? Number(e.target.value) : null } : m) }))} />
          <Input aria-label={`Family member ${index + 1} photo URL`} type="url" placeholder="Photo URL (optional)" value={member.image ?? ""} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, image: e.target.value || null } : m) }))} />
        </div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => setValues((v) => ({ ...v, familyMembers: [...v.familyMembers, { id: crypto.randomUUID(), name: "", relationship: "", birthdayMonth: null, birthdayDay: null, image: null }] }))}>Add family member</Button>
      </fieldset>
      <FormMessage result={result} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}
