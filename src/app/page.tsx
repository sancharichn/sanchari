import Link from "next/link";
import { PhotoStrip } from "@/components/gallery/photo-strip";
import { FromTheGroup } from "@/components/site/from-the-group";
import { Hero } from "@/components/site/hero";
import { HowToJoin } from "@/components/site/how-to-join";
import { HowWeTravel } from "@/components/site/how-we-travel";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { DepartureBoard } from "@/components/trips/departure-board";
import { getLatestPhotos } from "@/lib/drive";
import { getFeaturedReviews, getRecentFeedback, getUpcomingTrips, reviewToCard } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, upcoming, reviews, notes, photos] = await Promise.all([
    getCurrentUserSafe(),
    getUpcomingTrips(6),
    getFeaturedReviews(3),
    getRecentFeedback(3, 4),
    getLatestPhotos(5),
  ]);
  // Picked quotes from trip feedback first, topped up with well-rated notes.
  const feedback = [...reviews.map((r) => reviewToCard(r)), ...notes].slice(0, 3);

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

      <HowToJoin />
      <HowWeTravel />

      <PhotoStrip photos={photos} />

      <FromTheGroup items={feedback} />

      <InstagramStrip />
    </main>
  );
}
