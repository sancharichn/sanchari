import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminTripView } from "@/components/admin/admin-trip-view";
import { getAdminTrip, getPayerOptions } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/session";

type Params = { params: { id: string }; searchParams: { tab?: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const trip = await getAdminTrip(params.id);
  return { title: trip ? `Organiser: ${trip.title}` : "Organiser" };
}

export default async function AdminTripPage({ params, searchParams }: Params) {
  const admin = await requireAdmin();
  const [trip, payers] = await Promise.all([getAdminTrip(params.id), getPayerOptions(params.id)]);
  if (!trip) notFound();

  return <AdminTripView trip={trip} payers={payers} adminId={admin.id} tab={searchParams.tab} />;
}
