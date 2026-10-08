import type { Metadata } from "next";
import { GalleryJournal } from "@/components/gallery/gallery-journal";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { getGallery } from "@/lib/drive";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const albums = await getGallery();

  return (
    <main id="main" className="mobile-glass-screen">
      <div className="container py-14 md:py-20">
        <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Gallery</h1>
        <p className="measure mt-5 text-lg text-lichen">
          Photos from our trips, straight from the group&apos;s shared folder. Each album is one trip.
        </p>

        <div className="mt-10">
          {albums.length === 0 ? (
            <div className="rounded-panel border border-ridge bg-basalt p-6">
              <p className="text-mist">Photos from our trips will appear here.</p>
              <p className="mt-1 text-sm text-lichen">
                Until then, the latest ones are on{" "}
                <a href={INSTAGRAM_URL} className="text-mist underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                  Instagram @{INSTAGRAM_HANDLE}
                </a>
                .
              </p>
            </div>
          ) : (
            <GalleryJournal albums={albums} />
          )}
        </div>
      </div>

      <InstagramStrip />
    </main>
  );
}
