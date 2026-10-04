import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SeatsMeter } from "@/components/trips/trip-status";
import { formatDateRange } from "@/lib/format";
import type { TripListItem } from "@/lib/queries";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { ContourField } from "./contour-field";
import { TrailClimb } from "./trail-climb";

export function Hero({ next, signedIn }: { next: TripListItem | null; signedIn: boolean }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-ridge">
      <ContourField className="[mask-image:linear-gradient(to_bottom,black_50%,transparent)]" />
      <div className="container relative grid gap-12 pb-16 pt-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:items-end md:gap-16 md:pb-20 md:pt-20">
        <div>
          <h1 className="stretch-wide text-[clamp(3.1rem,10vw,8rem)] font-extrabold leading-[0.86] tracking-[-0.02em] text-mist">
            <span className="block">TRAVEL</span>
            <span className="block">WITH</span>
            <span className="block">NATURE</span>
          </h1>
          <p className="measure mt-8 text-lg text-mist/85 md:text-xl md:leading-8">
            We&apos;re the Chennai unit of Sanchari, the community that began online among Malayali travel lovers over a
            decade ago. Anyone in Chennai is welcome. We travel as volunteers, share only the real costs, and look after
            the places we visit.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/trips" className={buttonVariants({ size: "lg" })}>
              See upcoming trips
            </Link>
            {signedIn ? (
              <Link href="/profile" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Your trips
              </Link>
            ) : (
              // New visitors need the joining steps more than a sign-in; the header has Sign in.
              <Link href="#join" className={buttonVariants({ variant: "outline", size: "lg" })}>
                How to join
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <NextDeparture trip={next} />
          <TrailClimb />
        </div>
      </div>
    </section>
  );
}

function NextDeparture({ trip }: { trip: TripListItem | null }) {
  const cardClass = "relative z-10 block rounded-panel border border-ridge bg-basalt/90 p-6 backdrop-blur-sm";

  if (!trip) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-lichen">Next departure</p>
        <p className="mt-2 text-lg font-semibold text-mist">The next trip is being planned.</p>
        <p className="mt-1 text-sm text-lichen">
          Follow{" "}
          <a className="text-mist underline underline-offset-4" href={INSTAGRAM_URL}>
            @{INSTAGRAM_HANDLE}
          </a>{" "}
          to hear first.
        </p>
      </div>
    );
  }

  return (
    <Link href={`/trips/${trip.id}`} className={`${cardClass} group transition-colors hover:border-signal/60`}>
      <p className="text-sm text-lichen">Next departure</p>
      <p className="stretch-semiwide mt-2 text-2xl font-bold leading-tight text-mist transition-colors group-hover:text-signal">
        {trip.title}
      </p>
      <p className="mt-2 text-sm text-mist/85">{formatDateRange(trip.startDate, trip.endDate)}</p>
      <p className="text-sm text-lichen">{trip.location}</p>
      <SeatsMeter className="mt-5" registered={trip.registered} capacity={trip.maxCapacity} status={trip.status} />
    </Link>
  );
}
