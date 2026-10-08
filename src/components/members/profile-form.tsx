"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/member";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { BLOOD_GROUPS } from "@/lib/validation";
import type { ProfileDefaults } from "./register-dialog";
import { PhotoUpload } from "./photo-upload";
import { BirthdayPicker } from "./birthday-picker";

export function ProfileForm({ profile }: { profile: ProfileDefaults }) {
  const { pending, result, run, fieldErrors } = useActionRunner();
  const [values, setValues] = useState({
    phone: profile.phone ?? "",
    emergencyContact: profile.emergencyContact ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    birthdayMonth: profile.birthdayMonth ?? null,
    birthdayDay: profile.birthdayDay ?? null,
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
        <PhotoUpload label="Your profile photo" value={values.image} onChange={(image) => setValues((v) => ({ ...v, image: image ?? "" }))} />
        {!values.image && <p className="text-sm text-signal">Add a photo to personalise your birthday card. Without one, we use a nature illustration.</p>}
        <BirthdayPicker id="profile-birthday" month={values.birthdayMonth} day={values.birthdayDay} onChange={(birthdayMonth, birthdayDay) => setValues((value) => ({ ...value, birthdayMonth, birthdayDay }))} error={fieldErrors.birthdayMonth ?? fieldErrors.birthdayDay} />
        <p className="text-sm font-semibold text-mist">Family birthdays</p>
        {values.familyMembers.map((member, index) => <div key={member.id || index} className="grid gap-3 rounded-xl border border-ridge p-4 sm:grid-cols-2">
          <Input aria-label={`Family member ${index + 1} name`} placeholder="Name" value={member.name} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, name: e.target.value } : m) }))} />
          <Input aria-label={`Family member ${index + 1} relationship`} placeholder="Relationship" value={member.relationship} onChange={(e) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, relationship: e.target.value } : m) }))} />
          <div className="sm:col-span-2"><BirthdayPicker compact id={`family-${member.id || index}-birthday`} month={member.birthdayMonth} day={member.birthdayDay} error={fieldErrors[`familyMembers.${index}.birthdayDay`]} onChange={(birthdayMonth, birthdayDay) => setValues((value) => ({ ...value, familyMembers: value.familyMembers.map((item, itemIndex) => itemIndex === index ? { ...item, birthdayMonth, birthdayDay } : item) }))} /></div>
          <div className="sm:col-span-2"><PhotoUpload label={`Photo for family member ${index + 1}`} value={member.image} onChange={(image) => setValues((v) => ({ ...v, familyMembers: v.familyMembers.map((m, i) => i === index ? { ...m, image } : m) }))} /></div>
          <Button type="button" variant="outline" size="sm" onClick={() => setValues((v) => ({ ...v, familyMembers: v.familyMembers.filter((_, i) => i !== index) }))}>Remove</Button>
        </div>)}
        <Button type="button" variant="outline" size="sm" disabled={values.familyMembers.length >= 20} onClick={() => setValues((v) => ({ ...v, familyMembers: [...v.familyMembers, { id: crypto.randomUUID(), name: "", relationship: "", birthdayMonth: null, birthdayDay: null, image: null }] }))}>Add family member</Button>
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
