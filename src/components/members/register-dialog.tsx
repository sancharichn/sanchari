"use client";

import { useState } from "react";
import { FamilyFields, type FamilyMemberInput } from "./family-fields";
import { registrationSchema } from "@/lib/validation";
import { invalid } from "@/lib/action-result";
import { ExternalLink } from "lucide-react";
import { registerForTrip } from "@/actions/member";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import { BLOOD_GROUPS } from "@/lib/validation";
import { formatINR } from "@/lib/format";

export type ProfileDefaults = {
  phone: string | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
};

export function RegisterDialog({
  tripId,
  tripTitle,
  profile,
  adultPrice,
  childPrice,
}: {
  tripId: string;
  tripTitle: string;
  profile: ProfileDefaults;
  adultPrice: string | null;
  childPrice: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMemberInput[]>([]);
  const [familyConsent, setFamilyConsent] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);
  const { pending, result, setResult, run, fieldErrors } = useActionRunner();
  const [values, setValues] = useState({
    phone: profile.phone ?? "",
    emergencyContact: profile.emergencyContact ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    vehicleDetails: "",
    carpoolChoice: "NONE" as "NONE" | "NEED_RIDE" | "OFFER_RIDE",
    carpoolLocation: "",
    carpoolSeats: "",
    agreesToGuidelines: false,
  });

  const set = (key: "phone" | "emergencyContact" | "bloodGroup" | "vehicleDetails" | "carpoolChoice" | "carpoolLocation" | "carpoolSeats") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const describe = (id: string, error?: string) => (error ? `${id}-error` : `${id}-hint`);
  const familyTotal = members.reduce((total, member) => {
    const isChild = member.age.trim() !== "" && Number(member.age) < 18;
    return total + Number(isChild ? childPrice ?? adultPrice ?? 0 : adultPrice ?? 0);
  }, Number(adultPrice ?? 0));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">Register for this trip</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Register for {tripTitle}</DialogTitle>
          <DialogDescription>
            Organisers use these details to plan rides and to reach someone if anything goes wrong. Only organisers can
            see them.
          </DialogDescription>
        </DialogHeader>

        {result?.ok ? (
          <div className="grid gap-6">
            <FormMessage result={result} />
            {members.length > 0 ? <p className="text-sm text-mist">Your registration includes you and {members.length} accompanying family {members.length === 1 ? "member" : "members"}.</p> : null}
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            noValidate
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const input = { ...values, companions: members, familyConsent, parentalConsent };
              const parsed = registrationSchema.safeParse(input);
              if (!parsed.success) {
                setResult(invalid(parsed.error));
                return;
              }
              void run(() => registerForTrip(tripId, input));
            }}
          >
            <Field label="Phone" htmlFor="reg-phone" error={fieldErrors.phone}>
              <Input
                id="reg-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={values.phone}
                onChange={set("phone")}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "reg-phone-error" : undefined}
              />
            </Field>

            <Field
              label="Emergency contact"
              htmlFor="reg-emergency"
              hint="Name and phone number, for example: Priya (sister), 98400 12345"
              error={fieldErrors.emergencyContact}
            >
              <Input
                id="reg-emergency"
                required
                value={values.emergencyContact}
                onChange={set("emergencyContact")}
                aria-invalid={Boolean(fieldErrors.emergencyContact)}
                aria-describedby={describe("reg-emergency", fieldErrors.emergencyContact)}
              />
            </Field>

            <Field
              label="Blood group"
              htmlFor="reg-blood"
              hint="Optional. Useful if something goes wrong on the trail."
              error={fieldErrors.bloodGroup}
            >
              <NativeSelect
                id="reg-blood"
                value={values.bloodGroup}
                onChange={set("bloodGroup")}
                aria-describedby={describe("reg-blood", fieldErrors.bloodGroup)}
              >
                <option value="">Prefer not to say</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label="Getting there"
              htmlFor="reg-vehicle"
              hint="Coming in your own vehicle? Add it and how many free seats you have. Leave blank if you need a seat."
              error={fieldErrors.vehicleDetails}
            >
              <Textarea
                id="reg-vehicle"
                rows={3}
                className="min-h-20"
                value={values.vehicleDetails}
                onChange={set("vehicleDetails")}
                aria-invalid={Boolean(fieldErrors.vehicleDetails)}
                aria-describedby={describe("reg-vehicle", fieldErrors.vehicleDetails)}
              />
            </Field>

            <FamilyFields
              members={members}
              onChange={(next) => { setMembers(next); setFamilyConsent(false); setParentalConsent(false); setResult(null); }}
              errors={fieldErrors}
              familyConsent={familyConsent}
              parentalConsent={parentalConsent}
              onFamilyConsent={setFamilyConsent}
              onParentalConsent={setParentalConsent}
            />
            <section className="rounded-panel border border-ridge bg-night/30 p-4 sm:p-5">
              <h3 className="font-semibold text-mist">Need car pool?</h3>
              <p className="mt-1 text-sm text-lichen">We prefer everyone to reach the destination through shared rides where possible.</p>
              <div className="mt-4 grid gap-4">
                <Field label="Car-pool preference" htmlFor="reg-carpool" error={fieldErrors.carpoolChoice}>
                  <NativeSelect id="reg-carpool" value={values.carpoolChoice} onChange={set("carpoolChoice")}>
                    <option value="NONE">No car pool needed</option>
                    <option value="NEED_RIDE">I need a ride</option>
                    <option value="OFFER_RIDE">I can offer a ride</option>
                  </NativeSelect>
                </Field>
                {values.carpoolChoice !== "NONE" ? <>
                  <Field label="Travelling from" htmlFor="reg-carpool-location" hint="Town, neighbourhood or pickup point" error={fieldErrors.carpoolLocation}>
                    <Input id="reg-carpool-location" value={values.carpoolLocation} onChange={set("carpoolLocation")} />
                  </Field>
                  <Field label={values.carpoolChoice === "OFFER_RIDE" ? "Seats available" : "Seats needed"} htmlFor="reg-carpool-seats" error={fieldErrors.carpoolSeats}>
                    <Input id="reg-carpool-seats" type="number" min={1} max={20} inputMode="numeric" value={values.carpoolSeats} onChange={set("carpoolSeats")} />
                  </Field>
                </> : null}
              </div>
            </section>
            {adultPrice || childPrice ? <p className="rounded-xl border border-signal/30 bg-signal/5 p-4 text-sm text-mist">Estimated trip cost: <strong>{formatINR(String(familyTotal))}</strong><span className="block mt-1 text-xs text-lichen">Adult: {adultPrice ? formatINR(adultPrice) : "—"} · Child: {childPrice ? formatINR(childPrice) : "same as adult"}</span></p> : null}

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-ridge p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal">
                <input
                  type="checkbox"
                  id="reg-guidelines"
                  checked={values.agreesToGuidelines}
                  onChange={(e) => setValues((v) => ({ ...v, agreesToGuidelines: e.target.checked }))}
                  aria-invalid={Boolean(fieldErrors.agreesToGuidelines)}
                  aria-describedby={fieldErrors.agreesToGuidelines ? "reg-guidelines-error" : undefined}
                  className="mt-0.5 size-4 shrink-0 accent-[#FFE600]"
                />
                <span className="text-sm text-mist">
                  I&apos;m 18 or over, and I agree to follow Sanchari&apos;s guidelines: no alcohol, tobacco or drugs, no
                  litter, and the code of conduct.
                </span>
              </label>
              <a
                href="/faq#guidelines"
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-mist underline underline-offset-4 hover:text-signal"
              >
                Read the guidelines
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              {fieldErrors.agreesToGuidelines ? (
                <p id="reg-guidelines-error" className="mt-2 text-sm text-ember">
                  {fieldErrors.agreesToGuidelines}
                </p>
              ) : null}
            </div>

            <FormMessage result={result} />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Not now
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Registering…" : "Register"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
