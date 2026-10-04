import { z } from "zod";

/*
 * Trip feedback: the standard questions every trip asks, the extra questions
 * organisers add per trip, how answers are checked, and how they add up.
 * Shared by the form (for step-by-step checks) and the server (which checks
 * everything again).
 */

/* ----------------------------------------------------------------------------
 * The standard questions
 * ------------------------------------------------------------------------- */

export const ASPECTS = [
  { id: "venue", label: "Venue or stay" },
  { id: "food", label: "Food and refreshments" },
  { id: "travel", label: "Getting there and back" },
  { id: "planning", label: "Planning and timekeeping" },
  { id: "value", label: "Value for money" },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export const SCALE = [
  { value: "EXCELLENT", label: "Excellent", mark: "🌿" },
  { value: "GOOD", label: "Good", mark: "👍" },
  { value: "NEEDS_WORK", label: "Needs improvement", mark: "⚠️" },
] as const;

export type ScaleValue = (typeof SCALE)[number]["value"];
export type AspectAnswer = ScaleValue | "NA";

export const NOT_APPLICABLE_LABEL = "Didn't apply";

export const COME_AGAIN = [
  { value: "YES", label: "Yes, definitely" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NO", label: "Probably not" },
] as const;

export type ComeAgainValue = (typeof COME_AGAIN)[number]["value"];

export const OVERALL_WORDS = ["", "Poor", "Below par", "Good", "Great", "Loved it"] as const;

/* ----------------------------------------------------------------------------
 * Extra questions, set per trip by the organiser
 * ------------------------------------------------------------------------- */

export const EXTRA_TYPES = ["stars", "scale", "choice", "text"] as const;
export type ExtraType = (typeof EXTRA_TYPES)[number];

export const EXTRA_TYPE_LABEL: Record<ExtraType, string> = {
  stars: "Stars, 1 to 5",
  scale: "Excellent / Good / Needs improvement",
  choice: "Pick one option",
  text: "Written answer",
};

export const MAX_EXTRAS = 12;
export const MAX_OPTIONS = 6;

export const extraQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]{6,16}$/, "Invalid question id."),
    type: z.enum(EXTRA_TYPES, { errorMap: () => ({ message: "Pick a question type." }) }),
    label: z.string().trim().min(3, "Write the question.").max(160, "Keep the question under 160 characters."),
    help: z.string().trim().max(200, "Keep the hint under 200 characters.").optional().default(""),
    options: z
      .array(z.string().trim().max(60, "Keep each option under 60 characters."))
      .max(MAX_OPTIONS, `Up to ${MAX_OPTIONS} options.`)
      .optional()
      .default([]),
    required: z.boolean().optional().default(false),
  })
  .transform((q) => ({ ...q, options: q.type === "choice" ? q.options.filter(Boolean) : [] }))
  .superRefine((q, ctx) => {
    if (q.type === "choice" && q.options.length < 2) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Add at least two options." });
    }
    if (new Set(q.options.map((o) => o.toLowerCase())).size !== q.options.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Each option needs to be different." });
    }
  });

export type ExtraQuestion = z.output<typeof extraQuestionSchema>;

export const formSettingsSchema = z
  .object({
    intro: z
      .string()
      .trim()
      .max(400, "Keep the welcome note under 400 characters.")
      .optional()
      .transform((v) => (v ? v : null)),
    questions: z.array(extraQuestionSchema).max(MAX_EXTRAS, `Up to ${MAX_EXTRAS} extra questions.`),
  })
  .superRefine((value, ctx) => {
    const ids = value.questions.map((q) => q.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["questions"], message: "Two questions share an id." });
  });

/** Reads the stored extra questions, dropping anything malformed. */
export function parseExtraQuestions(value: unknown): ExtraQuestion[] {
  if (!Array.isArray(value)) return [];
  const questions: ExtraQuestion[] = [];
  for (const item of value.slice(0, MAX_EXTRAS)) {
    const parsed = extraQuestionSchema.safeParse(item);
    if (parsed.success) questions.push(parsed.data);
  }
  return questions;
}

export function newQuestionId(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("") + Date.now().toString(36).slice(-4);
}

type QuestionDraft = Omit<ExtraQuestion, "id">;

const draft = (type: ExtraType, label: string, extra: Partial<QuestionDraft> = {}): QuestionDraft => ({
  type,
  label,
  help: "",
  options: [],
  required: false,
  ...extra,
});

