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
      feedbacks: {
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true, email: true } } },
      },
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
