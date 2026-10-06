import Link from "next/link";
import { ContourField } from "@/components/site/contour-field";
import { dateBlock } from "@/lib/format";
import type { TripListItem } from "@/lib/queries";
import { showsSeats, tripTypeLabel } from "@/lib/trips";
import { SeatsMeter, StatusBadge } from "./trip-status";

/** Trips as photo cards: the cover photo sells the place, the date leads the text. */
export function TripCards({ trips, emptyText }: { trips: TripListItem[]; emptyText: React.ReactNode }) {
  if (trips.length === 0) {
    return (
      <div className="trip-empty grid items-center gap-6 rounded-panel border border-white/15 bg-basalt p-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-8 md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- existing local campsite photograph */}
        <img
          src="/covers/jawadhu-hills-camp.jpg"
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
        <div className="text-sm leading-relaxed text-lichen">{emptyText}</div>
      </div>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}

function TripCard({ trip }: { trip: TripListItem }) {
  const when = dateBlock(trip.startDate, trip.endDate);
  const type = tripTypeLabel(trip.kind, trip.startDate, trip.endDate);
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="trip-card group flex h-full flex-col overflow-hidden rounded-panel border border-ridge bg-basalt transition-colors hover:border-signal/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-night">
        {trip.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- already resized and cached by our own photo proxy
          <img
            src={trip.cover.src[960]}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ContourField className="opacity-80" />
        )}
        {/* Keeps the date and badge readable on any photo. */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={trip.status} className="bg-black/60 backdrop-blur-sm" />
        </div>
        <p className="absolute bottom-4 left-4 text-mist">
          <span className="stretch-narrow block text-4xl font-bold leading-none tabular-nums">{when.days}</span>
          <span className="mt-1 block text-sm text-mist/85">{when.label}</span>
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="stretch-semiwide text-xl font-bold leading-snug text-mist transition-colors group-hover:text-signal">
            {trip.title}
          </h3>
          <p className="mt-1 text-sm text-lichen">
            {trip.location}, {type.toLowerCase()}
          </p>
        </div>
        {showsSeats(trip.status, trip.registered) ? (
          <SeatsMeter className="mt-auto" registered={trip.registered} capacity={trip.maxCapacity} status={trip.status} />
        ) : null}
      </div>
    </Link>
  );
}
