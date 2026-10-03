import type { ItineraryDay } from "@/lib/trips";

/** The itinerary as a trail: one waypoint per day, the last one filled in. */
export function ItineraryTrail({ days }: { days: ItineraryDay[] }) {
  if (days.length === 0) {
    return <p className="text-lichen">The day-by-day plan will be posted here closer to departure.</p>;
  }

  return (
    <ol className="relative">
      {days.map((day, i) => {
        const last = i === days.length - 1;
        return (
          <li key={i} className="relative grid grid-cols-[4.5rem_1fr] gap-x-4 pb-9 last:pb-0">
            {!last ? (
              <span aria-hidden="true" className="absolute left-[calc(5.9375rem-0.5px)] top-5 h-full w-px bg-ridge" />
            ) : null}
            <p className="stretch-narrow pt-0.5 text-sm font-semibold tabular-nums text-lichen">Day {i + 1}</p>
            <div className="relative pl-8">
              <span
                aria-hidden="true"
                className={
                  last
                    ? "absolute left-0 top-1 size-3.5 rounded-full border-2 border-signal bg-signal"
                    : "absolute left-0 top-1 size-3.5 rounded-full border-2 border-signal bg-night"
                }
              />
              <h3 className="text-lg font-bold leading-snug text-mist">{day.title}</h3>
              {day.details ? (
                <p className="measure mt-2 whitespace-pre-line text-lichen">{day.details}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
