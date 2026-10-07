import { z } from "zod";
import { companionSchema } from "./family";

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

const optionalBirthday = (max: number) => z.preprocess((v) => v === "" || v === undefined ? null : v, z.coerce.number().int().min(1).max(max).nullable());
const profileImage = z.preprocess((v) => v === "" ? null : v, z.string().max(400000).refine((v) => /^https:\/\//.test(v) || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v), "Choose a JPEG photo or HTTPS image URL.").nullable().optional());
const profileFields = {
  image: profileImage,
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
  birthdayMonth: optionalBirthday(12),
  birthdayDay: optionalBirthday(31),
  familyMembers: z.array(z.object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(100),
    relationship: z.string().trim().min(2).max(60),
    birthdayMonth: optionalBirthday(12),
    birthdayDay: optionalBirthday(31),
    image: profileImage,
  })).max(20).optional().default([]),
} as const;

export const profileSchema = z.object(profileFields).superRefine((value, ctx) => {
  if ((value.image?.length ?? 0) + value.familyMembers.reduce((n, member) => n + (member.image?.length ?? 0), 0) > 3000000) ctx.addIssue({ code: "custom", path: ["image"], message: "Combined photos are too large. Use smaller photos." });
  const check = (month: number | null, day: number | null, path: (string | number)[]) => {
    if ((month === null) !== (day === null) || (month !== null && day !== null && new Date(Date.UTC(2000, month - 1, day)).getUTCMonth() !== month - 1)) ctx.addIssue({ code: "custom", path, message: "Choose a valid day and month, or leave both blank." });
  };
  check(value.birthdayMonth, value.birthdayDay, ["birthdayDay"]);
  value.familyMembers.forEach((member, index) => check(member.birthdayMonth, member.birthdayDay, ["familyMembers", index, "birthdayDay"]));
  if ((value.birthdayMonth && !value.birthdayDay) || (!value.birthdayMonth && value.birthdayDay)) {
    ctx.addIssue({ code: "custom", path: ["birthdayDay"], message: "Add both birthday month and day, or leave both blank." });
  }
});

export const registrationSchema = z.object({ ...profileFields,
  carpoolChoice: z.enum(["NONE", "NEED_RIDE", "OFFER_RIDE"]).default("NONE"),
  carpoolLocation: z.string().trim().max(120, "Keep the location under 120 characters.").optional().transform((v) => v || null),
  carpoolSeats: z.preprocess((v) => v === "" || v === undefined ? null : v, z.coerce.number().int().min(1).max(20).nullable()),
  companions: z.array(companionSchema).max(19, "For a group larger than 20, contact the organiser.").default([]),
  familyConsent: z.boolean().optional().default(false),
  parentalConsent: z.boolean().optional().default(false),
  vehicleDetails: z
    .string()
    .trim()
    .max(200, "Keep vehicle details under 200 characters.")
    .optional()
    .transform((v) => (v ? v : null)),
  // Adults only, and everyone on a trip follows the guidelines (see /faq#guidelines).
  agreesToGuidelines: z.literal(true, {
    errorMap: () => ({ message: "Tick this box to register. Everyone on a trip agrees to the guidelines." }),
  }),
}).superRefine((value, ctx) => {
  if ((value.birthdayMonth && !value.birthdayDay) || (!value.birthdayMonth && value.birthdayDay)) {
    ctx.addIssue({ code: "custom", path: ["birthdayDay"], message: "Add both birthday month and day, or leave both blank." });
  }
  if (value.carpoolChoice !== "NONE" && !value.carpoolLocation) ctx.addIssue({ code: "custom", path: ["carpoolLocation"], message: "Add where you are travelling from." });
  if (value.carpoolChoice !== "NONE" && !value.carpoolSeats) ctx.addIssue({ code: "custom", path: ["carpoolSeats"], message: "Add the number of seats needed or available." });
  if (value.companions.length && !value.familyConsent) {
    ctx.addIssue({ code: "custom", path: ["familyConsent"], message: "Confirm permission to register your family and share their details." });
  }
  if (value.companions.some((person) => person.age < 18) && !value.parentalConsent) {
    ctx.addIssue({ code: "custom", path: ["parentalConsent"], message: "Confirm that you are the accompanying parent or legal guardian." });
  }
});

