import "server-only";
import { countTravellers } from "@/lib/family";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { splitRoster } from "@/lib/trips";

const OUTSTANDING: PaymentStatus[] = ["PENDING", "PARTIAL"];

/** Numbers and lists for the organiser's overview. */
export async function getAdminOverview(now = new Date()) {
  const upcoming: Prisma.TripWhereInput = { status: { in: ["OPEN", "WAITLIST", "FULL"] }, startDate: { gte: now } };
  const rosterSelect = { select: { id: true, createdAt: true, partySize: true, approvalStatus: true, paymentStatus: true, gearChecked: true } } as const;

  const [members, upcomingTrips, nextTrip, recent] = await Promise.all([
    prisma.user.count(),
    prisma.trip.findMany({
      where: upcoming,
      select: { id: true, kind: true, maxCapacity: true, registrations: rosterSelect },
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
        kind: true,
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
    if (trip.kind === "MEETUP") continue;
    const { confirmed } = splitRoster(trip.registrations, trip.maxCapacity);
    unpaid += countTravellers(confirmed.filter((r) => OUTSTANDING.includes(r.paymentStatus)));
    gearPending += countTravellers(confirmed.filter((r) => !r.gearChecked));
  }

  return { members, upcomingCount: upcomingTrips.length, unpaid, gearPending, nextTrip, recent };
}

/** Operational signals for the trip control room. Kept in one query so the dashboard stays fast. */
export async function getTripControlRoom(now = new Date()) {
  const trips = await prisma.trip.findMany({
    where: { startDate: { gte: now }, status: { in: ["DRAFT", "OPEN", "WAITLIST", "FULL"] } },
    orderBy: { startDate: "asc" }, take: 8,
    select: { id: true, title: true, location: true, startDate: true, endDate: true, kind: true, status: true, maxCapacity: true, registrations: { select: { id: true, createdAt: true, partySize: true, approvalStatus: true, paymentStatus: true, gearChecked: true, agreedToGuidelinesAt: true, familyConsentAt: true, parentalConsentAt: true, carpoolChoice: true, carpoolLocation: true } } },
  });
  return trips.map((trip) => {
    const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
    const people = countTravellers(confirmed);
    const lightweight = trip.kind === "MEETUP";
    return { ...trip, confirmed: people, waitlisted: countTravellers(waitlisted), unpaid: lightweight ? 0 : countTravellers(confirmed.filter((item) => OUTSTANDING.includes(item.paymentStatus))), gearPending: lightweight ? 0 : countTravellers(confirmed.filter((item) => !item.gearChecked)), missingConsent: confirmed.filter((item) => !item.agreedToGuidelinesAt || (item.partySize > 1 && !item.familyConsentAt)).length, carpoolNeeds: confirmed.filter((item) => item.carpoolChoice === "NEED_RIDE" && !item.carpoolLocation).length, readiness: { minimum: people > 0, payments: lightweight || confirmed.every((item) => item.paymentStatus === "PAID"), gear: lightweight || confirmed.every((item) => item.gearChecked), consent: confirmed.every((item) => item.agreedToGuidelinesAt && (item.partySize === 1 || item.familyConsentAt)) } };
  });
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
      registrations: { select: { id: true, createdAt: true, partySize: true, approvalStatus: true, paymentStatus: true } },
    },
  });
  return trips.map((trip) => {
    const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
    return {
      ...trip,
      paymentRequired: trip.kind !== "MEETUP",
      confirmed: countTravellers(confirmed),
      waitlisted: countTravellers(waitlisted),
      unpaid: trip.kind === "MEETUP" ? 0 : countTravellers(confirmed.filter((r) => OUTSTANDING.includes(r.paymentStatus))),
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
          approvalStatus: true,
          gearChecked: true,
          checkedInCount: true,
          carpoolMatched: true,
          vehicleDetails: true,
          carpoolChoice: true,
          carpoolLocation: true,
          carpoolSeats: true,
          agreedToGuidelinesAt: true,
          partySize: true,
          companions: true,
          familyConsentAt: true,
          parentalConsentAt: true,
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
      tasks: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, ownerId: true, dueAt: true, completedAt: true, owner: { select: { name: true, email: true } } } },
      incidents: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, severity: true, description: true, actionTaken: true, closedAt: true, createdAt: true, reportedBy: { select: { name: true, email: true } } } },
      paymentEvents: { orderBy: { createdAt: "desc" }, select: { id: true, registrationId: true, amount: true, method: true, reference: true, note: true, createdAt: true, registration: { select: { user: { select: { name: true, email: true } } } }, recordedBy: { select: { name: true, email: true } } } },
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
      followUpStatus: true,
      followUpNote: true,
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
