import type { Metadata } from "next";
import { DepartureBoard } from "@/components/trips/departure-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/components/site/site-footer";
import { getPublicTripGroups } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trips" };

const VIEWS = ["upcoming", "ongoing", "past"] as const;
type View = (typeof VIEWS)[number];

export default async function TripsPage({ searchParams }: { searchParams: { view?: string } }) {
  const groups = await getPublicTripGroups();
  const requested = searchParams.view as View | undefined;
  const initial: View =
    requested && VIEWS.includes(requested) ? requested : groups.upcoming.length || !groups.ongoing.length ? "upcoming" : "ongoing";

  return (
    <main id="main" className="container py-14 md:py-20">
      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Trips</h1>
      <p className="measure mt-5 text-lg text-lichen">
        Everything the group has on the calendar, and everywhere it has been. Registering needs a free sign-in with
        Google.
      </p>

      <Tabs defaultValue={initial} className="mt-10">
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
          <DepartureBoard
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
          <DepartureBoard trips={groups.ongoing} emptyText="Nobody is out on a trip right now." />
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
