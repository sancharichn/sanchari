import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminTripView } from "@/components/admin/admin-trip-view";
import { getAdminTrip, getPayerOptions, getTripResponses } from "@/lib/admin-queries";
import { getCoverChoices } from "@/lib/drive";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string }; searchParams: { tab?: string; fv?: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const trip = await getAdminTrip(params.id);
  return { title: trip ? `Organiser: ${trip.title}` : "Organiser" };
}

export default async function AdminTripPage({ params, searchParams }: Params) {
  const admin = await requireAdmin();
  const [trip, payers, responses, coverChoices] = await Promise.all([
    getAdminTrip(params.id),
    getPayerOptions(params.id),
    getTripResponses(params.id),
    getCoverChoices(),
  ]);
  if (!trip) notFound();
  const organisers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true, email: true } });

  return (
    <AdminTripView
      trip={trip}
      organisers={organisers.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
      payers={payers}
      adminId={admin.id}
      tab={searchParams.tab}
      responses={responses}
      verifiedOnly={searchParams.fv === "1"}
      coverChoices={coverChoices}
    />
  );
}
