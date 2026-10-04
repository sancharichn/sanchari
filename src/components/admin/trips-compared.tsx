import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FeedbackOverviewTrip } from "@/lib/admin-queries";
import { ASPECTS, positiveShare, scoreResponses } from "@/lib/feedback";
import { formatDateRange } from "@/lib/format";

const SHORT_ASPECT: Record<string, string> = {
  venue: "Venue",
  food: "Food",
  travel: "Travel",
  planning: "Planning",
  value: "Value",
};

const pct = (share: number | null) => (share === null ? "—" : `${Math.round(share * 100)}%`);

/** Each trip's feedback side by side: answers, overall, come again, and each part of the trip. */
export function TripsCompared({ trips }: { trips: FeedbackOverviewTrip[] }) {
  const rows = trips.map((trip) => ({
    trip,
    scores: scoreResponses(trip.responses, []),
    verified: trip.responses.filter((r) => r.verified).length,
  }));

  return (
    <section aria-labelledby="compare-heading" className="mt-8">
      <h2 id="compare-heading" className="stretch-semiwide text-xl font-bold">
        Trips compared
      </h2>
      <p className="measure mt-2 text-sm text-lichen">
        Newest trip first. Each part of the trip shows the share of answers that rated it Excellent or Good. Hidden
        answers don&apos;t count. Open a trip for its charts and every answer.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-mist">No trip has a feedback form yet. Set one up from a trip&apos;s Feedback tab.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-panel border border-ridge">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-basalt text-lichen">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Trip
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Answers
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Overall
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Would come again
                </th>
                {ASPECTS.map((a) => (
                  <th key={a.id} scope="col" className="px-3 py-3 text-right font-semibold" title={a.label}>
                    {SHORT_ASPECT[a.id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ trip, scores, verified }) => (
                <tr key={trip.id} className="border-t border-ridge">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <Link href={`/admin/trips/${trip.id}?tab=feedback`} className="font-semibold text-mist underline-offset-4 hover:text-signal hover:underline">
                      {trip.title}
                    </Link>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-lichen">
                      {formatDateRange(trip.startDate, trip.endDate)}
                      {trip.feedbackForm?.isOpen ? <Badge variant="solid">Open</Badge> : null}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums text-mist">
                    {scores.n}
                    {verified ? <span className="block text-xs text-lichen">{verified} verified</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <Meter value={scores.overall.average} max={5} label={scores.overall.average === null ? "—" : `${scores.overall.average.toFixed(1)} / 5`} />
                  </td>
                  <td className="px-4 py-3">
                    <Meter value={scores.comeAgain.yesShare} max={1} label={pct(scores.comeAgain.yesShare)} />
                  </td>
                  {scores.aspects.map((a) => (
                    <td
                      key={a.id}
                      className="px-3 py-3 text-right tabular-nums text-mist"
                      title={`${a.label}: ${a.counts.EXCELLENT} excellent, ${a.counts.GOOD} good, ${a.counts.NEEDS_WORK} needs improvement`}
                    >
                      {pct(positiveShare(a.counts))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** A number out of a maximum, as a short track filled to the value, with the value beside it. */
function Meter({ value, max, label }: { value: number | null; max: number; label: string }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="block h-2 w-20 shrink-0 rounded-full bg-ridge">
        {value !== null ? (
          <span className="block h-full rounded-full bg-signal" style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%` }} />
        ) : null}
      </span>
      <span className="tabular-nums text-mist">{label}</span>
    </span>
  );
}