export const feedbackSchema = z.object({
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

/* ----------------------------------------------------------------------------
 * Organiser input
 * ------------------------------------------------------------------------- */

const dateInput = (message: string) => z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, message);

const rupees = (message: string) => z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/, message);

export const TRIP_STATUS_VALUES = ["DRAFT", "OPEN", "WAITLIST", "FULL", "ONGOING", "COMPLETED", "ARCHIVED"] as const;
export const TRIP_KIND_VALUES = ["MEETUP", "DAY_TRIP", "STAY_BACK", "INTERNATIONAL", "TREK"] as const;

export const tripSchema = z
  .object({
    title: z.string().trim().min(3, "Give the trip a name.").max(120, "Keep the name under 120 characters."),
    kind: z.enum(TRIP_KIND_VALUES, { errorMap: () => ({ message: "Pick what kind of trip this is." }) }),
    coverPhotoId: z
      .union([z.literal(""), z.string().regex(/^(site:[a-z0-9-]+\.jpg|[A-Za-z0-9_-]{10,200})$/, "Pick a photo from the list.")])
      .optional()
      .transform((v) => (v ? v : null)),
    location: z.string().trim().min(2, "Add where the trip goes.").max(120, "Keep the place under 120 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Describe the trip in a sentence or two.")
      .max(5000, "Keep the description under 5,000 characters."),
    startDate: dateInput("Pick the start date."),
    endDate: dateInput("Pick the end date."),
    maxCapacity: z.coerce
      .number({ invalid_type_error: "Enter the number of seats." })
      .int("Seats must be a whole number.")
      .min(1, "A trip needs at least one seat.")
      .max(500, "That's more than 500 seats."),
    budgetEst: z
      .union([z.literal(""), rupees("Enter an amount like 4500 or 4500.50.")])
      .optional()
      .transform((v) => (v ? v : null)),
    adultBudgetEst: z.union([z.literal(""), rupees("Enter an adult amount like 4500 or 4500.50.")]).optional().transform((v) => (v ? v : null)),
    childBudgetEst: z.union([z.literal(""), rupees("Enter a child amount like 2500 or 2500.50.")]).optional().transform((v) => (v ? v : null)),
    status: z.enum(TRIP_STATUS_VALUES).optional(),
    itinerary: z
      .array(
        z.object({
          title: z.string().trim().max(120, "Keep each day's title under 120 characters."),
          details: z.string().trim().max(2000, "Keep each day's details under 2,000 characters."),
        }),
      )
      .max(30, "Up to 30 days."),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "The trip can't end before it starts." });
    }
    value.itinerary.forEach((day, i) => {
      if (!day.title && day.details) {
        ctx.addIssue({ code: "custom", path: ["itinerary", i, "title"], message: `Give day ${i + 1} a title.` });
      }
    });
  })
  .transform((value) => ({
    ...value,
    // Fully empty days are dropped rather than saved.
    itinerary: value.itinerary.filter((day) => day.title),
  }));

export type TripFormInput = z.input<typeof tripSchema>;

export const EXPENSE_CATEGORIES = ["Transport", "Stay", "Food", "Permits and fees", "Gear", "Other"] as const;

export const expenseSchema = z.object({
  title: z.string().trim().min(2, "Say what the expense was for.").max(120, "Keep it under 120 characters."),
  category: z.enum(EXPENSE_CATEGORIES, { errorMap: () => ({ message: "Pick a category." }) }),
  amount: rupees("Enter an amount like 1200 or 1200.50.").refine((v) => Number(v) > 0, "Enter an amount above zero."),
  paidById: z.string().trim().min(1, "Pick who paid."),
  receiptUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .url("Enter a full link, starting with https://")
        .refine((v) => v.startsWith("https://"), "Use an https:// link."),
    ])
    .optional()
    .transform((v) => (v ? v : null)),
});

export type ExpenseFormInput = z.input<typeof expenseSchema>;