/** Ready-made extra questions for the usual kinds of trip. */
export const QUESTION_SETS: Array<{ id: string; label: string; description: string; questions: QuestionDraft[] }> = [
  {
    id: "family",
    label: "Family event",
    description: "Games for kids, couples and groups, and ideas for next time.",
    questions: [
      draft("stars", "Kids' games and activities"),
      draft("stars", "Couples' games"),
      draft("stars", "Group and team games"),
      draft("text", "Any game ideas for the next event?"),
    ],
  },
  {
    id: "trek",
    label: "Trek",
    description: "The trail, the guide and safety.",
    questions: [
      draft("choice", "How was the trail?", { options: ["Too easy", "Just right", "Too tough"] }),
      draft("scale", "Guide and trail leadership"),
      draft("scale", "Safety briefing and first aid"),
    ],
  },
  {
    id: "ride",
    label: "Ride",
    description: "The route, the pace, stops and marshalling.",
    questions: [
      draft("stars", "The route"),
      draft("choice", "How was the pace?", { options: ["Too slow", "Just right", "Too fast"] }),
      draft("scale", "Breaks and fuel stops"),
      draft("scale", "Ride marshalling and safety"),
    ],
  },
];

/* ----------------------------------------------------------------------------
 * Checking a response
 * ------------------------------------------------------------------------- */

