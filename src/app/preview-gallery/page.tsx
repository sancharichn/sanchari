import { notFound } from "next/navigation";
import { GalleryJournal } from "@/components/gallery/gallery-journal";
import type { GalleryAlbum, GalleryImage } from "@/lib/drive";

const photo = (id: string, index: number): GalleryImage => ({
  id,
  alt: `Preview photo ${index + 1}`,
  src: { 480: "/covers/jawadhu-hills-camp.jpg", 960: "/covers/jawadhu-hills-camp.jpg", 1600: "/covers/jawadhu-hills-camp.jpg" },
  width: 1600,
  height: 1067,
});
const albums: GalleryAlbum[] = [
  { id: "jawadhu", name: "Jawadhu Hills", images: Array.from({ length: 9 }, (_, index) => photo(`jawadhu-${index}`, index)) },
  { id: "weekend", name: "Weekend on the trail", images: Array.from({ length: 6 }, (_, index) => photo(`weekend-${index}`, index)) },
];

export default function PreviewGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main id="main" className="mobile-glass-screen"><div className="container py-14 md:py-20"><p className="text-sm text-signal">Local visual preview · sample imagery only</p><h1 className="stretch-wide mt-3 text-4xl font-extrabold leading-none md:text-5xl">Gallery</h1><p className="measure mt-5 text-lg text-lichen">Photos from our trips, straight from the group&apos;s shared folder. Each album is one trip.</p><div className="mt-10"><GalleryJournal albums={albums} /></div></div></main>;
}
