import { z } from "zod";
import { partySize } from "./family";
import type { PaymentStatus, TripKind, TripStatus } from "@prisma/client";
import { tripDays } from "./format";
import { JOIN_STEPS, TREKS_NOTE } from "./joining";

/* ----------------------------------------------------------------------------
 * Trip types: what kind of outing it is, which decides who can join
 * ------------------------------------------------------------------------- */

export const TRIP_KINDS: TripKind[] = ["MEETUP", "DAY_TRIP", "STAY_BACK", "INTERNATIONAL", "TREK"];

/** The names organisers pick from. */
export const KIND_OPTION_LABEL: Record<TripKind, string> = {
  MEETUP: "Meetup",
  DAY_TRIP: "One-day trip or event",
  STAY_BACK: "Stay-back, night or multi-day trip",
  INTERNATIONAL: "International trip",
  TREK: "Trek (Health & Fitness group)",
};

/** Who each kind is open to, worded as on the About & FAQ page. */
export const WHO_CAN_JOIN: Record<TripKind, string> = {
  MEETUP: JOIN_STEPS[0].body,
  DAY_TRIP: JOIN_STEPS[1].body,
  STAY_BACK: JOIN_STEPS[2].body,
  INTERNATIONAL: JOIN_STEPS[3].body,
  TREK: TREKS_NOTE,
};

/** For filters: "Show me meetups". */
export const KIND_PLURAL: Record<TripKind, string> = {
  MEETUP: "Meetups",
  DAY_TRIP: "Day trips",
  STAY_BACK: "Stay-back trips",
  INTERNATIONAL: "International trips",
  TREK: "Treks",
};

/** Reads a ?type= value, ignoring anything that isn't a trip type. */
export function parseKind(value: string | undefined): TripKind | null {
  const upper = value?.toUpperCase();
  return TRIP_KINDS.find((k) => k === upper) ?? null;
}

const KIND_NOUN: Record<TripKind, string> = {
  MEETUP: "meetup",
  DAY_TRIP: "day trip",
  STAY_BACK: "stay-back trip",
  INTERNATIONAL: "international trip",
  TREK: "trek",
};

/** "Day trip", "Meetup", "2-day stay-back trip": the type, with the length when it's more than a day. */
export function tripTypeLabel(kind: TripKind, start: Date, end: Date): string {
  const days = tripDays(start, end);
  // A "day trip" over several days would read oddly; call it a trip.
  const noun = days > 1 && kind === "DAY_TRIP" ? "trip" : KIND_NOUN[kind];
  const label = days > 1 ? `${days}-day ${noun}` : noun;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Not recorded yet",
  PARTIAL: "Part paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PARTIAL", "PAID", "REFUNDED"];

/** Statuses anyone can see. DRAFT and ARCHIVED are organiser-only. */
export const PUBLIC_STATUSES: TripStatus[] = ["OPEN", "WAITLIST", "FULL", "ONGOING", "COMPLETED"];

/** Statuses that accept new registrations. */
export const REGISTRATION_STATUSES: TripStatus[] = ["OPEN", "WAITLIST"];

export const ALL_STATUSES: TripStatus[] = ["DRAFT", "OPEN", "WAITLIST", "FULL", "ONGOING", "COMPLETED", "ARCHIVED"];

export const STATUS_LABEL: Record<TripStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  WAITLIST: "Waitlist",
  FULL: "Full",
  ONGOING: "On the trail",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const STATUS_HELP: Record<TripStatus, string> = {
  DRAFT: "Only organisers can see it.",
  OPEN: "Visible and taking registrations.",
  WAITLIST: "Visible; new sign-ups join the waitlist once seats run out.",
  FULL: "Visible; registrations are closed.",
  ONGOING: "The group is on the trip right now.",
  COMPLETED: "Trip is over. Open its feedback form from the trip's Feedback tab.",
  ARCHIVED: "Hidden from the site; kept for the records.",
};

export function isPublicStatus(status: TripStatus) {
  return PUBLIC_STATUSES.includes(status);
}

export function acceptsRegistrations(status: TripStatus) {
  return REGISTRATION_STATUSES.includes(status);
}

/** FIFO by registration; a household is confirmed together or waits together.
 * Later parties do not jump ahead of a family that is waiting for enough seats. */
export function splitRoster<T extends { createdAt: Date; id: string; partySize?: number }>(registrations: T[], capacity: number) {
  const ordered = [...registrations].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  let remaining = Math.max(0, capacity);
  let waiting = false;
  const confirmed: T[] = [];
  const waitlisted: T[] = [];
  for (const registration of ordered) {
    const size = partySize(registration);
    if (!waiting && size <= remaining) {
      confirmed.push(registration);
      remaining -= size;
    } else {
      waiting = true;
      waitlisted.push(registration);
    }
  }
  return { confirmed, waitlisted };
}

/** Where a registration sits: a confirmed seat, or its place in the waitlist (1-based). */
export function rosterPosition<T extends { createdAt: Date; id: string; partySize?: number }>(
  registrations: T[],
  capacity: number,
  registrationId: string,
): { kind: "confirmed" } | { kind: "waitlist"; place: number } | null {
  const { confirmed, waitlisted } = splitRoster(registrations, capacity);
  if (confirmed.some((r) => r.id === registrationId)) return { kind: "confirmed" };
  const index = waitlisted.findIndex((r) => r.id === registrationId);
  return index === -1 ? null : { kind: "waitlist", place: index + 1 };
}

/**
 * Whether a trip has seats worth showing. An ongoing or finished trip that nobody registered for was run outside
 * the site (and added afterwards, for its feedback and photos), so "0 travelled" would be wrong.
 */
export function showsSeats(status: TripStatus, registered: number) {
  return registered > 0 || (status !== "ONGOING" && status !== "COMPLETED");
}

export function seatSummary(registered: number, capacity: number, confirmed?: number) {
  const taken = Math.min(confirmed ?? registered, capacity);
  return {
    taken,
    left: Math.max(0, capacity - taken),
    waitlist: Math.max(0, registered - taken),
    ratio: capacity > 0 ? Math.min(1, taken / capacity) : 1,
  };
}

/** Why a trip isn't taking registrations, in words for the member. */
export function closedReason(status: TripStatus, started: boolean) {
  if (status === "COMPLETED") return "This trip is over. See you on the next one.";
  if (status === "ONGOING" || started) return "This trip has already started.";
  if (status === "FULL") return "Registrations are closed for this trip.";
  return "This trip isn't taking registrations.";
}

/* ----------------------------------------------------------------------------
 * Itinerary: stored in Trip.itinerary as [{ title, details }], one per day.
 * ------------------------------------------------------------------------- */

export const itineraryDaySchema = z.object({
  title: z.string().trim().min(1).max(120),
  details: z.string().trim().max(2000).optional().default(""),
});

export const itinerarySchema = z.array(itineraryDaySchema).max(30);

export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

/** Reads whatever is stored, tolerating older or hand-edited shapes. */
export function parseItinerary(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  const days: ItineraryDay[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      days.push({ title: item.trim().slice(0, 120), details: "" });
      continue;
    }
    const parsed = itineraryDaySchema.safeParse(item);
    if (parsed.success) days.push(parsed.data);
  }
  return days;
}
