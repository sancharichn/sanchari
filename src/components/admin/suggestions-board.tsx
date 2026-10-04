import Link from "next/link";
import type { SuggestionStatus } from "@prisma/client";
import { SuggestionControls } from "@/components/admin/suggestion-controls";
import { Badge } from "@/components/ui/badge";
import type { SuggestionItem } from "@/lib/admin-queries";
import { SUGGESTION_STATUS_LABEL, TOPICS, writerLabel } from "@/lib/feedback";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SuggestionFilter = SuggestionStatus | "ALL";
type Filter = SuggestionFilter;
export const FILTERS: Filter[] = ["NEW", "PLANNED", "DONE", "NOT_NOW", "ALL"];
const FILTER_LABEL: Record<Filter, string> = { ...SUGGESTION_STATUS_LABEL, NEW: "To look at", ALL: "All" };

/** "  yercaud " and "Yercaud" are the same place. */
const placeKey = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

/** The suggestions board, given the suggestions and the chosen status filter. */
export function SuggestionsBoard({ suggestions: all, filter }: { suggestions: SuggestionItem[]; filter: Filter }) {
  const shown = filter === "ALL" ? all : all.filter((s) => s.status === filter);
  const count = (f: Filter) => (f === "ALL" ? all.length : all.filter((s) => s.status === f).length);

  // Places people asked for, most-asked first (ones marked "Not now" left out).
  const places = new Map<string, { label: string; count: number }>();
  for (const s of all) {
    if (s.kind !== "PLACE" || s.status === "NOT_NOW") continue;
    const key = placeKey(s.text);
    const entry = places.get(key);
    if (entry) entry.count += 1;
    else places.set(key, { label: s.text.trim(), count: 1 });
  }
  const topPlaces = [...places.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 24);

  const groups = TOPICS.map((topic) => ({ topic, items: shown.filter((s) => s.topic === topic) })).filter((g) => g.items.length > 0);

  return (
    <main id="main" className="container py-10 md:py-14">
      <h1 className="stretch-semiwide text-3xl font-bold">Suggestions</h1>
      <p className="measure mt-3 text-lichen">
        Ideas from &ldquo;if you were leading Sanchari&rdquo; and places from &ldquo;where should we go next&rdquo;, from
        every trip&apos;s feedback, sorted into topics. Mark each one as you decide, and change the topic if it landed in
        the wrong place.
      </p>

      {topPlaces.length > 0 ? (
        <section aria-labelledby="places-heading" className="mt-10">
          <h2 id="places-heading" className="text-lg font-bold">
            Places people want to go
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topPlaces.map((place) => (
              <li key={place.label} className="inline-flex items-center gap-2 rounded-full border border-ridge px-3 py-1.5 text-sm text-mist">
                {place.label}
                {place.count > 1 ? (
                  <span className="stretch-narrow tabular-nums text-lichen">
                    ×{place.count}
                    <span className="sr-only"> requests</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Filter by status" className="mt-10 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "NEW" ? "/admin/suggestions" : `/admin/suggestions?status=${f}`}
            aria-current={filter === f ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              filter === f ? "border-signal bg-signal text-night" : "border-ridge text-mist hover:border-mist/40",
            )}
          >
            {FILTER_LABEL[f]}
            <span className={cn("stretch-narrow tabular-nums", filter === f ? "text-night/70" : "text-lichen")}>{count(f)}</span>
          </Link>
        ))}
      </nav>

      {all.length === 0 ? (
        <p className="mt-8 text-mist">
          No suggestions yet. They arrive with trip feedback: open a trip&apos;s form from its Feedback tab.
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-mist">Nothing here right now.</p>
      ) : (
        <div className="mt-10 grid gap-12">
          {groups.map((group) => (
            <section key={group.topic} aria-labelledby={`topic-${group.topic}`}>
              <h2 id={`topic-${group.topic}`} className="stretch-semiwide text-xl font-bold">
                {group.topic} <span className="stretch-narrow tabular-nums text-lichen">{group.items.length}</span>
              </h2>
              <ul className="mt-5 grid gap-4 lg:grid-cols-2">
                {group.items.map((s) => (
                  <li key={s.id}>
                    <SuggestionCard suggestion={s} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function SuggestionCard({ suggestion: s }: { suggestion: SuggestionItem }) {
  return (
    <article className="grid h-full gap-4 rounded-panel border border-ridge bg-basalt p-5">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">{s.kind === "PLACE" ? "Place" : "Idea"}</Badge>
          {s.response?.verified ? <Badge variant="signal">Verified traveller</Badge> : null}
        </div>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-mist">{s.text}</p>
        <p className="mt-2 text-xs text-lichen">
          {s.response ? writerLabel(s.response) : "Someone"}, {formatDate(s.createdAt)}
          {s.trip ? (
            <>
              , after{" "}
              <Link href={`/admin/trips/${s.trip.id}?tab=feedback`} className="underline underline-offset-4 hover:text-signal">
                {s.trip.title}
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <SuggestionControls id={s.id} status={s.status} topic={s.topic} note={s.note} />
    </article>
  );
}
