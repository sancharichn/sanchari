import "server-only";
import type { Prisma, TripStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PUBLIC_STATUSES } from "@/lib/trips";

const listSelect = {
  id: true,
  title: true,
  location: true,
  startDate: true,
  endDate: true,
  status: true,
  maxCapacity: true,
  budgetEst: true,
  _count: { select: { registrations: true } },
} satisfies Prisma.TripSelect;

export type TripListItem = {
  id: string;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: TripStatus;
  maxCapacity: number;
  budgetEst: string | null;
  registered: number;
};

function toListItem(trip: Prisma.TripGetPayload<{ select: typeof listSelect }>): TripListItem {
  return {
    id: trip.id,
    title: trip.title,
    location: trip.location,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
    maxCapacity: trip.maxCapacity,
    budgetEst: trip.budgetEst?.toString() ?? null,
    registered: trip._count.registrations,
  };
}

/** Trips taking (or done taking) registrations that haven't started yet, soonest first. */
export async function getUpcomingTrips(limit?: number): Promise<TripListItem[]> {
  const trips = await prisma.trip.findMany({
    where: { status: { in: ["OPEN", "WAITLIST", "FULL"] } },
    orderBy: { startDate: "asc" },
    take: limit,
    select: listSelect,
  });
  return trips.map(toListItem);
}

export async function getPublicTripGroups() {
  const trips = await prisma.trip.findMany({
    where: { status: { in: PUBLIC_STATUSES } },
    orderBy: { startDate: "asc" },
    select: listSelect,
  });
  const items = trips.map(toListItem);
  return {
    upcoming: items.filter((t) => t.status === "OPEN" || t.status === "WAITLIST" || t.status === "FULL"),
    ongoing: items.filter((t) => t.status === "ONGOING"),
    past: items.filter((t) => t.status === "COMPLETED").reverse(),
  };
}

export async function getTripForPage(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      registrations: {
        select: { id: true, userId: true, createdAt: true, paymentStatus: true, gearChecked: true, vehicleDetails: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      feedbacks: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      expenses: { select: { amount: true, paidById: true } },
    },
  });
}

export type TripForPage = NonNullable<Awaited<ReturnType<typeof getTripForPage>>>;

/** Totals for the home page; only shown once there is something to count. */
export async function getGroupStats() {
  const [completedTrips, members] = await Promise.all([
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.user.count(),
  ]);
  return { completedTrips, members };
}
