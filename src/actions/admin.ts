"use server";

import { revalidatePath } from "next/cache";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { fromDateInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { PAYMENT_STATUSES } from "@/lib/trips";
import { expenseSchema, TRIP_STATUS_VALUES, tripSchema } from "@/lib/validation";
import type { PaymentStatus, TripStatus } from "@prisma/client";

/*
 * Organiser actions. Every one re-checks the ADMIN role against the database
 * before touching anything; a non-admin gets the same answer whatever they try.
 */

const NO_ACCESS = "You don't have access to that.";

function revalidateTripPages(tripId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/trips");
  revalidatePath("/");
  revalidatePath("/profile");
  if (tripId) revalidatePath(`/trips/${tripId}`);
}

export async function saveTrip(tripId: string | null, input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const data = {
    title: v.title,
    location: v.location,
    description: v.description,
    startDate: fromDateInputValue(v.startDate),
    endDate: fromDateInputValue(v.endDate),
    maxCapacity: v.maxCapacity,
    budgetEst: v.budgetEst,
    itinerary: v.itinerary,
  };

  if (tripId) {
    const existing = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } });
    if (!existing) return fail("That trip no longer exists.");
    // Status has its own control on the trip page; only change it here if it was sent.
    await prisma.trip.update({ where: { id: tripId }, data: { ...data, ...(v.status ? { status: v.status } : {}) } });
    revalidateTripPages(tripId);
    return done("Trip saved.", { id: tripId });
  }

  const created = await prisma.trip.create({ data: { ...data, status: v.status ?? "DRAFT" }, select: { id: true } });
  revalidateTripPages(created.id);
  return done("Trip created.", { id: created.id });
}

export async function setTripStatus(tripId: string, status: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);
  if (!TRIP_STATUS_VALUES.includes(status as TripStatus)) return fail("Pick a status from the list.");

  const updated = await prisma.trip.updateMany({ where: { id: tripId }, data: { status: status as TripStatus } });
  if (updated.count === 0) return fail("That trip no longer exists.");
  revalidateTripPages(tripId);
  return done("Status updated.");
}

/** Only trips nobody has registered for, spent on or reviewed can be deleted; archive the rest. */
export async function deleteTrip(tripId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { _count: { select: { registrations: true, expenses: true, feedbacks: true, responses: true } } },
  });
  if (!trip) return fail("That trip no longer exists.");
  const { registrations, expenses, feedbacks, responses } = trip._count;
  if (registrations + expenses + feedbacks + responses > 0) {
    return fail("This trip has registrations, expenses or feedback, so it can't be deleted. Set it to Archived instead.");
  }

  await prisma.trip.delete({ where: { id: tripId } });
  revalidateTripPages();
  return done("Trip deleted.");
}

export async function updateRegistration(
  registrationId: string,
  change: { paymentStatus?: string; gearChecked?: boolean },
): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const data: { paymentStatus?: PaymentStatus; gearChecked?: boolean } = {};
  if (change.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(change.paymentStatus as PaymentStatus)) return fail("Pick a payment status from the list.");
    data.paymentStatus = change.paymentStatus as PaymentStatus;
  }
  if (change.gearChecked !== undefined) data.gearChecked = Boolean(change.gearChecked);
  if (Object.keys(data).length === 0) return fail("Nothing to change.");

  const registration = await prisma.tripRegistration
    .update({ where: { id: registrationId }, data, select: { tripId: true } })
    .catch(() => null);
  if (!registration) return fail("That registration no longer exists.");

  revalidateTripPages(registration.tripId);
  return done(data.paymentStatus ? "Payment status saved." : "Gear check saved.");
}

export async function removeRegistration(registrationId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const registration = await prisma.tripRegistration
    .delete({ where: { id: registrationId }, select: { tripId: true } })
    .catch(() => null);
  if (!registration) return fail("That registration no longer exists.");

  revalidateTripPages(registration.tripId);
  return done("Registration removed. The waitlist has moved up.");
}

export async function addExpense(tripId: string, input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const [trip, payer] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: v.paidById }, select: { id: true } }),
  ]);
  if (!trip) return fail("That trip no longer exists.");
  if (!payer) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: { paidById: "Pick who paid from the list." } };
  }

  await prisma.expense.create({
    data: {
      tripId,
      paidById: v.paidById,
      title: v.title,
      category: v.category,
      amount: v.amount,
      receiptUrl: v.receiptUrl,
    },
  });
  revalidateTripPages(tripId);
  return done("Expense added.");
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const expense = await prisma.expense.delete({ where: { id: expenseId }, select: { tripId: true } }).catch(() => null);
  if (!expense) return fail("That expense no longer exists.");
  revalidateTripPages(expense.tripId);
  return done("Expense deleted.");
}

export async function deleteFeedback(feedbackId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const feedback = await prisma.feedback.delete({ where: { id: feedbackId }, select: { tripId: true } }).catch(() => null);
  if (!feedback) return fail("That feedback no longer exists.");
  revalidatePath("/feedback");
  revalidateTripPages(feedback.tripId ?? undefined);
  return done("Feedback deleted.");
}
