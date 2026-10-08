import { notFound, redirect } from "next/navigation";
import { TripPassport } from "@/components/trips/trip-passport";
import { getTripForPage } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { tripPath } from "@/lib/trip-url";

export const dynamic = "force-dynamic";

export default async function TripPassportPage({ params }: { params: { id: string } }) {
  const user = await requireUser(`/trips/${params.id}/passport`);
  const trip = await getTripForPage(params.id);
  if (!trip) notFound();
  if (trip.slug && params.id !== trip.slug) redirect(`${tripPath(trip)}/passport`);
  const registration = trip.registrations.find((item) => item.userId === user.id);
  if (!registration && user.role !== "ADMIN") notFound();
  if (!registration) notFound();
  return <TripPassport trip={trip} registration={registration} />;
}
