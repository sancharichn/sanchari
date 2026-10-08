import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ResponseActions } from "@/components/admin/response-actions";
import { RatingMarks } from "@/components/members/rating-marks";
import { Badge } from "@/components/ui/badge";
import type { TripResponse } from "@/lib/admin-queries";
import {
  ASPECTS,
  COME_AGAIN,
  FLAG_LABEL,
  NOT_APPLICABLE_LABEL,
  OVERALL_WORDS,
  parseExtras,
  parseRatings,
  SCALE,
  scoreResponses,
  writerLabel,
  type ExtraQuestion,
  type ScaleCounts,
} from "@/lib/feedback";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * What a trip's feedback adds up to, for organisers: headline numbers, the
 * ratings as bars, the answers to the trip's own questions, and every
 * response with its moderation buttons.
 *
 * Chart colours for the three-step scale, checked against the card surface
 * (#121212) with the dataviz palette validator: neighbours stay apart under
 * protanopia/deuteranopia (worst ΔE 12.5) and for full-colour vision (27.1),
 * and every fill clears 3:1. Labels and numbers always sit beside the colour.
 */
const LEVEL_COLOR = { top: "#E6D65C", middle: "#71670B", low: "#FF6B57" } as const;

type Segment = { key: string; label: string; count: number; color: string };

const scaleSegments = (counts: ScaleCounts): Segment[] => [
  { key: "EXCELLENT", label: SCALE[0].label, count: counts.EXCELLENT, color: LEVEL_COLOR.top },
  { key: "GOOD", label: SCALE[1].label, count: counts.GOOD, color: LEVEL_COLOR.middle },
  { key: "NEEDS_WORK", label: SCALE[2].label, count: counts.NEEDS_WORK, color: LEVEL_COLOR.low },
];

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

const SCALE_ANSWER: Record<string, string> = {
  EXCELLENT: `${SCALE[0].mark} ${SCALE[0].label}`,
  GOOD: `${SCALE[1].mark} ${SCALE[1].label}`,
  NEEDS_WORK: `${SCALE[2].mark} ${SCALE[2].label}`,
  NA: NOT_APPLICABLE_LABEL,
};

/** +919840012345 → +91 98400 12345; other countries as stored. */
function formatWhatsApp(number: string) {
  const m = /^\+91(\d{5})(\d{5})$/.exec(number);
  return m ? `+91 ${m[1]} ${m[2]}` : number;
}

const COME_AGAIN_LABEL: Record<string, string> = Object.fromEntries(COME_AGAIN.map((c) => [c.value, c.label]));

type Props = {
  tripId: string;
  responses: TripResponse[];
  extras: ExtraQuestion[];
  verifiedOnly: boolean;
};

export function FeedbackResults({ tripId, responses, extras, verifiedOnly }: Props) {
  const verifiedCount = responses.filter((r) => r.verified && !r.hidden).length;
  const shown = responses.filter((r) => !verifiedOnly || r.verified);
  const counted = shown.filter((r) => !r.hidden);
  const scores = scoreResponses(counted, extras);
  const hiddenCount = shown.length - counted.length;

  const base = `/admin/trips/${tripId}?tab=feedback`;

  return (
    <div className="grid gap-12">
      {/* Filter: one row, above everything it scopes */}
      <nav aria-label="Which answers to count" className="flex flex-wrap items-center gap-2">
        <FilterLink href={base} current={!verifiedOnly} label="All answers" count={responses.filter((r) => !r.hidden).length} />
        <FilterLink href={`${base}&fv=1`} current={verifiedOnly} label="Verified only" count={verifiedCount} />
        <p className="text-sm text-lichen sm:ml-2">
          Verified answers come from people with a seat on this trip: signed in, or with a matching WhatsApp number.
        </p>
      </nav>

      {counted.length === 0 ? (
        <p className="text-mist">{verifiedOnly ? "No verified answers yet." : "Nothing to count yet: every answer is hidden."}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-ridge bg-ridge lg:grid-cols-4">
            <Tile
              label="Answers"
              value={String(scores.n)}
              note={scores.people > scores.n ? `Covering about ${scores.people} people` : hiddenCount ? `${hiddenCount} hidden` : "One per person or family"}
            />
            <Tile
              label="Overall"
              value={scores.overall.average === null ? "—" : `${scores.overall.average.toFixed(1)} / 5`}
              note={`${scores.overall.counts[4]} gave the full 5`}
            />
            <Tile
              label="Would come again"
              value={scores.comeAgain.yesShare === null ? "—" : `${percent(scores.comeAgain.YES, scores.n)}%`}
              note={`${scores.comeAgain.MAYBE} maybe, ${scores.comeAgain.NO} probably not`}
            />
            <Tile label="Verified" value={String(counted.filter((r) => r.verified).length)} note="From people on the trip" />
          </dl>

          <div className="grid gap-12 xl:grid-cols-2">
            <section aria-labelledby="fb-overall-heading">
              <h3 id="fb-overall-heading" className="text-lg font-bold">
                Overall stars
              </h3>
              <p className="mt-1 text-sm text-lichen">How many people gave each rating.</p>
              <div className="mt-5 grid gap-2.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <ValueBar
                    key={stars}
                    label={`${stars} ${stars === 1 ? "star" : "stars"}`}
                    hint={OVERALL_WORDS[stars]}
                    count={scores.overall.counts[stars - 1]}
                    max={Math.max(...scores.overall.counts)}
                  />
                ))}
              </div>
            </section>

            <section aria-labelledby="fb-again-heading">
              <h3 id="fb-again-heading" className="text-lg font-bold">
                Would they travel with Sanchari again?
              </h3>
              <Legend
                items={[
                  { label: COME_AGAIN[0].label, color: LEVEL_COLOR.top },
                  { label: COME_AGAIN[1].label, color: LEVEL_COLOR.middle },
                  { label: COME_AGAIN[2].label, color: LEVEL_COLOR.low },
                ]}
              />
              <div className="mt-5">
                <StackedRow
                  label="Everyone"
                  total={scores.n}
                  segments={[
                    { key: "YES", label: COME_AGAIN[0].label, count: scores.comeAgain.YES, color: LEVEL_COLOR.top },
                    { key: "MAYBE", label: COME_AGAIN[1].label, count: scores.comeAgain.MAYBE, color: LEVEL_COLOR.middle },
                    { key: "NO", label: COME_AGAIN[2].label, count: scores.comeAgain.NO, color: LEVEL_COLOR.low },
                  ]}
                />
              </div>
            </section>
          </div>

          <section aria-labelledby="fb-aspects-heading">
            <h3 id="fb-aspects-heading" className="text-lg font-bold">
              Each part of the trip
            </h3>
            <ScaleLegend />
            <div className="mt-5 grid gap-3">
              {scores.aspects.map((aspect) => (
                <StackedRow
                  key={aspect.id}
                  label={aspect.label}
                  total={aspect.counts.answered}
                  skipped={scores.n - aspect.counts.answered}
                  segments={scaleSegments(aspect.counts)}
                />
              ))}
            </div>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-semibold text-lichen hover:text-mist">Show the numbers as a table</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left">
                  <thead className="text-lichen">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Part of the trip
                      </th>
                      {SCALE.map((s) => (
                        <th key={s.value} scope="col" className="py-2 pr-4 text-right font-semibold">
                          {s.label}
                        </th>
                      ))}
                      <th scope="col" className="py-2 text-right font-semibold">
                        {NOT_APPLICABLE_LABEL}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {scores.aspects.map((a) => (
                      <tr key={a.id} className="border-t border-ridge">
                        <th scope="row" className="py-2 pr-4 font-normal text-mist">
                          {a.label}
                        </th>
                        <td className="py-2 pr-4 text-right">{a.counts.EXCELLENT}</td>
                        <td className="py-2 pr-4 text-right">{a.counts.GOOD}</td>
                        <td className="py-2 pr-4 text-right">{a.counts.NEEDS_WORK}</td>
                        <td className="py-2 text-right">{scores.n - a.counts.answered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          {scores.extras.length > 0 ? (
            <section aria-labelledby="fb-extras-heading">
              <h3 id="fb-extras-heading" className="text-lg font-bold">
                This trip&apos;s questions
              </h3>
              <div className="mt-5 grid gap-8 xl:grid-cols-2">
                {scores.extras.map((result) => (
                  <div key={result.question.id} className="rounded-[14px] border border-ridge p-5">
                    <h4 className="font-semibold text-mist">{result.question.label}</h4>
                    {result.kind === "stars" ? (
                      <>
                        <p className="mt-1 text-sm text-lichen">
                          {result.average === null
                            ? "No answers yet."
                            : `${result.average.toFixed(1)} / 5 from ${result.answered} ${result.answered === 1 ? "answer" : "answers"}`}
                        </p>
                        {result.answered ? (
                          <div className="mt-4 grid gap-2">
                            {[5, 4, 3, 2, 1].map((stars) => (
                              <ValueBar
                                key={stars}
                                label={`${stars} ${stars === 1 ? "star" : "stars"}`}
                                count={result.counts[stars - 1]}
                                max={Math.max(...result.counts)}
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : result.kind === "scale" ? (
                      <div className="mt-4">
                        <ScaleLegend />
                        <div className="mt-4">
                          <StackedRow label="Answers" total={result.counts.answered} segments={scaleSegments(result.counts)} />
                        </div>
                      </div>
                    ) : result.kind === "choice" ? (
                      <div className="mt-4 grid gap-2">
                        {result.counts.map((c) => (
                          <ValueBar key={c.option} label={c.option} count={c.count} max={Math.max(...result.counts.map((x) => x.count))} />
                        ))}
                      </div>
                    ) : result.answers.length === 0 ? (
                      <p className="mt-1 text-sm text-lichen">No answers yet.</p>
                    ) : (
                      <ul className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-2">
                        {result.answers.map((answer, i) => (
                          <li key={i} className="whitespace-pre-line border-l-2 border-ridge pl-3 text-sm text-mist/90">
                            {answer}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section aria-labelledby="fb-answers-heading">
        <h3 id="fb-answers-heading" className="text-lg font-bold">
          Every answer <span className="stretch-narrow tabular-nums text-lichen">{shown.length}</span>
        </h3>
        <p className="mt-1 text-sm text-lichen">
          Newest first. Hidden answers stay here but don&apos;t count. Only answers whose writers allowed quoting can go on
          the website.
        </p>
        <ol className="mt-5 grid gap-4">
          {shown.map((r) => (
            <li key={r.id}>
              <ResponseCard response={r} extras={extras} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function FilterLink({ href, current, label, count }: { href: string; current: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
        current ? "border-signal bg-signal text-night" : "border-ridge text-mist hover:border-mist/40",
      )}
    >
      {label}
      <span className={cn("stretch-narrow tabular-nums", current ? "text-night/70" : "text-lichen")}>{count}</span>
    </Link>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-basalt p-5">
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="mt-2 text-3xl font-bold">{value}</dd>
      <dd className="mt-1 text-xs text-lichen">{note}</dd>
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-lichen" aria-label="Key">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function ScaleLegend() {
  return (
    <Legend
      items={[
        { label: `${SCALE[0].mark} ${SCALE[0].label}`, color: LEVEL_COLOR.top },
        { label: `${SCALE[1].mark} ${SCALE[1].label}`, color: LEVEL_COLOR.middle },
        { label: `${SCALE[2].mark} ${SCALE[2].label}`, color: LEVEL_COLOR.low },
      ]}
    />
  );
}

/** One bar of a single series, growing from the left, with its count at the tip. */
function ValueBar({ label, hint, count, max }: { label: string; hint?: string; count: number; max: number }) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] sm:items-center sm:gap-3">
      <span className="break-words text-mist" title={hint ? `${label}: ${hint}` : undefined}>
        {label}
      </span>
      <span className="flex items-center gap-2">
        {count > 0 ? (
          <span aria-hidden="true" className="block h-3 rounded-r-[4px] bg-signal" style={{ width: `max(${width}%, 4px)` }} />
        ) : null}
        <span className="stretch-narrow tabular-nums text-lichen">
          {count}
          <span className="sr-only"> {count === 1 ? "answer" : "answers"}</span>
        </span>
      </span>
    </div>
  );
}

/**
 * A 100% bar split into the three levels, with a 2px gap between segments.
 * Hover or keyboard focus shows every level's count; the row's label says the same to screen readers.
 */
function StackedRow({ label, total, skipped = 0, segments }: { label: string; total: number; skipped?: number; segments: Segment[] }) {
  const parts = segments.map((s) => `${s.count} ${s.label} (${percent(s.count, total)}%)`);
  if (skipped > 0) parts.push(`${skipped} ${NOT_APPLICABLE_LABEL.toLowerCase()}`);
  const summary = total ? parts.join(", ") : "no answers yet";
  const visible = segments.filter((s) => s.count > 0);

  return (
    <div
      role="img"
      tabIndex={0}
      aria-label={`${label}: ${summary}`}
      className="group relative grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-3 gap-y-1 rounded-[6px] text-sm outline-offset-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_4.5rem]"
    >
      <span className="col-span-2 break-words text-mist sm:col-span-1" aria-hidden="true">
        {label}
      </span>
      <span aria-hidden="true" className="flex h-3 gap-[2px]">
        {total === 0 ? (
          <span className="h-full flex-1 rounded-r-[4px] border border-dashed border-ridge" />
        ) : (
          visible.map((s, i) => (
            <span
              key={s.key}
              className={cn("h-full transition-[filter] group-hover:brightness-110", i === visible.length - 1 && "rounded-r-[4px]")}
              style={{ flexGrow: s.count, flexBasis: 0, backgroundColor: s.color }}
            />
          ))
        )}
      </span>
      <span aria-hidden="true" className="stretch-narrow text-right tabular-nums text-lichen">
        {total} {total === 1 ? "answer" : "answers"}
      </span>

      {total > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none invisible absolute bottom-full left-0 z-10 sm:left-[10.75rem] mb-2 grid min-w-56 gap-1 rounded-[10px] border border-ridge bg-night px-3 py-2 text-xs shadow-lg group-hover:visible group-focus-visible:visible"
        >
          {segments.map((s) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
              <strong className="stretch-narrow tabular-nums text-mist">{s.count}</strong>
              <span className="text-lichen">
                {s.label} · {percent(s.count, total)}%
              </span>
            </span>
          ))}
          {skipped > 0 ? (
            <span className="pl-5 text-lichen">
              {skipped} {NOT_APPLICABLE_LABEL.toLowerCase()}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function ResponseCard({ response: r, extras }: { response: TripResponse; extras: ExtraQuestion[] }) {
  const ratings = parseRatings(r.ratings);
  const answers = parseExtras(r.extras);
  const featureBlockedBecause = r.hidden
    ? "Hidden answers can't go on the website."
    : !r.shareOk
      ? "Didn't allow quoting on the website."
      : !r.loved
        ? "Nothing under “what I loved” to quote."
        : null;

  return (
    <article className={cn("rounded-[14px] border bg-basalt p-5", r.hidden ? "border-dashed border-lichen/60" : "border-ridge")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-mist">{writerLabel(r)}</p>
          <p className="mt-0.5 text-sm text-lichen">
            {formatDateTime(r.updatedAt)}
            {r.updatedAt.getTime() - r.createdAt.getTime() > 60_000 ? " (edited)" : ""}
            {r.groupSize && r.groupSize > 1 ? ` · group of ${r.groupSize}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.verified ? <Badge variant="signal">Verified traveller</Badge> : null}
            {r.anonymous ? <Badge variant="muted">Anonymous</Badge> : null}
            {r.featured ? <Badge variant="solid">On the website</Badge> : null}
            {r.hidden ? <Badge variant="dashed">Hidden</Badge> : null}
            {r.flags.map((flag) => (
              <Badge key={flag} variant="danger">
                {FLAG_LABEL[flag] ?? flag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingMarks rating={r.overall} />
          <span className="text-sm text-lichen">{OVERALL_WORDS[r.overall]}</span>
        </div>
      </header>

      <dl className="mt-4 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
        {ASPECTS.map((a) => (
          <Answer key={a.id} label={a.label} value={ratings[a.id] ? SCALE_ANSWER[ratings[a.id]!] : "—"} />
        ))}
        <Answer label="Would come again" value={COME_AGAIN_LABEL[r.comeAgain] ?? "—"} />
        {extras.map((q) => {
          const answer = answers[q.id];
          if (answer === undefined || answer === null || answer === "") return null;
          const text = q.type === "stars" ? `${answer} / 5` : q.type === "scale" ? SCALE_ANSWER[String(answer)] ?? String(answer) : String(answer);
          return <Answer key={q.id} label={q.label} value={text} wide={q.type === "text"} />;
        })}
      </dl>

      {r.loved || r.leaderIdea || r.nextPlace ? (
        <div className="mt-4 grid gap-3 border-t border-ridge pt-4 text-sm">
          {r.loved ? <Words label={`Loved most${r.shareOk ? " (OK to quote)" : ""}`} text={r.loved} /> : null}
          {r.leaderIdea ? <Words label="If they were leading Sanchari" text={r.leaderIdea} /> : null}
          {r.nextPlace ? <Words label="Where next" text={r.nextPlace} /> : null}
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-ridge pt-4">
        {r.whatsapp ? (
          <a
            href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-mist underline-offset-4 hover:text-signal hover:underline"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp {formatWhatsApp(r.whatsapp)}
          </a>
        ) : (
          <span />
        )}
        <div className="w-full sm:w-auto">
          <ResponseActions
            responseId={r.id}
            featured={r.featured}
            hidden={r.hidden}
            featureBlockedBecause={featureBlockedBecause}
          />
        </div>
      </footer>
    </article>
  );
}

function Answer({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 border-b border-ridge/60 py-1", wide && "flex-col gap-1 sm:col-span-2")}>
      <dt className="text-lichen">{label}</dt>
      <dd className={cn("text-mist", !wide && "text-right")}>{value}</dd>
    </div>
  );
}

function Words({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-lichen">{label}</p>
      <p className="mt-1 whitespace-pre-line leading-relaxed text-mist">{text}</p>
    </div>
  );
}
