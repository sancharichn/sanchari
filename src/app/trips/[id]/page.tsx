import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripDetail } from "@/components/trips/trip-detail";
import { formatDateRange } from "@/lib/format";
import { getTripForPage } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { isPublicStatus } from "@/lib/trips";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const trip = await getTripForPage(params.id);
  if (!trip || !isPublicStatus(trip.status)) return { title: "Trip" };
  return {
    title: trip.title,
    description: `${trip.location}, ${formatDateRange(trip.startDate, trip.endDate)}. ${trip.description.slice(0, 140)}`,
  };
}

export default async function TripPage({ params }: Params) {
  const [trip, user] = await Promise.all([getTripForPage(params.id), getCurrentUserSafe()]);
  if (!trip) notFound();
  if (!isPublicStatus(trip.status) && user?.role !== "ADMIN") notFound();

  return <TripDetail trip={trip} user={user} />;
}
