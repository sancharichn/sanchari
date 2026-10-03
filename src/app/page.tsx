import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { HowATripWorks } from "@/components/site/how-a-trip-works";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/components/site/site-footer";
import { DepartureBoard } from "@/components/trips/departure-board";
import { getUpcomingTrips } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, upcoming] = await Promise.all([getCurrentUserSafe(), getUpcomingTrips(6)]);

  return (
    <main id="main">
      <Hero next={upcoming[0] ?? null} signedIn={Boolean(user)} />

      <section aria-labelledby="upcoming-heading" className="container mt-20 md:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="upcoming-heading" className="stretch-semiwide text-3xl font-bold">
            Upcoming trips
          </h2>
          <Link href="/trips" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
            All trips, including past ones
          </Link>
        </div>
        <div className="mt-8">
          <DepartureBoard
            trips={upcoming}
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
        </div>
      </section>

      <HowATripWorks />
    </main>
  );
}
