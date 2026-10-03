"use server";

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
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to register for trips.");

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { phone, emergencyContact, bloodGroup, vehicleDetails } = parsed.data;

  const trip = await prisma.trip.findUnique({
    where: { id: String(tripId) },
    select: { id: true, status: true, startDate: true, maxCapacity: true },
  });
  if (!trip || !isPublicStatus(trip.status)) return fail("This trip isn't available.");

  const started = trip.startDate.getTime() <= Date.now();
  if (!acceptsRegistrations(trip.status) || started) return fail(closedReason(trip.status, started));

  let registrationId: string;
  try {
    const [, registration] = await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { phone, emergencyContact, bloodGroup } }),
      prisma.tripRegistration.create({ data: { userId: user.id, tripId: trip.id, vehicleDetails } }),
    ]);
    registrationId = registration.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("You're already registered for this trip.");
    }
    throw error;
  }

  const roster = await prisma.tripRegistration.findMany({
    where: { tripId: trip.id },
    select: { id: true, createdAt: true },
  });
  const position = rosterPosition(roster, trip.maxCapacity, registrationId);

  revalidateTrip(trip.id);

  if (position?.kind === "waitlist") {
    return done(
      `You're on the waitlist at number ${position.place}. If someone drops out, you move up automatically and it shows here.`,
    );
  }
  return done("You're in. Pay the organiser as usual; your payment status shows on your profile once it's recorded.");
}

export async function cancelRegistration(tripId: string): Promise<ActionResult> {
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
  if (registration.paymentStatus !== "PENDING") {
    return fail("A payment is recorded on your registration, so ask the organiser to cancel it and sort out the refund.");
  }

  await prisma.tripRegistration.delete({ where: { id: registration.id } });
  revalidateTrip(registration.trip.id);
  return done("Your registration is cancelled.");
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to update your details.");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/profile");
  return done("Your details are saved.");
}

export async function submitFeedback(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to leave feedback.");

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { tripId, rating, comment } = parsed.data;

  if (tripId) {
    const registration = await prisma.tripRegistration.findUnique({
      where: { userId_tripId: { userId: user.id, tripId } },
      include: { trip: { select: { status: true, maxCapacity: true } } },
    });
    if (!registration || registration.trip.status !== "COMPLETED") {
      return fail("You can review a trip once it's completed, if you were on it.");
    }
    const roster = await prisma.tripRegistration.findMany({ where: { tripId }, select: { id: true, createdAt: true } });
    if (rosterPosition(roster, registration.trip.maxCapacity, registration.id)?.kind !== "confirmed") {
      return fail("Only travellers who had a seat on this trip can review it.");
    }

    // One review per traveller per trip: a second one replaces the first.
    const existing = await prisma.feedback.findFirst({ where: { userId: user.id, tripId }, select: { id: true } });
    if (existing) {
      await prisma.feedback.update({ where: { id: existing.id }, data: { rating, comment } });
    } else {
      await prisma.feedback.create({ data: { userId: user.id, tripId, rating, comment } });
    }
    revalidatePath(`/trips/${tripId}`);
  } else {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = await prisma.feedback.count({ where: { userId: user.id, tripId: null, createdAt: { gte: since } } });
    if (today >= 3) return fail("You've sent three notes today already. Send the next one tomorrow.");
    await prisma.feedback.create({ data: { userId: user.id, tripId: null, rating, comment } });
  }

  revalidatePath("/feedback");
  revalidatePath("/");
  return done(tripId ? "Thanks. Your review is posted." : "Thanks. Your feedback is posted.");
}
