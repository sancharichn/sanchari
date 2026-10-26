import Link from "next/link";
import { PhotoStrip } from "@/components/gallery/photo-strip";
import { FromTheGroup } from "@/components/site/from-the-group";
import { Hero } from "@/components/site/hero";
import { HomeQuestions } from "@/components/site/home-questions";
import { HowToJoin } from "@/components/site/how-to-join";
import { HowWeTravel } from "@/components/site/how-we-travel";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { PersonalTrail } from "@/components/site/personal-trail";
import { UpcomingTripCarousel } from "@/components/trips/upcoming-trip-carousel";
import { getGallery, getLatestPhotos } from "@/lib/drive";
import { getFeaturedReviews, getRecentFeedback, getUpcomingTrips, reviewToCard } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUserSafe();
  const [upcoming, reviews, notes, photos, albums, preferences] = await Promise.all([
    getUpcomingTrips(6),
    getFeaturedReviews(3),
    getRecentFeedback(3, 4),
    getLatestPhotos(5),
    getGallery(),
    user ? prisma.user.findUnique({ where: { id: user.id }, select: { preferredTripKinds: true, travelPace: true, homeArea: true, personalizationUpdatedAt: true } }) : null,
  ]);
  // Picked quotes from trip feedback first, topped up with well-rated notes.
  const feedback = [...reviews.map((r) => reviewToCard(r)), ...notes].slice(0, 3);
  const preferredKinds = preferences?.preferredTripKinds ?? [];
  const personalisedUpcoming = preferredKinds.length ? [...upcoming].sort((a, b) => Number(preferredKinds.includes(b.kind)) - Number(preferredKinds.includes(a.kind)) || a.startDate.getTime() - b.startDate.getTime()) : upcoming;
  const recommendation = personalisedUpcoming.find((trip) => preferredKinds.includes(trip.kind)) ?? personalisedUpcoming[0] ?? null;
  const heroPhotos = [recommendation?.cover, ...photos].filter((photo, index, all) => photo && all.findIndex((candidate) => candidate?.id === photo.id) === index).slice(0, 4);
  const heroMessages = ["Travel with nature.", "Journeys are better together.", "Find your next trail beyond the city.", "Leave every place better than we found it."];
  const heroSlides = heroPhotos.map((photo, index) => ({ id: photo!.id, src: photo!.src[1600], srcSet: `${photo!.src[960]} 960w, ${photo!.src[1600]} 1600w`, alt: photo!.alt, headline: heroMessages[index % heroMessages.length] }));

  return (
    <main id="main" className="home-page">
      <Hero next={upcoming[0] ?? null} signedIn={Boolean(user)} memberName={user?.name} slides={heroSlides} tripsCount={upcoming.length} photoCount={albums.reduce((total, album) => total + album.images.length, 0)} />

      {user && preferences ? <PersonalTrail name={user.name} preferences={preferences} recommendation={recommendation} /> : null}

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
            trips={personalisedUpcoming}
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

      <PhotoStrip photos={photos} stories={albums.filter(album => album.id !== "latest" && album.images.length > 0).map(album => ({ name: album.name, image: album.images[0] }))} />

      {user ? <section className="container mt-24" aria-labelledby="shop-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-signal">Sanchari goods</p><h2 id="shop-heading" className="mt-2 text-3xl font-bold">Small things for the trail</h2><p className="mt-2 text-sm text-lichen">Key chains, car stickers, caps, seed pens and fridge magnets. Pickup only.</p></div><Link href="/shop" className="text-sm font-semibold text-signal underline">Browse the pickup shop</Link></div></section> : null}

      <FromTheGroup items={feedback} />

      <HomeQuestions />

      <InstagramStrip />
    </main>
  );
}
