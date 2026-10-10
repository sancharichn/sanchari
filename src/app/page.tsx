import Link from "next/link";
import { PhotoStrip } from "@/components/gallery/photo-strip";
import { FromTheGroup } from "@/components/site/from-the-group";
import { Hero } from "@/components/site/hero";
import { HomeQuestions } from "@/components/site/home-questions";
import { HowToJoin } from "@/components/site/how-to-join";
import { HowWeTravel } from "@/components/site/how-we-travel";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { UpcomingTripCarousel } from "@/components/trips/upcoming-trip-carousel";
import { getGallery, getLatestPhotos } from "@/lib/drive";
import { getFeaturedReviews, getRecentFeedback, getUpcomingTrips, reviewToCard } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, upcoming, reviews, notes, photos, albums] = await Promise.all([
    getCurrentUserSafe(),
    getUpcomingTrips(6),
    getFeaturedReviews(3),
    getRecentFeedback(3, 4),
    getLatestPhotos(5),
    getGallery(),
  ]);
  // Picked quotes from trip feedback first, topped up with well-rated notes.
  const feedback = [...reviews.map((r) => reviewToCard(r)), ...notes].slice(0, 3);

  return (
    <main id="main" className="home-page">
      <Hero next={upcoming[0] ?? null} signedIn={Boolean(user)} photo={upcoming[0]?.cover ?? photos[0] ?? null} tripsCount={upcoming.length} photoCount={albums.reduce((total, album) => total + album.images.length, 0)} />

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
          <UpcomingTripCarousel
            trips={upcoming}
            teaser={{
              id: "sri-lanka-2027-teaser",
              title: "International Trip to Sri Lanka 2027",
              location: "Sigiriya · Kandy · Ella · Southern coast",
              dates: "2027 · dates soon",
              href: "/trips/international-trip-to-sri-lanka-2027",
              images: [
                "https://images.unsplash.com/photo-1711797750174-c3750dd9d7c9?auto=format&fit=crop&w=1200&q=85",
                "https://images.unsplash.com/photo-1612862862126-865765df2ded?auto=format&fit=crop&w=1200&q=85",
                "https://images.unsplash.com/photo-1705365256815-d3ed208fdc9f?auto=format&fit=crop&w=1200&q=85",
              ],
            }}
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

      <section className="container mt-24" aria-labelledby="shop-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-signal">Sanchari goods</p><h2 id="shop-heading" className="mt-2 text-3xl font-bold">Small things for the trail</h2><p className="mt-2 text-sm text-lichen">Key chains, car stickers, caps, seed pens and fridge magnets. Pickup only.</p></div><Link href="/shop" className="text-sm font-semibold text-signal underline">Browse the pickup shop</Link></div></section>

      <FromTheGroup items={feedback} />

      <HomeQuestions />

      <InstagramStrip />
    </main>
  );
}
