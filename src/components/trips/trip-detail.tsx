import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContourField } from "@/components/site/contour-field";
import { durationLabel, formatDateRange, formatINR } from "@/lib/format";
import type { TripForPage } from "@/lib/queries";
import type { CurrentUser } from "@/lib/session";
import { isPublicStatus, parseItinerary, STATUS_LABEL } from "@/lib/trips";
import { ItineraryTrail } from "./itinerary-trail";
import { RegistrationPanel } from "./registration-panel";
import { StatusBadge } from "./trip-status";

/** The whole trip page, given its data. Kept separate from fetching so it can be previewed. */
export function TripDetail({ trip, user, now = new Date() }: { trip: TripForPage; user: CurrentUser | null; now?: Date }) {
  const days = parseItinerary(trip.itinerary);
  const started = trip.startDate.getTime() <= now.getTime();

  return (
    <main id="main">
      <header className="relative isolate overflow-hidden border-b border-ridge">
        <ContourField className="opacity-70 [mask-image:linear-gradient(to_bottom,black_35%,transparent)]" />
        <div className="container relative py-12 md:py-16">
          <Link href="/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-lichen hover:text-mist">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All trips
          </Link>

          {!isPublicStatus(trip.status) ? (
            <p className="mt-6 max-w-xl rounded-[10px] border border-dashed border-lichen/60 px-4 py-3 text-sm text-mist">
              This trip is {STATUS_LABEL[trip.status].toLowerCase()}, so only organisers can see this page.
            </p>
          ) : null}

          <div className="mt-6">
            <StatusBadge status={trip.status} />
          </div>
          <h1 className="stretch-wide mt-4 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.01em] md:text-5xl">
            {trip.title}
          </h1>

          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
            <Fact label="When" value={formatDateRange(trip.startDate, trip.endDate)} />
            <Fact label="Where" value={trip.location} />
            <Fact label="Length" value={durationLabel(trip.startDate, trip.endDate)} />
            <Fact
              label="Estimated cost"
              value={trip.budgetEst ? `${formatINR(trip.budgetEst)} per person` : "To be confirmed"}
            />
          </dl>
        </div>
      </header>

      <div className="container grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="stretch-semiwide text-2xl font-bold">
              About this trip
            </h2>
            <p className="measure mt-5 whitespace-pre-line leading-relaxed text-mist/90">{trip.description}</p>
          </section>

          <section aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="stretch-semiwide text-2xl font-bold">
              Day by day
            </h2>
            <div className="mt-8">
              <ItineraryTrail days={days} />
            </div>
          </section>
        </div>

        <aside className="order-first lg:sticky lg:top-24 lg:order-last lg:self-start">
          <RegistrationPanel
            tripId={trip.id}
            status={trip.status}
            registered={trip.registrations.length}
            capacity={trip.maxCapacity}
            signedIn={Boolean(user)}
            started={started}
          />
        </aside>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="mt-1 font-semibold leading-snug text-mist">{value}</dd>
    </div>
  );
}
