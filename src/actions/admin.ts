"use server";
import { withAudit } from "@/lib/action-audit";

import { cancelBooking, rosterSnapshot, queuePromotions } from "@/lib/waitlist";
import { revalidatePath } from "next/cache";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { fromDateInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { PAYMENT_STATUSES } from "@/lib/trips";
import { tripSlugFromTitle } from "@/lib/trip-url";
import { expenseSchema, TRIP_STATUS_VALUES, tripSchema } from "@/lib/validation";
import type { PaymentStatus, RegistrationApproval, TripStatus } from "@prisma/client";
import { gmailConfigured } from "@/lib/gmail";
import { sendApprovalEmail, sendTripBriefingEmail } from "@/lib/trip-emails";
import { splitRoster } from "@/lib/trips";

/*
 * Organiser actions. Every one re-checks the ADMIN role against the database
 * before touching anything; a non-admin gets the same answer whatever they try.
 */

const NO_ACCESS = "You don't have access to that.";

async function uniqueTripSlug(title: string, ignoreId?: string) {
  const base = tripSlugFromTitle(title);
  for (let suffix = 1; suffix < 100; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    const existing = await prisma.trip.findFirst({ where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } });
    if (!existing) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function revalidateTripPages(tripId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/trips");
  revalidatePath("/");
  revalidatePath("/profile"); revalidatePath("/staff");
  if (tripId) revalidatePath(`/trips/${tripId}`);
}

export async function saveTrip(tripId: string | null, input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const data = {
    title: v.title,
    kind: v.kind,
    minimumPriorEvents: v.minimumPriorEvents,
    coverPhotoId: v.coverPhotoId,
    location: v.location,
    description: v.description,
    startDate: fromDateInputValue(v.startDate),
    endDate: fromDateInputValue(v.endDate),
    maxCapacity: v.maxCapacity,
    budgetEst: v.kind === "MEETUP" ? null : v.budgetEst,
    adultBudgetEst: v.kind === "MEETUP" ? null : v.adultBudgetEst,
    childBudgetEst: v.kind === "MEETUP" ? null : v.childBudgetEst,
    itinerary: v.itinerary,
  };

  if (tripId) {
    const existing = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, slug: true } });
    if (!existing) return fail("That trip no longer exists.");
    // Status has its own control on the trip page; only change it here if it was sent.
    const before = await rosterSnapshot(tripId);
    await prisma.trip.update({ where: { id: tripId }, data: { ...data, slug: existing.slug ?? await uniqueTripSlug(v.title, tripId), ...(v.status ? { status: v.status } : {}) } });
    await queuePromotions(tripId, before);
    revalidateTripPages(tripId);
    return done("Trip saved.", { id: tripId });
  }

  const created = await prisma.trip.create({ data: { ...data, slug: await uniqueTripSlug(v.title), status: v.status ?? "DRAFT" }, select: { id: true } });
  revalidateTripPages(created.id);
  return done("Trip created.", { id: created.id });

  });
}

export async function setTripStatus(tripId: string, status: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin())) return fail(NO_ACCESS);
  if (!TRIP_STATUS_VALUES.includes(status as TripStatus)) return fail("Pick a status from the list.");

  const updated = await prisma.trip.updateMany({ where: { id: tripId }, data: { status: status as TripStatus } });
  if (updated.count === 0) return fail("That trip no longer exists.");
  revalidateTripPages(tripId);
  return done("Status updated.");

  });
}

/** Only trips nobody has registered for, spent on or reviewed can be deleted; archive the rest. */
export async function deleteTrip(tripId: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin())) return fail(NO_ACCESS);
  const operationalRecords = await Promise.all([prisma.tripTask.count({ where: { tripId } }), prisma.tripIncident.count({ where: { tripId } }), prisma.paymentEvent.count({ where: { tripId } })]);
  if (operationalRecords.some(Boolean)) return fail("This trip has operational history. Archive it to preserve the records.");

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

  });
}

export async function updateRegistration(
  registrationId: string,
  change: { paymentStatus?: string; gearChecked?: boolean },
): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin())) return fail(NO_ACCESS);

  const scope = await prisma.tripRegistration.findUnique({ where: { id: registrationId }, select: { trip: { select: { kind: true } } } });
  if (!scope) return fail("That registration no longer exists.");
  if (scope.trip.kind === "MEETUP" && (change.paymentStatus !== undefined || change.gearChecked !== undefined)) return fail("Meetups do not use payment or gear checks.");

  const data: { paymentStatus?: PaymentStatus; gearChecked?: boolean } = {};
  if (change.paymentStatus !== undefined) {
    if (await prisma.paymentEvent.count({ where: { registrationId } })) return fail("Payment status is calculated from the ledger. Record a receipt or refund in Trip day & payments.");
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

  });
}

export async function setRegistrationApproval(registrationId: string, approvalStatus: string): Promise<ActionResult> {
  return withAudit(async () => {
    if (!(await getAdmin())) return fail(NO_ACCESS);
    if (!(["PENDING", "APPROVED", "DECLINED"] as RegistrationApproval[]).includes(approvalStatus as RegistrationApproval)) return fail("Choose a valid approval status.");
    const registration = await prisma.tripRegistration.update({ where: { id: registrationId }, data: { approvalStatus: approvalStatus as RegistrationApproval, approvedAt: approvalStatus === "APPROVED" ? new Date() : null }, include: { user: true, trip: true } }).catch(() => null);
    if (!registration) return fail("That registration no longer exists.");
    revalidateTripPages(registration.tripId);
    if (approvalStatus === "APPROVED" && gmailConfigured() && registration.user.email && process.env.NEXTAUTH_URL) {
      try { await sendApprovalEmail(registration.user.email, registration.trip, process.env.NEXTAUTH_URL); return done("Registration approved and email sent."); } catch { return done("Registration approved. Email delivery needs review."); }
    }
    return done(approvalStatus === "APPROVED" ? "Registration approved." : approvalStatus === "DECLINED" ? "Registration declined." : "Registration returned to pending review.");
  });
}

