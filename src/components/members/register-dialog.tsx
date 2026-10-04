"use client";

import { useState } from "react";
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

export type ProfileDefaults = {
  phone: string | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
};

export function RegisterDialog({
  tripId,
  tripTitle,
  profile,
}: {
  tripId: string;
  tripTitle: string;
  profile: ProfileDefaults;
}) {
  const [open, setOpen] = useState(false);
  const { pending, result, setResult, run, fieldErrors } = useActionRunner();
  const [values, setValues] = useState({
    phone: profile.phone ?? "",
    emergencyContact: profile.emergencyContact ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    vehicleDetails: "",
    agreesToGuidelines: false,
  });

  const set = (key: "phone" | "emergencyContact" | "bloodGroup" | "vehicleDetails") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const describe = (id: string, error?: string) => (error ? `${id}-error` : `${id}-hint`);

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
      <DialogContent>
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
              void run(() => registerForTrip(tripId, values));
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
