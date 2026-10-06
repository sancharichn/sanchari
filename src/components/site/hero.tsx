import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SeatsMeter } from "@/components/trips/trip-status";
import { formatDateRange } from "@/lib/format";
import type { GalleryImage } from "@/lib/drive";
import type { TripListItem } from "@/lib/queries";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { KIND_PLURAL, TRIP_KINDS, tripTypeLabel } from "@/lib/trips";

export function Hero({
  next,
  signedIn,
  photo,
}: {
  next: TripListItem | null;
  signedIn: boolean;
  /** The next trip's cover, or the newest gallery photo. */
  photo: GalleryImage | null;
}) {
  return (
    <section className="home-hero relative isolate overflow-hidden border-b border-ridge">
      {/* Keep the landscape present even before the first gallery upload. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- local fallback or our resized photo proxy */}
      <img
        src={photo?.src[1600] ?? "/covers/jawadhu-hills-camp.jpg"}
        srcSet={photo ? `${photo.src[960]} 960w, ${photo.src[1600]} 1600w` : undefined}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        className="hero-landscape absolute inset-0 -z-20 size-full object-cover"
      />
      <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
      <div className="hero-content container relative grid gap-9 pb-10 pt-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:items-end md:gap-16 md:pb-16 md:pt-20">
        <div>
          <h1 className="stretch-wide text-[clamp(3.1rem,8vw,6.5rem)] font-extrabold leading-[0.92] tracking-[-0.02em] text-mist">
            <span className="block">TRAVEL</span>
            <span className="block">WITH</span>
            <span className="block">NATURE</span>
          </h1>
          <p className="hero-description mt-8 text-base leading-relaxed text-mist/85 md:text-lg md:leading-8">
            We&apos;re the Chennai unit of Sanchari, the community that began online among Malayali travel lovers over a
            decade ago. Anyone in Chennai is welcome. We travel as volunteers, share only the real costs, and look after
            the places we visit.
          </p>
          <div className="hero-actions mt-9 flex flex-wrap gap-3">
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
        </div>
      </div>

      <div className="container relative pb-12 md:pb-16">
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
    <Link href={`/trips/${trip.id}`} className={`${cardClass} group transition-colors hover:border-signal/60`}>
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
