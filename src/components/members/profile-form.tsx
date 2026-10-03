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
      <FormMessage result={result} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}
