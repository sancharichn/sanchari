import { notFound } from "next/navigation";
import { Hero } from "@/components/site/hero";

export default function HomePreview() { if (process.env.NODE_ENV === "production") notFound(); return <main className="home-page"><Hero next={null} signedIn={false} photo={null} tripsCount={4} photoCount={86} /><section className="container"><h2 className="text-3xl font-bold">Upcoming trips</h2><p className="mt-3 text-lichen">Local visual preview of the upgraded homepage hero.</p></section></main>; }
