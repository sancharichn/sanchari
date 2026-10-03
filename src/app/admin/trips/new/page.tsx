import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EMPTY_TRIP, TripForm } from "@/components/admin/trip-form";

export const metadata: Metadata = { title: "Organiser: new trip" };

export default function NewTripPage() {
  return (
    <main id="main" className="container max-w-3xl py-10 md:py-14">
      <Link href="/admin/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-lichen hover:text-mist">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Trips
      </Link>
      <h1 className="stretch-semiwide mt-6 text-3xl font-bold">New trip</h1>
      <p className="measure mt-3 text-lichen">
        New trips start as drafts, visible only to organisers. Set the status to Open when you&apos;re ready to take
        registrations.
      </p>
      <div className="mt-10">
        <TripForm tripId={null} initial={EMPTY_TRIP} />
      </div>
    </main>
  );
}
