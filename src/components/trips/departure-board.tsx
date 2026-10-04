import Link from "next/link";
import { dateBlock, durationLabel } from "@/lib/format";
import type { TripListItem } from "@/lib/queries";
import { showsSeats } from "@/lib/trips";
import { SeatsMeter, StatusBadge } from "./trip-status";

/**
 * Trips as rows on a departure board: the dates lead, because "when" is the
 * first thing anyone checks.
 */
export function DepartureBoard({ trips, emptyText }: { trips: TripListItem[]; emptyText: React.ReactNode }) {
  if (trips.length === 0) {
    return <div className="border-y border-ridge py-10 text-lichen">{emptyText}</div>;
  }

  return (
    <ul className="border-b border-ridge">
      {trips.map((trip) => {
        const when = dateBlock(trip.startDate, trip.endDate);
        return (
          <li key={trip.id} className="border-t border-ridge">
            <Link
              href={`/trips/${trip.id}`}
              className="group grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-4 py-6 transition-colors hover:bg-white/[0.02] sm:grid-cols-[6.5rem_1fr] sm:gap-x-5 md:grid-cols-[7.5rem_minmax(0,1fr)_13rem_8rem] md:items-center md:px-2"
            >
              <div className="row-span-3 md:row-span-1">
                <p className="stretch-narrow whitespace-nowrap text-[1.75rem] font-bold leading-none tabular-nums text-mist sm:text-4xl">
                  {when.days}
                </p>
                <p className="mt-1.5 text-sm text-lichen">{when.label}</p>
              </div>

              <div className="min-w-0">
                <h3 className="stretch-semiwide text-xl font-bold leading-snug text-mist transition-colors group-hover:text-signal">
                  {trip.title}
                </h3>
                <p className="mt-1 text-sm text-lichen">
                  {trip.location}, {durationLabel(trip.startDate, trip.endDate).toLowerCase()}
                </p>
              </div>

              {showsSeats(trip.status, trip.registered) ? (
                <SeatsMeter registered={trip.registered} capacity={trip.maxCapacity} status={trip.status} />
              ) : (
                // Holds the seats column on wide screens so the status badge stays lined up.
                <span aria-hidden="true" className="hidden md:block" />
              )}

              <div className="md:text-right">
                <StatusBadge status={trip.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
