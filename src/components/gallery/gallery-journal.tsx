"use client";
/* eslint-disable @next/next/no-img-element -- signed, responsive images are served by the private gallery proxy */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, Images, MapPinned, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { GalleryAlbum, GalleryImage } from "@/lib/drive";
import { cn } from "@/lib/utils";

type Moment = { label: string; images: GalleryImage[] };
const EMPTY_IMAGES: GalleryImage[] = [];

// The group owns the folder structure; these are visual sequences, not AI claims
// about what appears in a photograph. Organisers can organise albums in Drive.
function moments(images: GalleryImage[]): Moment[] {
  const labels = ["First light", "On the way", "Around camp", "The view", "Small moments"];
  const buckets = Array.from({ length: Math.min(5, Math.max(1, Math.ceil(images.length / 4))) }, (_, index) => ({ label: labels[index], images: [] as GalleryImage[] }));
  images.forEach((image, index) => buckets[index % buckets.length].images.push(image));
  return buckets.filter((bucket) => bucket.images.length > 0);
}

/** A photo-led trip journal: album selection, a lead scene and cinematic viewing. */
export function GalleryJournal({ albums }: { albums: GalleryAlbum[] }) {
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? "");
  const [index, setIndex] = useState<number | null>(null);
  const album = albums.find((item) => item.id === albumId) ?? albums[0];
  const images = album?.images ?? EMPTY_IMAGES;
  const current = index === null ? null : images[index];
  const groups = useMemo(() => moments(images), [images]);
  const step = useCallback((by: 1 | -1) => setIndex((item) => item === null || images.length === 0 ? item : (item + by + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (index === null) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, step]);

  if (!album || images.length === 0) return null;
  const lead = images[0];

  return <>
    <div className="gallery-album-nav" role="tablist" aria-label="Trip albums">
      {albums.map((item) => <button key={item.id} role="tab" type="button" aria-selected={albumId === item.id} onClick={() => { setAlbumId(item.id); setIndex(null); }} className={cn("gallery-album-chip", albumId === item.id && "gallery-album-chip-active")}>
        {item.name}<span>{item.images.length}</span>
      </button>)}
    </div>

    <section className="gallery-lead mt-7" aria-label={`${album.name} trip journal`}>
      <button type="button" onClick={() => setIndex(0)} className="group relative block min-h-[31rem] w-full overflow-hidden rounded-[1.4rem] border border-white/15 bg-basalt text-left sm:min-h-[35rem]">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed, resized gallery source */}
        <img src={lead.src[1600]} alt={lead.alt} className="gallery-lead-image absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,12,.9),rgba(4,10,12,.3)_56%,rgba(4,10,12,.1)),linear-gradient(0deg,rgba(4,10,12,.75),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-signal"><MapPinned className="size-4" /> Trip journal</p><h2 className="stretch-semiwide mt-4 max-w-xl text-4xl font-bold text-mist sm:text-6xl">{album.name}</h2><p className="mt-4 max-w-md text-sm leading-6 text-mist/80">{images.length} moments from the group&apos;s shared trail.</p><span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-4 py-2 text-sm font-semibold text-mist backdrop-blur-md">Open the story <Expand className="size-4" /></span></div>
      </button>
      <div className="gallery-route-line" aria-hidden="true"><span /><span /><span /><span /></div>
    </section>

    <section className="mt-12" aria-labelledby="moments-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-signal">The visual trail</p><h2 id="moments-heading" className="stretch-semiwide mt-2 text-3xl font-bold">Moments from {album.name}</h2></div><p className="flex items-center gap-2 text-sm text-lichen"><Sparkles className="size-4 text-signal" /> Curated in the order the group shared them</p></div>
      <div className="mt-8 space-y-12">{groups.map((group, groupIndex) => <section key={group.label} className="gallery-moment"><div className="flex items-center gap-3"><span className="stretch-narrow text-sm text-signal">0{groupIndex + 1}</span><h3 className="text-lg font-bold">{group.label}</h3><span className="h-px flex-1 bg-ridge" /></div><ul className="gallery-masonry mt-4">{group.images.map((image) => { const position = images.findIndex((item) => item.id === image.id); return <li key={image.id}><button type="button" onClick={() => setIndex(position)} className="gallery-frame group" aria-label={`Open ${image.alt}`}><span className="gallery-photo-number">{String(position + 1).padStart(2, "0")}</span>{/* eslint-disable-next-line @next/next/no-img-element -- signed, resized gallery source */}<img src={image.src[960]} srcSet={`${image.src[480]} 480w, ${image.src[960]} 960w`} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 88vw" alt={image.alt} loading="lazy" decoding="async" className="size-full object-cover" /><span className="gallery-photo-overlay"><Expand className="size-5" /></span></button></li>; })}</ul></section>)}</div>
    </section>

    <Dialog open={current !== null} onOpenChange={(open) => !open && setIndex(null)}><DialogContent className="gallery-lightbox max-w-6xl gap-0 overflow-hidden border-white/15 bg-[#071014] p-0"><DialogTitle className="sr-only">{current?.alt}</DialogTitle><DialogDescription className="sr-only">Use left and right arrow keys to move through this trip album.</DialogDescription>{current ? <><div className="relative flex min-h-[52dvh] items-center justify-center bg-black">{/* eslint-disable-next-line @next/next/no-img-element -- signed, resized gallery source */}<img key={current.id} src={current.src[1600]} alt={current.alt} className="gallery-lightbox-image max-h-[72dvh] w-full object-contain" /><button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="gallery-lightbox-arrow left-3"><ArrowLeft /></button><button type="button" onClick={() => step(1)} aria-label="Next photo" className="gallery-lightbox-arrow right-3"><ArrowRight /></button></div><div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-signal">{album.name}</p><p className="mt-1 text-sm text-lichen">Photo {(index ?? 0) + 1} of {images.length}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => step(-1)}><ArrowLeft className="size-4" /> Previous</Button><Button size="sm" variant="outline" onClick={() => step(1)}>Next <ArrowRight className="size-4" /></Button></div></div></> : null}</DialogContent></Dialog>
  </>;
}
