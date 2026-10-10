import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/trips/trip-status";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminTrips } from "@/lib/admin-queries";
import { formatDateRange } from "@/lib/format";
import { tripTypeLabel } from "@/lib/trips";

export const metadata: Metadata = { title: "Organiser: trips" };

export default async function AdminTripsPage() {
  const trips = await getAdminTrips();

  return (
    <main id="main" className="container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="stretch-semiwide text-3xl font-bold">Trips</h1>
        <Link href="/admin/trips/new" className={buttonVariants({ size: "sm" })}>
          New trip
        </Link>
      </div>

      <section className="mt-8 rounded-panel border border-signal/35 bg-signal/5 p-5" aria-labelledby="planned-trip-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-signal">Planned international trip</p><h2 id="planned-trip-heading" className="mt-1 text-xl font-bold">International Trip to Sri Lanka 2027</h2><p className="mt-1 text-sm text-lichen">Sigiriya · Kandy · Ella · Southern coast · Details soon</p></div>
          <Link href="/trips/international-trip-to-sri-lanka-2027" className={buttonVariants({ variant: "outline", size: "sm" })}>Open public page</Link>
        </div>
        <p className="mt-4 text-sm text-lichen">Dates, itinerary, cost and registration are still being prepared. Create the database trip when the route is confirmed.</p>
      </section>

      {trips.length === 0 ? (
        <div className="mt-10 rounded-panel border border-ridge bg-basalt p-6">
          <p className="text-mist">No trips yet.</p>
          <p className="mt-1 text-sm text-lichen">Create one as a draft; only organisers see drafts until you open them.</p>
          <Link href="/admin/trips/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>
            Create the first trip
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Seats</TableHead>
                <TableHead className="text-right">Waitlist</TableHead>
                <TableHead className="text-right">Not fully paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="min-w-56">
                    <Link href={`/admin/trips/${trip.id}`} className="font-semibold text-mist underline-offset-4 hover:text-signal hover:underline">
                      {trip.title}
                    </Link>
                    <p className="text-xs text-lichen">
                      {trip.location}, {tripTypeLabel(trip.kind, trip.startDate, trip.endDate).toLowerCase()}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-lichen">{formatDateRange(trip.startDate, trip.endDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={trip.status} />
                  </TableCell>
                  <TableCell className="stretch-narrow text-right tabular-nums">
                    {trip.confirmed}/{trip.maxCapacity}
                  </TableCell>
                  <TableCell className="stretch-narrow text-right tabular-nums">{trip.waitlisted}</TableCell>
                  <TableCell className="stretch-narrow text-right tabular-nums">{trip.paymentRequired ? trip.unpaid : <span className="text-lichen">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
