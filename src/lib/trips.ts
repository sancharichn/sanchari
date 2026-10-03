import { z } from "zod";
import type { PaymentStatus, TripStatus } from "@prisma/client";

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
  COMPLETED: "Trip is over; travellers can leave feedback.",
  ARCHIVED: "Hidden from the site; kept for the records.",
};

export function isPublicStatus(status: TripStatus) {
  return PUBLIC_STATUSES.includes(status);
}

export function acceptsRegistrations(status: TripStatus) {
  return REGISTRATION_STATUSES.includes(status);
}

/**
 * Seats go to whoever registered first. The first `capacity` registrations
 * (oldest first) are confirmed; the rest are the waitlist, in order. Nothing
 * is stored for this, so a cancellation moves the next person up on its own.
 */
export function splitRoster<T extends { createdAt: Date; id: string }>(registrations: T[], capacity: number) {
  const ordered = [...registrations].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  const seats = Math.max(0, capacity);
  return { confirmed: ordered.slice(0, seats), waitlisted: ordered.slice(seats) };
}

/** Where a registration sits: a confirmed seat, or its place in the waitlist (1-based). */
export function rosterPosition<T extends { createdAt: Date; id: string }>(
  registrations: T[],
  capacity: number,
  registrationId: string,
): { kind: "confirmed" } | { kind: "waitlist"; place: number } | null {
  const { confirmed, waitlisted } = splitRoster(registrations, capacity);
  if (confirmed.some((r) => r.id === registrationId)) return { kind: "confirmed" };
  const index = waitlisted.findIndex((r) => r.id === registrationId);
  return index === -1 ? null : { kind: "waitlist", place: index + 1 };
}

export function seatSummary(registered: number, capacity: number) {
  const taken = Math.min(registered, capacity);
  return {
    taken,
    left: Math.max(0, capacity - registered),
    waitlist: Math.max(0, registered - capacity),
    ratio: capacity > 0 ? Math.min(1, registered / capacity) : 1,
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
