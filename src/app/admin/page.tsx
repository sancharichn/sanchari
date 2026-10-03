import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/site/site-header";
import { StatusBadge } from "@/components/trips/trip-status";
import { buttonVariants } from "@/components/ui/button";
import { getAdminOverview } from "@/lib/admin-queries";
import { formatDateRange, formatDateTime } from "@/lib/format";
import { seatSummary, splitRoster } from "@/lib/trips";

export const metadata: Metadata = { title: "Organiser" };

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const next = overview.nextTrip;
  const nextRoster = next ? splitRoster(next.registrations, next.maxCapacity) : null;

  return (
    <main id="main" className="container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="stretch-semiwide text-3xl font-bold">Overview</h1>
        <Link href="/admin/trips/new" className={buttonVariants({ size: "sm" })}>
          New trip
        </Link>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-ridge bg-ridge md:grid-cols-4">
        <Figure label="Members" value={overview.members} />
        <Figure label="Upcoming trips" value={overview.upcomingCount} />
        <Figure label="Seats not fully paid" value={overview.unpaid} hint="Confirmed seats on upcoming trips" />
        <Figure label="Gear checks to do" value={overview.gearPending} hint="Confirmed seats on upcoming trips" />
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="stretch-semiwide text-xl font-bold">
            Next departure
          </h2>
          {next && nextRoster ? (
            <div className="mt-5 rounded-panel border border-ridge bg-basalt p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="stretch-semiwide text-2xl font-bold leading-tight">{next.title}</p>
                  <p className="mt-1 text-sm text-lichen">
                    {formatDateRange(next.startDate, next.endDate)}, {next.location}
                  </p>
                </div>
                <StatusBadge status={next.status} />
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <SmallFigure label="Seats taken" value={`${seatSummary(next.registrations.length, next.maxCapacity).taken}/${next.maxCapacity}`} />
                <SmallFigure label="Waitlist" value={String(nextRoster.waitlisted.length)} />
                <SmallFigure
                  label="Not fully paid"
                  value={String(nextRoster.confirmed.filter((r) => r.paymentStatus === "PENDING" || r.paymentStatus === "PARTIAL").length)}
                />
              </dl>
              <Link href={`/admin/trips/${next.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-6" })}>
                Manage this trip
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-panel border border-ridge bg-basalt p-6 text-lichen">
              Nothing is open for registration.{" "}
              <Link href="/admin/trips/new" className="text-signal underline underline-offset-4">
                Plan the next trip
              </Link>
              .
            </div>
          )}
        </section>

        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="stretch-semiwide text-xl font-bold">
            Latest registrations
          </h2>
          {overview.recent.length === 0 ? (
            <p className="mt-5 text-lichen">No registrations yet.</p>
          ) : (
            <ul className="mt-5 divide-y divide-ridge border-y border-ridge">
              {overview.recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <Avatar name={r.user.name} image={null} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-mist">
                      <span className="font-semibold">{r.user.name ?? r.user.email}</span> registered for{" "}
                      <Link href={`/admin/trips/${r.trip.id}`} className="underline underline-offset-4 hover:text-signal">
                        {r.trip.title}
                      </Link>
                    </p>
                    <p className="text-xs text-lichen">{formatDateTime(r.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Figure({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-basalt p-5">
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="stretch-narrow mt-2 text-4xl font-bold tabular-nums text-mist">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-lichen">{hint}</p> : null}
    </div>
  );
}

function SmallFigure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-lichen">{label}</dt>
      <dd className="stretch-narrow mt-1 text-2xl font-bold tabular-nums text-mist">{value}</dd>
    </div>
  );
}
