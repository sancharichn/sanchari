"use client";

import Link from "next/link";
import { Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { FAMILY_BLOOD_GROUPS, FAMILY_RELATIONSHIPS, type CompanionInput } from "@/lib/family";

export type FamilyMemberInput = CompanionInput & { key: string; savedMemberId?: string };

type SavedFamilyMember = {
  id: string;
  name: string;
  relationship: string;
};

type Props = {
  members: FamilyMemberInput[];
  onChange: (members: FamilyMemberInput[]) => void;
  errors: Record<string, string>;
  familyConsent: boolean;
  parentalConsent: boolean;
  onFamilyConsent: (checked: boolean) => void;
  onParentalConsent: (checked: boolean) => void;
  savedMembers?: SavedFamilyMember[];
};

export function FamilyFields({ members, onChange, errors, familyConsent, parentalConsent, onFamilyConsent, onParentalConsent, savedMembers = [] }: Props) {
  const update = (key: string, field: keyof CompanionInput, value: string) => {
    onChange(members.map((member) => member.key === key ? { ...member, [field]: value } : member));
  };
  const children = members.filter((member) => member.age.trim() !== "" && Number(member.age) >= 0 && Number(member.age) < 18).length;

  return (
    <section aria-labelledby="family-heading" className="rounded-panel border border-ridge bg-night/30 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-mist">
        <Users className="size-5 text-signal" aria-hidden="true" />
        <h3 id="family-heading" className="font-semibold">Travelling with family?</h3>
      </div>
      <p className="mt-2 text-sm text-lichen">Add each accompanying adult and child. You are already included as the registering adult.</p>
      <p className="mt-2 text-xs leading-relaxed text-lichen">Every person counts toward capacity and the equal per-person cost split. Your family is confirmed or waitlisted together. Children can join family-friendly trips under direct parental supervision; check with the organiser that this trip is suitable.</p>
      {savedMembers.length > 0 ? (
        <div className="mt-5 rounded-xl border border-signal/25 bg-signal/5 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-mist">Your saved family</p>
            <Link href="/profile" className="text-xs font-semibold text-signal underline underline-offset-4">Manage family</Link>
          </div>
          <p className="mt-1 text-xs text-lichen">Add them in one tap. Confirm their current age for this trip, since we do not store birth years.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {savedMembers.map((person) => {
              const added = members.some((member) => member.savedMemberId === person.id);
              return <Button key={person.id} type="button" variant={added ? "ghost" : "outline"} size="sm" disabled={added || members.length >= 19} onClick={() => onChange([...members, { key: crypto.randomUUID(), savedMemberId: person.id, name: person.name, relationship: person.relationship, age: "", bloodGroup: "" }])}>
                {added ? `${person.name} added` : `Add ${person.name}`}
              </Button>;
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4">
        {members.map((member, index) => (
          <fieldset key={member.key} className="min-w-0 rounded-xl border border-ridge p-4">
            <legend className="px-1 text-sm font-semibold text-mist">Family member {index + 1}</legend>
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="ghost" size="sm" aria-label={`Remove family member ${index + 1}`} onClick={() => onChange(members.filter((m) => m.key !== member.key))}>
                <X className="size-4" aria-hidden="true" /> Remove
              </Button>
            </div>
            <div className="grid gap-4">
              {([['name', 'Full name'], ['age', 'Age in completed years']] as const).map(([field, label]) => {
                const id = `family-${member.key}-${field}`;
                const error = errors[`companions.${index}.${field}`];
                return (
                  <Field key={field} label={label} htmlFor={id} error={error} hint={field === 'age' ? 'Use 0 for a child under one year. Please confirm this for each trip.' : undefined}>
                    <Input id={id} value={member[field]} required type={field === 'age' ? 'number' : 'text'} min={field === 'age' ? 0 : undefined} max={field === 'age' ? 120 : undefined} step={field === 'age' ? 1 : undefined} maxLength={field === 'name' ? 100 : 60} inputMode={field === 'age' ? 'numeric' : undefined} onChange={(event) => update(member.key, field, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : field === 'age' ? `${id}-hint` : undefined} />
                  </Field>
                );
              })}
              <Field label="Relationship to you" htmlFor={`family-${member.key}-relationship`} error={errors[`companions.${index}.relationship`]}>
                <NativeSelect id={`family-${member.key}-relationship`} value={member.relationship} required onChange={(event) => update(member.key, "relationship", event.target.value)}>
                  <option value="">Choose relationship</option>
                  {!FAMILY_RELATIONSHIPS.includes(member.relationship as typeof FAMILY_RELATIONSHIPS[number]) && member.relationship ? <option value={member.relationship}>{member.relationship}</option> : null}
                  {FAMILY_RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Blood group (optional)" htmlFor={`family-${member.key}-blood`} error={errors[`companions.${index}.bloodGroup`]}>
                <NativeSelect id={`family-${member.key}-blood`} value={member.bloodGroup} onChange={(event) => update(member.key, 'bloodGroup', event.target.value)}>
                  <option value="">Prefer not to say</option>
                  {FAMILY_BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </NativeSelect>
              </Field>
              {member.age.trim() !== "" && Number(member.age) < 18 && Number(member.age) >= 0 ? <p className="text-xs text-signal">Child · travelling under your supervision</p> : null}
            </div>
          </fieldset>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-4" disabled={members.length >= 19} onClick={() => onChange([...members, { key: crypto.randomUUID(), name: "", age: "", relationship: "", bloodGroup: "" }])}>
        <Plus className="size-4" aria-hidden="true" /> Add family member
      </Button>
      {errors.companions ? <p role="alert" className="mt-2 text-sm text-ember">{errors.companions}</p> : null}
      <p aria-live="polite" className="mt-4 text-sm font-semibold text-mist">{members.length + 1} {members.length ? "people" : "person"} in this registration{children ? ` · ${children} ${children === 1 ? "child" : "children"}` : ""}</p>
      {members.length > 0 ? (
        <div className="mt-4 grid gap-4">
          <Consent id="family-permission" checked={familyConsent} onChange={onFamilyConsent} error={errors.familyConsent}>
            I have permission to register these family members, share their details with organisers, and confirm that everyone will follow the trip guidelines.
          </Consent>
          {children > 0 ? (
            <Consent id="family-parent" checked={parentalConsent} onChange={onParentalConsent} error={errors.parentalConsent}>
              I am the parent or legal guardian of every child listed and will accompany and directly supervise them throughout the trip.
            </Consent>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Consent({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-mist" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="mt-1 size-4 shrink-0 accent-[#FFE600]" />
        <span>{children}</span>
      </label>
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-ember">{error}</p> : null}
    </div>
  );
}
