import "server-only";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { splitRoster } from "@/lib/trips";

const OUTSTANDING: PaymentStatus[] = ["PENDING", "PARTIAL"];

/** Numbers and lists for the organiser's overview. */
export async function getAdminOverview(now = new Date()) {
  const upcoming: Prisma.TripWhereInput = { status: { in: ["OPEN", "WAITLIST", "FULL"] }, startDate: { gte: now } };
  const rosterSelect = { select: { id: true, createdAt: true, paymentStatus: true, gearChecked: true } } as const;

  const [members, upcomingTrips, nextTrip, recent] = await Promise.all([
    prisma.user.count(),
    prisma.trip.findMany({
      where: upcoming,
      select: { id: true, maxCapacity: true, registrations: rosterSelect },
    }),
    prisma.trip.findFirst({
      where: upcoming,
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
        maxCapacity: true,
        registrations: rosterSelect,
      },
    }),
    prisma.tripRegistration.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        trip: { select: { id: true, title: true } },
      },
    }),
  ]);

  // Count only people holding a seat: the waitlist hasn't been asked to pay yet.
  let unpaid = 0;
  let gearPending = 0;
  for (const trip of upcomingTrips) {
    const { confirmed } = splitRoster(trip.registrations, trip.maxCapacity);
    unpaid += confirmed.filter((r) => OUTSTANDING.includes(r.paymentStatus)).length;
    gearPending += confirmed.filter((r) => !r.gearChecked).length;
  }

  return { members, upcomingCount: upcomingTrips.length, unpaid, gearPending, nextTrip, recent };
}

export async function getAdminTrips() {
  const trips = await prisma.trip.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      startDate: true,
      endDate: true,
      status: true,
      kind: true,
      maxCapacity: true,
      registrations: { select: { id: true, createdAt: true, paymentStatus: true } },
    },
  });
  return trips.map((trip) => {
    const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
    return {
      ...trip,
      confirmed: confirmed.length,
      waitlisted: waitlisted.length,
      unpaid: confirmed.filter((r) => OUTSTANDING.includes(r.paymentStatus)).length,
    };
  });
}

export async function getAdminTrip(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      registrations: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          createdAt: true,
          paymentStatus: true,
          gearChecked: true,
          vehicleDetails: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
              bloodGroup: true,
              emergencyContact: true,
              role: true,
            },
          },
        },
      },
      expenses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          amount: true,
          receiptUrl: true,
          createdAt: true,
          paidById: true,
          paidBy: { select: { name: true, email: true } },
        },
      },
      feedbacks: { select: { id: true } },
      feedbackForm: { select: { isOpen: true, intro: true, questions: true } },
      _count: { select: { responses: true } },
    },
  });
}

export type AdminTrip = NonNullable<Awaited<ReturnType<typeof getAdminTrip>>>;

/** People who can be picked as "paid by": everyone registered plus the organisers. */
export async function getPayerOptions(tripId: string) {
  const users = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { registrations: { some: { tripId } } }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return users.map((u) => ({ id: u.id, label: u.name ? `${u.name} (${u.email})` : u.email }));
}

export async function getMembers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      phone: true,
      bloodGroup: true,
      emergencyContact: true,
      createdAt: true,
      _count: { select: { registrations: true } },
    },
  });
}

export async function getAllFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      trip: { select: { id: true, title: true } },
    },
  });
}

/** Every response to a trip's feedback form, newest first, hidden ones included. */
export async function getTripResponses(tripId: string) {
  return prisma.feedbackResponse.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      anonymous: true,
      name: true,
      whatsapp: true,
      groupSize: true,
      overall: true,
      comeAgain: true,
      ratings: true,
      extras: true,
      loved: true,
      leaderIdea: true,
      nextPlace: true,
      shareOk: true,
      featured: true,
      hidden: true,
      verified: true,
      flags: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export type TripResponse = Awaited<ReturnType<typeof getTripResponses>>[number];

/** Ideas and places from feedback for the suggestions board, newest first; hidden answers' ideas left out. */
export async function getSuggestions() {
  return prisma.suggestion.findMany({
    where: { OR: [{ responseId: null }, { response: { hidden: false } }] },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      kind: true,
      text: true,
      topic: true,
      status: true,
      note: true,
      createdAt: true,
      trip: { select: { id: true, title: true } },
      response: { select: { anonymous: true, name: true, verified: true } },
    },
  });
}

export type SuggestionItem = Awaited<ReturnType<typeof getSuggestions>>[number];

/** Trips with a feedback form or answers, newest first, with the answers that count (hidden ones left out). */
export async function getFeedbackOverview() {
  return prisma.trip.findMany({
    where: { OR: [{ feedbackForm: { isNot: null } }, { responses: { some: {} } }] },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      feedbackForm: { select: { isOpen: true } },
      responses: {
        where: { hidden: false },
        select: { overall: true, comeAgain: true, ratings: true, extras: true, groupSize: true, verified: true },
      },
    },
  });
}

export type FeedbackOverviewTrip = Awaited<ReturnType<typeof getFeedbackOverview>>[number];
