import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SeatsMeter } from "@/components/trips/trip-status";
import { formatDateRange } from "@/lib/format";
import type { TripListItem } from "@/lib/queries";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { KIND_PLURAL, TRIP_KINDS, tripTypeLabel } from "@/lib/trips";
import { tripPath } from "@/lib/trip-url";
import { RevealNumber } from "@/components/site/reveal-number";
import { HeroBackdrop, type HeroSlide } from "@/components/site/hero-backdrop";

export function Hero({
  next,
  signedIn,
  slides,
  memberName,
  tripsCount,
  photoCount,
}: {
  next: TripListItem | null;
  signedIn: boolean;
  slides: HeroSlide[];
  memberName?: string | null;
  tripsCount: number;
  photoCount: number;
}) {
  return (
    <section className="home-hero relative isolate overflow-hidden border-b border-ridge">
      <HeroBackdrop slides={slides.length ? slides : [{ id: "fallback", src: "/covers/jawadhu-hills-camp.jpg", alt: "Sanchari camp beneath a mountain sky", headline: "Travel with nature." }]} />
      <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
      <div aria-hidden="true" className="hero-aurora absolute -right-20 top-16 -z-10 h-80 w-80 rounded-full bg-signal/20 blur-3xl" />
      <div aria-hidden="true" className="hero-contours absolute inset-x-0 bottom-0 -z-10 h-64 opacity-60" />
      <div aria-hidden="true" className="hero-stamp absolute right-[9%] top-24 flex size-32 rotate-6 items-center justify-center rounded-full border-2 border-signal p-4 text-center text-[0.65rem] font-black uppercase leading-tight tracking-[0.18em] text-signal md:flex">Travel with nature</div>
      <div className="hero-content container relative grid gap-4 pb-5 pt-[28rem] md:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)] md:items-end md:gap-5 md:pb-5 md:pt-[31rem]">
        <div className="hero-action-panel rounded-panel border border-white/15 bg-basalt/55 p-5 backdrop-blur-md md:p-6">
          {signedIn ? <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-signal">Welcome back{memberName ? `, ${memberName.trim().split(/\s+/)[0]}` : ""}</p> : <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-signal">Travel with nature</p>}
          <div className="hero-actions flex flex-wrap gap-3">
            <Link href="/trips" className={buttonVariants({ size: "lg" })}>
              Explore trips
            </Link>
            {signedIn ? (
              <Link href="/profile" className={buttonVariants({ variant: "outline", size: "lg" })}>
                My trips
              </Link>
            ) : (
              // New visitors need the joining steps more than a sign-in; the header has Sign in.
              <Link href="#join" className={buttonVariants({ variant: "outline", size: "lg" })}>
                How to join
              </Link>
            )}
            {signedIn ? <Link href="/profile" className={buttonVariants({ variant: "outline", size: "lg" })}>Trip Passport</Link> : null}
          </div>
          <dl className="hero-signals mt-5 flex flex-wrap gap-5 text-sm text-mist/80">
            <div><dt>Upcoming trips</dt><dd><RevealNumber value={tripsCount} /></dd></div>
            <div><dt>Shared trail photos</dt><dd><RevealNumber value={photoCount} /></dd></div>
          </dl>
        </div>

        <div className="flex flex-col">
          <NextDeparture trip={next} />
        </div>
      </div>

      <div className="container relative pb-10 md:pb-14">
        <TripFinder />
      </div>
    </section>
  );
}

/** A plain GET form to the Trips page, so it works before (and without) JavaScript. */
function TripFinder() {
  return (
    <form
      action="/trips"
      method="get"
      role="search"
      aria-label="Find a trip"
      className="hero-finder grid gap-3 rounded-panel border border-white/20 bg-basalt/65 p-4 backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"
    >
      <div className="grid gap-1.5">
        <label htmlFor="finder-type" className="text-sm font-semibold text-mist">
          What would you like to do?
        </label>
        <select
          id="finder-type"
          name="type"
          defaultValue=""
          className="h-12 w-full rounded-[10px] border border-ridge bg-night px-3.5 text-base text-mist"
        >
          <option value="">Everything coming up</option>
          {TRIP_KINDS.map((k) => (
            <option key={k} value={k.toLowerCase()}>
              {KIND_PLURAL[k]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={buttonVariants({ size: "lg", className: "h-12" })}>
        Find trips
      </button>
    </form>
  );
}

function NextDeparture({ trip }: { trip: TripListItem | null }) {
  const cardClass = "departure-card relative z-10 block rounded-panel border border-white/20 bg-basalt/55 p-6 backdrop-blur-xl";

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
    <Link href={tripPath(trip)} className={`${cardClass} group transition-colors hover:border-signal/60`}>
      <p className="text-sm text-lichen">Next departure</p>
      <p className="stretch-semiwide mt-2 text-2xl font-bold leading-tight text-mist transition-colors group-hover:text-signal">
        {trip.title}
      </p>
      <p className="mt-2 text-sm text-mist/85">{formatDateRange(trip.startDate, trip.endDate)}</p>
      <p className="text-sm text-lichen">
        {trip.location}, {tripTypeLabel(trip.kind, trip.startDate, trip.endDate).toLowerCase()}
      </p>
      <SeatsMeter className="mt-5" registered={trip.registered} confirmed={trip.confirmed} capacity={trip.maxCapacity} status={trip.status} />
    </Link>
  );
}
