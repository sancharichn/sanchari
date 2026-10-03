import { z } from "zod";

/** Shapes for member input, shared by the forms (for hints) and the server actions (for enforcement). */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const phone = z
  .string()
  .trim()
  .min(1, "Add a phone number.")
  .max(20, "That phone number is too long.")
  .refine((v) => /^\+?[\d\s()-]+$/.test(v), "Use digits, spaces or dashes, with an optional + at the start.")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 10 && digits <= 15;
  }, "A phone number has 10 to 15 digits.");

export const profileSchema = z.object({
  phone,
  emergencyContact: z
    .string()
    .trim()
    .min(5, "Add the name and phone number of someone we can call in an emergency.")
    .max(120, "Keep this under 120 characters."),
  bloodGroup: z
    .union([z.enum(BLOOD_GROUPS), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export const registrationSchema = profileSchema.extend({
  vehicleDetails: z
    .string()
    .trim()
    .max(200, "Keep vehicle details under 200 characters.")
    .optional()
    .transform((v) => (v ? v : null)),
});

export const feedbackSchema = z.object({
  tripId: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : null)),
  rating: z.coerce
    .number({ invalid_type_error: "Pick a rating from 1 to 5." })
    .int()
    .min(1, "Pick a rating from 1 to 5.")
    .max(5, "Pick a rating from 1 to 5."),
  comment: z
    .string()
    .trim()
    .min(10, "Write at least a sentence.")
    .max(1000, "Keep it under 1,000 characters."),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type RegistrationInput = z.input<typeof registrationSchema>;
export type FeedbackInput = z.input<typeof feedbackSchema>;
