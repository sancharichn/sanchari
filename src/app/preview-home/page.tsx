import { notFound } from "next/navigation";
import { Hero } from "@/components/site/hero";
import { PhotoStrip } from "@/components/gallery/photo-strip";
import { UpcomingTripCarousel } from "@/components/trips/upcoming-trip-carousel";
import { HowToJoin } from "@/components/site/how-to-join";
import { HowWeTravel } from "@/components/site/how-we-travel";
import type { TripListItem } from "@/lib/queries";
import { PersonalTrail } from "@/components/site/personal-trail";

export default function HomePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const photo = { id: "preview-camp", alt: "Camping beneath the stars", src: { 480: "/covers/jawadhu-hills-camp.jpg", 960: "/covers/jawadhu-hills-camp.jpg", 1600: "/covers/jawadhu-hills-camp.jpg" }, width: null, height: null };
  const trip: TripListItem = { id: "preview-trip", slug: "camping-in-the-jawadhu-hills", title: "Camping in the Jawadhu Hills", location: "Jawadhu Hills", transportMode: "VAN_BUS", startDate: new Date("2026-11-14T00:00:00+05:30"), endDate: new Date("2026-11-15T00:00:00+05:30"), status: "OPEN", kind: "STAY_BACK", cover: photo, maxCapacity: 30, budgetEst: null, adultBudgetEst: null, childBudgetEst: null, under5BudgetEst: null, registered: 12, confirmed: 12 };
  return <main id="main" className="home-page">
    <p className="container py-3 text-xs text-lichen">Local design preview · sample availability and albums</p>
    <Hero next={trip} signedIn={true} memberName="Mathew" slides={[{ id: photo.id, src: photo.src[1600], srcSet: `${photo.src[960]} 960w, ${photo.src[1600]} 1600w`, alt: photo.alt, headline: "Travel with nature.", branded: true }, { id: "sri-lanka", src: "https://images.unsplash.com/photo-1711797750174-c3750dd9d7c9?auto=format&fit=crop&w=1600&q=85", alt: "Sri Lanka mountain landscape", headline: "Journeys are better together." }]} tripsCount={2} photoCount={86} />
    <PersonalTrail name="Mathew Jose" preferences={{ preferredTripKinds: ["STAY_BACK", "TREK"], travelPace: "BALANCED", homeArea: "Velachery", personalizationUpdatedAt: new Date() }} recommendation={trip} />
    <section className="container mt-20"><h2 className="mb-8 text-3xl font-bold">Upcoming trips</h2><UpcomingTripCarousel trips={[trip, { ...trip, id: "preview-meetup", title: "Chennai community meetup", kind: "MEETUP", transportMode: "SELF", registered: 8, confirmed: 8 }]} emptyText="No upcoming trips" /></section>
    <HowToJoin /><HowWeTravel />
    <PhotoStrip photos={[photo]} stories={[{ name: "Jawadhu Hills · sample album", image: photo }, { name: "Community journeys · sample album", image: { ...photo, id: "preview-second" } }]} />
  </main>;
}