/** WhatsApp numbers in one form: +91 for 10-digit Indian mobiles, otherwise the full international number. */
export function normaliseWhatsApp(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[+\d\s()-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  if (!trimmed.startsWith("+") && !raw.trim().startsWith("00")) return null;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

const aspectAnswer = z.enum(["EXCELLENT", "GOOD", "NEEDS_WORK", "NA"], {
  errorMap: () => ({ message: "Pick one." }),
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max.toLocaleString("en-IN")} characters.`)
    .optional()
    .transform((v) => (v ? v : null));

const emptyToNull = (v: unknown) => (v === "" || v === undefined || v === null || v === 0 ? null : v);

function extraAnswerSchema(q: ExtraQuestion) {
  const answerThis = "Answer this question.";
  let schema: z.ZodTypeAny;
  switch (q.type) {
    case "stars":
      schema = z.preprocess(
        emptyToNull,
        z.coerce.number().int().min(1, "Pick 1 to 5 stars.").max(5, "Pick 1 to 5 stars.").nullable(),
      );
      break;
    case "scale":
      schema = z.preprocess(emptyToNull, z.enum(["EXCELLENT", "GOOD", "NEEDS_WORK", "NA"]).nullable());
      break;
    case "choice":
      schema = z.preprocess(
        emptyToNull,
        z
          .string()
          .refine((v) => q.options.includes(v), "Pick one of the options.")
          .nullable(),
      );
      break;
    case "text":
      schema = z.preprocess(
        (v) => (typeof v === "string" ? v.trim() || null : emptyToNull(v)),
        z.string().max(1000, "Keep it under 1,000 characters.").nullable(),
      );
      break;
  }
  return q.required ? schema.refine((v) => v !== null && v !== undefined, answerThis) : schema;
}

/** The full set of checks for one trip's form: the standard questions plus that trip's extras. */
export function buildResponseSchema(extras: ExtraQuestion[]) {
  const extrasShape: Record<string, z.ZodTypeAny> = {};
  for (const q of extras) extrasShape[q.id] = extraAnswerSchema(q);

  return z
    .object({
      anonymous: z.boolean(),
      name: z.string().trim().max(80, "Keep your name under 80 characters.").optional().default(""),
      whatsapp: z.string().trim().max(24, "That number is too long.").optional().default(""),
      groupSize: z.preprocess(
        emptyToNull,
        z.coerce
          .number({ invalid_type_error: "Enter a number." })
          .int("Enter a whole number.")
          .min(1, "At least 1.")
          .max(50, "That's more than 50.")
          .nullable(),
      ),
      overall: z.coerce
        .number({ invalid_type_error: "Pick a rating from 1 to 5." })
        .int()
        .min(1, "Pick a rating from 1 to 5.")
        .max(5, "Pick a rating from 1 to 5."),
      ratings: z.object({
        venue: aspectAnswer,
        food: aspectAnswer,
        travel: aspectAnswer,
        planning: aspectAnswer,
        value: aspectAnswer,
      }),
      comeAgain: z.enum(["YES", "MAYBE", "NO"], { errorMap: () => ({ message: "Pick one." }) }),
      extras: z.object(extrasShape),
      loved: optionalText(1000),
      leaderIdea: optionalText(1500),
      nextPlace: optionalText(120),
      shareOk: z.boolean().optional().default(false),
    })
    .superRefine((value, ctx) => {
      if (!value.anonymous && value.name.length < 2) {
        ctx.addIssue({ code: "custom", path: ["name"], message: "Add your name, or switch on anonymous." });
      }
      if (!value.anonymous && value.whatsapp && !normaliseWhatsApp(value.whatsapp)) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsapp"],
          message: "Enter a 10-digit mobile number, or a full number starting with +.",
        });
      }
    });
}

export type ResponseInput = z.input<ReturnType<typeof buildResponseSchema>>;
export type ResponseData = z.output<ReturnType<typeof buildResponseSchema>>;

/** Which step of the form each answer lives on, so errors can send people back to the right place. */
export function stepForField(key: string): 1 | 2 | 3 | 4 {
  if (key.startsWith("extras.")) return 3;
  if (["overall", "comeAgain"].includes(key) || key.startsWith("ratings.")) return 2;
  if (["loved", "leaderIdea", "nextPlace", "shareOk"].includes(key)) return 4;
  return 1;
}

/* ----------------------------------------------------------------------------
 * Quality signals, shown to organisers next to a response
 * ------------------------------------------------------------------------- */

export const FLAG_LABEL: Record<string, string> = {
  quick: "Filled in very quickly",
  link: "Contains a link",
};

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|net|org|xyz|ru|info|biz|top|io)\b)/i;

export function qualityFlags(texts: Array<string | null | undefined>, secondsToFill: number | null): string[] {
  const flags: string[] = [];
  if (secondsToFill !== null && secondsToFill < 25) flags.push("quick");
  if (texts.some((t) => t && LINK.test(t))) flags.push("link");
  return flags;
}

/* ----------------------------------------------------------------------------
 * Suggestions: topics for the board
 * ------------------------------------------------------------------------- */

export const TOPICS = [
  "Food",
  "Stay and venue",
  "Travel and transport",
  "Activities and games",
  "Safety",
  "Cost",
  "Planning and communication",
  "Destinations",
  "Other",
] as const;

export type Topic = (typeof TOPICS)[number];

const TOPIC_WORDS: Array<[Topic, RegExp]> = [
  ["Safety", /\b(safe|safety|first[- ]aid|medical|medicine|helmet|injur|emergency|accident|marshal|guard)/i],
  ["Food", /\b(food|meal|lunch|dinner|breakfast|sadya|snack|tea|coffee|drinks?|menu|veg|biryani|cook|payasam|water bottle)/i],
  ["Stay and venue", /\b(stay|room|tent|camp|hotel|resort|venue|toilet|bathroom|washroom|bed|accommodation|homestay|clean|hall)/i],
  ["Travel and transport", /\b(bus|car|cars|bike|bikes|ride|road|traffic|transport|pick[- ]?up|drop|vehicle|parking|fuel|route|drive|train|carpool)/i],
  ["Activities and games", /\b(game|games|activit|kids|children|couples?|music|dance|bonfire|campfire|trek|hike|swim|kayak|competition|prize|pookkalam|quiz)/i],
  ["Cost", /\b(cost|price|fee|cheap|expensive|budget|money|payment|refund|charges?|discount)/i],
  ["Planning and communication", /\b(plan|planning|schedule|timing|on time|late|delay|update|whatsapp|inform|communicat|coordinat|organi[sz]|register)/i],
];

export function guessTopic(text: string, kind: "IDEA" | "PLACE"): Topic {
  if (kind === "PLACE") return "Destinations";
  for (const [topic, pattern] of TOPIC_WORDS) if (pattern.test(text)) return topic;
  return "Other";
}

export const SUGGESTION_STATUS_LABEL = {
  NEW: "New",
  PLANNED: "Planned",
  DONE: "Done",
  NOT_NOW: "Not now",
} as const;

/* ----------------------------------------------------------------------------
 * Reading stored answers and adding them up
 * ------------------------------------------------------------------------- */

export type StoredRatings = Partial<Record<AspectId, AspectAnswer>>;
export type StoredExtras = Record<string, string | number | null>;

export function parseRatings(value: unknown): StoredRatings {
  const out: StoredRatings = {};
  if (!value || typeof value !== "object") return out;
  for (const { id } of ASPECTS) {
    const answer = (value as Record<string, unknown>)[id];
    if (answer === "EXCELLENT" || answer === "GOOD" || answer === "NEEDS_WORK" || answer === "NA") out[id] = answer;
  }
  return out;
}

export function parseExtras(value: unknown): StoredExtras {
  const out: StoredExtras = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, answer] of Object.entries(value as Record<string, unknown>)) {
    if (typeof answer === "string" || typeof answer === "number" || answer === null) out[key] = answer;
  }
  return out;
}

export type ScaleCounts = { EXCELLENT: number; GOOD: number; NEEDS_WORK: number; answered: number };

const emptyScale = (): ScaleCounts => ({ EXCELLENT: 0, GOOD: 0, NEEDS_WORK: 0, answered: 0 });

function countScale(counts: ScaleCounts, answer: unknown) {
  if (answer === "EXCELLENT" || answer === "GOOD" || answer === "NEEDS_WORK") {
    counts[answer] += 1;
    counts.answered += 1;
  }
}

/** Share of answers (0 to 1) that were Excellent or Good; null with no answers. */
export function positiveShare(counts: ScaleCounts): number | null {
  return counts.answered ? (counts.EXCELLENT + counts.GOOD) / counts.answered : null;
}

export type ScoredResponse = {
  overall: number;
  comeAgain: ComeAgainValue;
  ratings: unknown;
  extras: unknown;
  groupSize: number | null;
};

export type ExtraResult =
  | { question: ExtraQuestion; kind: "stars"; average: number | null; counts: number[]; answered: number }
  | { question: ExtraQuestion; kind: "scale"; counts: ScaleCounts }
  | { question: ExtraQuestion; kind: "choice"; counts: Array<{ option: string; count: number }>; answered: number }
  | { question: ExtraQuestion; kind: "text"; answers: string[] };

export function scoreResponses(responses: ScoredResponse[], extras: ExtraQuestion[]) {
  const overallCounts = [0, 0, 0, 0, 0];
  let overallSum = 0;
  const comeAgain = { YES: 0, MAYBE: 0, NO: 0 };
  const aspects = ASPECTS.map((a) => ({ id: a.id, label: a.label, counts: emptyScale() }));
  let people = 0;

  const extraResults: ExtraResult[] = extras.map((question): ExtraResult => {
    switch (question.type) {
      case "stars":
        return { question, kind: "stars", average: null, counts: [0, 0, 0, 0, 0], answered: 0 };
      case "scale":
        return { question, kind: "scale", counts: emptyScale() };
      case "choice":
        return { question, kind: "choice", counts: question.options.map((option) => ({ option, count: 0 })), answered: 0 };
      case "text":
        return { question, kind: "text", answers: [] };
    }
  });

  for (const r of responses) {
    if (r.overall >= 1 && r.overall <= 5) {
      overallCounts[r.overall - 1] += 1;
      overallSum += r.overall;
    }
    comeAgain[r.comeAgain] += 1;
    people += r.groupSize && r.groupSize > 0 ? r.groupSize : 1;

    const ratings = parseRatings(r.ratings);
    for (const aspect of aspects) countScale(aspect.counts, ratings[aspect.id]);

    const answers = parseExtras(r.extras);
    for (const result of extraResults) {
      const answer = answers[result.question.id];
      if (answer === null || answer === undefined || answer === "") continue;
      if (result.kind === "stars" && typeof answer === "number" && answer >= 1 && answer <= 5) {
        result.counts[answer - 1] += 1;
        result.answered += 1;
      } else if (result.kind === "scale") {
        countScale(result.counts, answer);
      } else if (result.kind === "choice" && typeof answer === "string") {
        const slot = result.counts.find((c) => c.option === answer);
        if (slot) {
          slot.count += 1;
          result.answered += 1;
        }
      } else if (result.kind === "text" && typeof answer === "string") {
        result.answers.push(answer);
      }
    }
  }

  for (const result of extraResults) {
    if (result.kind === "stars" && result.answered) {
      result.average = result.counts.reduce((sum, count, i) => sum + count * (i + 1), 0) / result.answered;
    }
  }

  const n = responses.length;
  return {
    n,
    people,
    overall: { average: n ? overallSum / n : null, counts: overallCounts },
    comeAgain: { ...comeAgain, yesShare: n ? comeAgain.YES / n : null },
    aspects,
    extras: extraResults,
  };
}

export type FeedbackScores = ReturnType<typeof scoreResponses>;

/** How a response's writer is shown: never a name for anonymous answers. */
export function writerLabel(r: { anonymous: boolean; name: string | null }, opts: { firstNameOnly?: boolean } = {}) {
  if (r.anonymous || !r.name) return opts.firstNameOnly ? "A traveller" : "Anonymous";
  return opts.firstNameOnly ? r.name.trim().split(/\s+/)[0] : r.name;
}
