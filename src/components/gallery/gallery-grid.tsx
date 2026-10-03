"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { GalleryImage } from "@/lib/drive";

/** Photos in columns; any one opens large, with previous/next and arrow keys. */
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const count = images.length;

  const step = useCallback(
    (by: 1 | -1) => setIndex((i) => (i === null ? i : (i + by + count) % count)),
    [count],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : images[index];

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {images.map((image, i) => (
          <li key={image.id} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full overflow-hidden rounded-[12px] border border-ridge bg-basalt"
              aria-label={`Open ${image.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- already resized and cached by our own proxy */}
              <img
                src={image.src[480]}
                srcSet={`${image.src[480]} 480w, ${image.src[960]} 960w`}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                alt={image.alt}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-opacity group-hover:opacity-85"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="max-w-5xl gap-4 bg-night p-3 sm:p-4">
          {current ? (
            <>
              <DialogTitle className="sr-only">{current.alt}</DialogTitle>
              <DialogDescription className="sr-only">Use the left and right arrow keys to move between photos.</DialogDescription>
              {/* eslint-disable-next-line @next/next/no-img-element -- already resized and cached by our own proxy */}
              <img
                key={current.id}
                src={current.src[1600]}
                alt={current.alt}
                className="max-h-[76dvh] w-full rounded-[10px] object-contain"
              />
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => step(-1)} disabled={count < 2}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <p className="stretch-narrow text-sm tabular-nums text-lichen" aria-live="polite">
                  {(index ?? 0) + 1} of {count}
                </p>
                <Button variant="outline" size="sm" onClick={() => step(1)} disabled={count < 2}>
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
