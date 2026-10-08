import { z } from "zod";

export const FAMILY_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const FAMILY_RELATIONSHIPS = ["Spouse or partner", "Child", "Parent", "Sibling", "Grandparent", "Grandchild", "Relative", "Friend", "Other"] as const;
export const companionSchema = z.object({
  name: z.string().trim().min(2, "Add their full name.").max(100, "Keep the name under 100 characters."),
  age: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "") || v === null || v === undefined || typeof v === "boolean" ? undefined : v,
    z.coerce.number({ invalid_type_error: "Add their age in completed years (0 for a baby)." }).int("Use whole years.").min(0).max(120, "Check their age."),
  ),
  relationship: z.string().trim().min(2, "Add their relationship to you.").max(60, "Keep this under 60 characters."),
  bloodGroup: z.union([z.enum(FAMILY_BLOOD_GROUPS), z.literal("")]).optional().transform((v) => v || null),
});

export type Companion = z.output<typeof companionSchema>;
export type CompanionInput = { name: string; age: string; relationship: string; bloodGroup: string };

/** Only read validated entries; old registrations have no accompanying people. */
export function readCompanions(value: unknown): Companion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    // Persisted optional blood groups use null, while form inputs use an empty string.
    const normalized = entry && typeof entry === "object" ? { ...entry, bloodGroup: entry.bloodGroup ?? "" } : entry;
    const parsed = companionSchema.safeParse(normalized);
    return parsed.success ? [parsed.data] : [];
  });
}

export function partySize(registration: { partySize?: number }): number {
  const size = registration.partySize;
  return typeof size === "number" && Number.isInteger(size) && size > 0 ? size : 1;
}

export function countTravellers(registrations: Array<{ partySize?: number }>): number {
  return registrations.reduce((total, r) => total + partySize(r), 0);
}
