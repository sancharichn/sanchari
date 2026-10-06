import type { Metadata } from "next";
import Link from "next/link";
import { DepartureBoard } from "@/components/trips/departure-board";
import { TripCards } from "@/components/trips/trip-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { getPublicTripGroups } from "@/lib/queries";
import { KIND_PLURAL, parseKind, TRIP_KINDS } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trips" };

const VIEWS = ["upcoming", "ongoing", "past"] as const;
type View = (typeof VIEWS)[number];

export default async function TripsPage({ searchParams }: { searchParams: { view?: string; type?: string } }) {
  const kind = parseKind(searchParams.type);
  const all = await getPublicTripGroups();
  const only = <T extends { kind: string }>(list: T[]) => (kind ? list.filter((t) => t.kind === kind) : list);
  const groups = { upcoming: only(all.upcoming), ongoing: only(all.ongoing), past: only(all.past) };
  const requested = searchParams.view as View | undefined;
  const initial: View =
    requested && VIEWS.includes(requested) ? requested : groups.upcoming.length || !groups.ongoing.length ? "upcoming" : "ongoing";

  return (
    <main id="main" className="mobile-glass-screen container py-14 md:py-20">
      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Trips</h1>
      <p className="measure mt-5 text-lg text-lichen">
        Meetups and trips on the calendar, and everywhere the group has been. New to Sanchari? Everyone starts with a
        meetup:{" "}
        <Link href="/faq#joining" className="text-mist underline underline-offset-4 hover:text-signal">
          see how joining works
        </Link>
        . Registering needs a free sign-in with Google.
      </p>

      <nav aria-label="Filter by type" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {[null, ...TRIP_KINDS].map((k) => {
            const active = k === kind;
            return (
              <li key={k ?? "all"}>
                <Link
                  href={k ? `/trips?type=${k.toLowerCase()}` : "/trips"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                    active ? "border-signal bg-signal text-night" : "border-ridge text-mist hover:border-mist/40",
                  )}
                >
                  {k ? KIND_PLURAL[k] : "Everything"}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Tabs key={kind ?? "all"} defaultValue={initial} className="mt-8">
        <TabsList aria-label="Trips by status">
          <TabsTrigger value="upcoming">
            Upcoming <Count n={groups.upcoming.length} />
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            On the trail <Count n={groups.ongoing.length} />
          </TabsTrigger>
          <TabsTrigger value="past">
            Past trips <Count n={groups.past.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <TripCards
            trips={groups.upcoming}
            emptyText={
              <>
                No trips are open right now. New trips are announced on{" "}
                <a className="text-mist underline underline-offset-4" href={INSTAGRAM_URL}>
                  Instagram @{INSTAGRAM_HANDLE}
                </a>{" "}
                first.
              </>
            }
          />
        </TabsContent>
        <TabsContent value="ongoing">
          <TripCards trips={groups.ongoing} emptyText="Nobody is out on a trip right now." />
        </TabsContent>
        <TabsContent value="past">
          <DepartureBoard trips={groups.past} emptyText="Completed trips will be listed here." />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Count({ n }: { n: number }) {
  return <span className="stretch-narrow tabular-nums opacity-70">{n}</span>;
}