export async function sendTripBriefingNow(tripId: string): Promise<ActionResult> {
  return withAudit(async () => {
    if (!(await getAdmin())) return fail(NO_ACCESS);
    if (!gmailConfigured() || !process.env.NEXTAUTH_URL) return fail("Gmail is not configured in the current deployment.");
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { registrations: { include: { user: true } } } });
    if (!trip) return fail("Trip not found.");
    const confirmed = splitRoster(trip.registrations, trip.maxCapacity).confirmed.filter((registration) => registration.user.email && !registration.user.deletedAt);
    if (!confirmed.length) return fail("There are no approved attendees with email addresses.");
    let sent = 0;
    for (const registration of confirmed) {
      try { await sendTripBriefingEmail(registration.user.email!, trip, process.env.NEXTAUTH_URL); sent += 1; } catch (error) { console.error("[trip-email] delivery failed", error); }
    }
    return sent ? done(`Sent ${sent} ${trip.kind === "MEETUP" ? "meetup" : "trip"} email${sent === 1 ? "" : "s"}.`) : fail("No trip emails were accepted. Check the Gmail credentials and delivery logs.");
  });
}

export async function removeRegistration(registrationId: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin())) return fail(NO_ACCESS);
  if (await prisma.paymentEvent.count({ where: { registrationId } })) return fail("This registration has a payment ledger. Keep it for the financial record; record any refund in Trip day & payments.");

  const registration = await cancelBooking(registrationId, "ORGANISER_CANCELLED");
  if (!registration) return fail("That registration no longer exists.");

  revalidateTripPages(registration.tripId);
  return done("Registration removed. The waitlist has moved up.");

  });
}

export async function addExpense(tripId: string, input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("finance"))) return fail(NO_ACCESS);

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

  });
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("finance"))) return fail(NO_ACCESS);

  const expense = await prisma.expense.delete({ where: { id: expenseId }, select: { tripId: true } }).catch(() => null);
  if (!expense) return fail("That expense no longer exists.");
  revalidateTripPages(expense.tripId);
  return done("Expense deleted.");

  });
}

export async function deleteFeedback(feedbackId: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const feedback = await prisma.feedback.delete({ where: { id: feedbackId }, select: { tripId: true } }).catch(() => null);
  if (!feedback) return fail("That feedback no longer exists.");
  revalidatePath("/feedback");
  revalidateTripPages(feedback.tripId ?? undefined);
  return done("Feedback deleted.");

  });
}

export async function createTripTask(tripId: string, title: string): Promise<ActionResult> {
  return withAudit(async () => {
  const admin = await getAdmin("lead", tripId); if (!admin) return fail(NO_ACCESS);
  if (typeof title !== "string") return fail("Enter a task title.");
  if (!await prisma.trip.findUnique({ where: { id: tripId } })) return fail("Trip no longer exists.");
  const clean = title.trim(); if (clean.length < 3 || clean.length > 160) return fail("Task title must be between 3 and 160 characters.");
  await prisma.tripTask.create({ data: { tripId, title: clean, ownerId: admin.id } }); revalidateTripPages(tripId); return done("Task added.");

  });
}

export async function toggleTripTask(taskId: string, completed: boolean): Promise<ActionResult> {
  return withAudit(async () => {
  const scope = await prisma.tripTask.findUnique({ where: { id: taskId }, select: { tripId: true } });
  if (!scope || !(await getAdmin("lead", scope.tripId))) return fail(NO_ACCESS);
  if (typeof completed !== "boolean") return fail("Invalid completion status.");
  const task = await prisma.tripTask.update({ where: { id: taskId }, data: { completedAt: completed ? new Date() : null }, select: { tripId: true } }).catch(() => null);
  if (!task) return fail("That task no longer exists."); revalidateTripPages(task.tripId); return done(completed ? "Task completed." : "Task reopened.");

  });
}

export async function createTripIncident(tripId: string, title: string, description: string, severity: string): Promise<ActionResult> {
  return withAudit(async () => {
  const admin = await getAdmin("lead", tripId); if (!admin) return fail(NO_ACCESS);
  if (typeof title !== "string" || typeof description !== "string" || title.length > 160 || description.length > 4000) return fail("Use a title under 160 characters and description under 4000.");
  if (!await prisma.trip.findUnique({ where: { id: tripId } })) return fail("Trip no longer exists.");
  const cleanTitle = title.trim(), cleanDescription = description.trim();
  if (cleanTitle.length < 3 || cleanDescription.length < 5) return fail("Add an incident title and description.");
  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity)) return fail("Pick a valid incident severity.");
  await prisma.tripIncident.create({ data: { tripId, reportedById: admin.id, title: cleanTitle, description: cleanDescription, severity } }); revalidateTripPages(tripId); return done("Incident logged.");

  });
}
