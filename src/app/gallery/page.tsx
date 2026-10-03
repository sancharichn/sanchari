import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { InstagramStrip } from "@/components/site/instagram-strip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGallery } from "@/lib/drive";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const albums = await getGallery();

  return (
    <main id="main">
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
          ) : albums.length === 1 ? (
            <GalleryGrid images={albums[0].images} />
          ) : (
            <Tabs defaultValue={albums[0].id}>
              <TabsList aria-label="Albums">
                {albums.map((album) => (
                  <TabsTrigger key={album.id} value={album.id}>
                    {album.name}
                    <span className="stretch-narrow tabular-nums opacity-70">{album.images.length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {albums.map((album) => (
                <TabsContent key={album.id} value={album.id}>
                  <GalleryGrid images={album.images} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>

      <InstagramStrip />
    </main>
  );
}
