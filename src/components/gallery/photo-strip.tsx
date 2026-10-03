import Link from "next/link";
import type { GalleryImage } from "@/lib/drive";
import { cn } from "@/lib/utils";

/** The newest trip photos, the first one larger. Hidden until there are photos. */
export function PhotoStrip({ photos }: { photos: GalleryImage[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="photos-heading" className="container mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="photos-heading" className="stretch-semiwide text-3xl font-bold">
          From the trail
        </h2>
        <Link href="/gallery" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
          Open the gallery
        </Link>
      </div>
      <ul className="mt-8 grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-4">
        {photos.slice(0, 5).map((photo, i) => (
          <li key={photo.id} className={cn(i === 0 && "col-span-2 row-span-2")}>
            <Link href="/gallery" className="group block size-full overflow-hidden rounded-[12px] border border-ridge bg-basalt">
              {/* eslint-disable-next-line @next/next/no-img-element -- already resized and cached by our own proxy */}
              <img
                src={i === 0 ? photo.src[960] : photo.src[480]}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-opacity group-hover:opacity-85"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
