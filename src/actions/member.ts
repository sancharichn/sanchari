"use server";
import { withAudit } from "@/lib/action-audit";

import { cancelBooking } from "@/lib/waitlist";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { acceptsRegistrations, closedReason, isPublicStatus, rosterPosition } from "@/lib/trips";
import { feedbackSchema, profileSchema, registrationSchema } from "@/lib/validation";

/*
 * Member actions. Each one checks the session itself: server actions are
 * public endpoints, whatever page they were called from.
 */

function revalidateTrip(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/profile");
  revalidatePath("/");
}

export async function registerForTrip(tripId: string, input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to register for trips.");

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { phone, emergencyContact, bloodGroup, vehicleDetails, carpoolChoice, carpoolLocation, carpoolSeats, companions, familyConsent, parentalConsent } = parsed.data;
  const partySize = 1 + companions.length;

  const trip = await prisma.trip.findUnique({
    where: { id: String(tripId) },
    select: { id: true, status: true, startDate: true, maxCapacity: true, minimumPriorEvents: true },
  });
  if (!trip || !isPublicStatus(trip.status)) return fail("This trip isn't available.");

  const started = trip.startDate.getTime() <= Date.now();
  if (!acceptsRegistrations(trip.status) || started) return fail(closedReason(trip.status, started));

  if (trip.minimumPriorEvents > 0) {
    const attended = await prisma.tripRegistration.count({ where: { userId: user.id, approvalStatus: "APPROVED", checkedInCount: { gt: 0 }, trip: { kind: { in: ["MEETUP", "DAY_TRIP"] }, status: "COMPLETED" } } });
    if (attended < trip.minimumPriorEvents) return fail(`This trip needs ${trip.minimumPriorEvents} attended one-day event${trip.minimumPriorEvents === 1 ? " or meetup" : "s or meetups"} first. Your recorded attendance: ${attended}.`);
  }

  if (partySize > trip.maxCapacity) return fail("Your family is larger than this trip’s capacity. Please contact the organiser.");

  let registrationId: string;
  try {
    // A family entered during a booking becomes part of the member's reusable family list.
    // Age deliberately stays on the booking: it changes over time and we never collect birth years.
    const saved = await prisma.familyMember.findMany({ where: { userId: user.id }, select: { name: true, relationship: true } });
    const known = new Set(saved.map((member) => `${member.name.trim().toLocaleLowerCase()}\u0000${member.relationship.trim().toLocaleLowerCase()}`));
    const newFamily = companions.filter((member) => {
      const key = `${member.name.trim().toLocaleLowerCase()}\u0000${member.relationship.trim().toLocaleLowerCase()}`;
      if (known.has(key)) return false;
      known.add(key);
      return true;
    });
    const operations = [
      prisma.user.update({ where: { id: user.id }, data: { phone, emergencyContact, bloodGroup } }),
      ...(newFamily.length ? [prisma.familyMember.createMany({ data: newFamily.map((member) => ({ userId: user.id, name: member.name, relationship: member.relationship })) })] : []),
      prisma.tripRegistration.create({
        data: {
          userId: user.id, tripId: trip.id, vehicleDetails, carpoolChoice, carpoolLocation, carpoolSeats, agreedToGuidelinesAt: new Date(),
          approvalStatus: "PENDING",
          partySize, companions,
          familyConsentAt: companions.length && familyConsent ? new Date() : null,
          parentalConsentAt: companions.some((person) => person.age < 18) && parentalConsent ? new Date() : null,
        },
      }),
    ];
    const written = await prisma.$transaction(operations);
    const registration = written[written.length - 1] as { id: string };
    registrationId = registration.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("You're already registered for this trip.");
    }
    throw error;
  }

  const roster = await prisma.tripRegistration.findMany({
    where: { tripId: trip.id },
    select: { id: true, createdAt: true, partySize: true },
  });
  const position = rosterPosition(roster, trip.maxCapacity, registrationId);

  revalidateTrip(trip.id);

  if (position?.kind === "waitlist") {
    return done(
      `Your registration is waiting for organiser approval. ${companions.length ? "Your family is saved for future trips; you can add birthdays and photos on your profile. " : ""}The organiser will confirm your place or contact you if anything is needed.`,
    );
  }
  return done(companions.length ? "Your registration is waiting for organiser approval. Your family is saved for future trips; you can add birthdays and photos on your profile." : "Your registration is waiting for organiser approval. The organiser will confirm your place or contact you if anything is needed.");

  });
}

export async function cancelRegistration(tripId: string): Promise<ActionResult> {
  return withAudit(async () => {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to manage your registrations.");

  const registration = await prisma.tripRegistration.findUnique({
    where: { userId_tripId: { userId: user.id, tripId: String(tripId) } },
    include: { trip: { select: { id: true, startDate: true, status: true } } },
  });
  if (!registration) return fail("You're not registered for this trip.");

  if (registration.trip.startDate.getTime() <= Date.now() || registration.trip.status === "ONGOING" || registration.trip.status === "COMPLETED") {
    return fail("This trip has already started, so it can't be cancelled here. Talk to the organiser.");
  }
  if (registration.paymentStatus !== "PENDING" || await prisma.paymentEvent.count({ where: { registrationId: registration.id } })) {
    return fail("A payment is recorded on your registration, so ask the organiser to cancel it and sort out the refund.");
  }

  await cancelBooking(registration.id, "MEMBER_CANCELLED");
  revalidateTrip(registration.trip.id);
  return done("Your registration is cancelled.");

  });
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to update your details.");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { familyMembers, ...userData } = parsed.data;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: userData });
    const existing = await tx.familyMember.findMany({ where: { userId: user.id }, select: { id: true } });
    const owned = new Set(existing.map((m) => m.id));
    const retained = familyMembers.flatMap((m) => m.id && owned.has(m.id) ? [m.id] : []);
    await tx.familyMember.deleteMany({ where: { userId: user.id, id: { notIn: retained } } });
    for (const member of familyMembers) {
      const data = { name: member.name, relationship: member.relationship, birthdayMonth: member.birthdayMonth, birthdayDay: member.birthdayDay, image: member.image ?? null };
      if (member.id && owned.has(member.id)) await tx.familyMember.update({ where: { id: member.id }, data });
      else await tx.familyMember.create({ data: { ...data, userId: user.id } });
    }
  });
  revalidatePath("/profile");
  return done("Your details are saved.");

  });
}

/** A note about the group in general. Trip feedback goes through each trip's own form. */
export async function submitFeedback(input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to leave feedback.");

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { rating, comment } = parsed.data;

  const attended = await prisma.tripRegistration.count({ where: { userId: user.id, approvalStatus: "APPROVED", checkedInCount: { gt: 0 }, trip: { status: "COMPLETED" } } });
  if (!attended) return fail("Group feedback is available after you have attended a Sanchari event.");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = await prisma.feedback.count({ where: { userId: user.id, createdAt: { gte: since } } });
  if (today >= 3) return fail("You've sent three notes today already. Send the next one tomorrow.");
  await prisma.feedback.create({ data: { userId: user.id, tripId: null, rating, comment } });

  revalidatePath("/feedback");
  revalidatePath("/");
  return done("Thanks. Your feedback is posted.");

  });
}
