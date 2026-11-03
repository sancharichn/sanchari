import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TripDetail, type TripViewer } from "@/components/trips/trip-detail";
import { formatDateRange } from "@/lib/format";
import { getMemberProfile, getTripForPage } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { isPublicStatus } from "@/lib/trips";
import { tripPath } from "@/lib/trip-url";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const trip = await getTripForPage(params.id);
  if (!trip || (!isPublicStatus(trip.status) && !trip.interestOpen)) return { title: "Trip" };
  return {
    title: trip.title,
    description: `${trip.location}, ${formatDateRange(trip.startDate, trip.endDate)}. ${trip.description.slice(0, 140)}`,
  };
}

export default async function TripPage({ params }: Params) {
  const [trip, user] = await Promise.all([getTripForPage(params.id), getCurrentUserSafe()]);
  if (!trip) notFound();
  if (trip.slug && params.id !== trip.slug) redirect(tripPath(trip));
  if (!isPublicStatus(trip.status) && !trip.interestOpen && user?.role !== "ADMIN") notFound();

  let viewer: TripViewer = null;
  let planningInterest: { partySize: number; note: string | null } | null = null;
  if (user) {
    const [profile, interest] = await Promise.all([getMemberProfile(user.id), trip.interestOpen ? prisma.tripInterest.findUnique({ where: { journey_userId: { journey: `trip:${trip.id}`, userId: user.id } }, select: { partySize: true, note: true } }) : null]);
    planningInterest = interest;
    viewer = {
      user,
      profile: {
        image: profile?.image ?? null,
        phone: profile?.phone ?? null,
        emergencyContact: profile?.emergencyContact ?? null,
        bloodGroup: profile?.bloodGroup ?? null,
        birthdayMonth: profile?.birthdayMonth ?? null,
        birthdayDay: profile?.birthdayDay ?? null,
        familyMembers: profile?.familyMembers ?? [],
      },
    };
  }

  return <TripDetail trip={trip} viewer={viewer} planningInterest={planningInterest} />;
}
