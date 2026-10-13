"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/drive";

export function PhotoStrip({ photos, stories = [] }: { photos: GalleryImage[]; stories?: { name: string; image: GalleryImage }[] }) {
  const items = stories.length ? stories : photos.map(image => ({ name: image.alt, image }));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { if (paused || interacting || reduced || items.length < 2) return; const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), 3000); return () => window.clearInterval(timer); }, [paused, interacting, reduced, items.length]);
  if (!items.length) return null;
  const current = items[index % items.length];
  return <section aria-labelledby="photos-heading" className="container mt-24 md:mt-32" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocus={() => setInteracting(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}>
    <div className="flex flex-wrap items-end justify-between gap-4"><h2 id="photos-heading" className="stretch-semiwide text-3xl font-bold">From the trail</h2><Link href="/gallery" className="text-sm font-semibold text-signal hover:underline">Open the gallery</Link></div>
    <Link href="/gallery" className="trail-story mt-8 relative block overflow-hidden rounded-panel border border-ridge bg-basalt">
      <img key={current.image.id} src={current.image.src[960]} srcSet={`${current.image.src[480]} 480w, ${current.image.src[960]} 960w, ${current.image.src[1600]} 1600w`} sizes="(min-width: 1200px) 1200px, 100vw" alt={current.image.alt} loading="lazy" className="gallery-auto-image absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" /><div className="absolute bottom-0 p-6 md:p-9"><p className="text-xs uppercase tracking-widest text-signal">From the trail</p><h3 className="mt-2 text-2xl font-bold text-mist">{current.name}</h3><p className="mt-2 text-sm text-mist/80">{index % items.length + 1} / {items.length}</p></div>
    </Link>
    {items.length > 1 && <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="Trip photo stories">{items.map((item, i) => <button key={item.image.id} type="button" aria-label={`Show ${item.name}`} aria-pressed={index === i} onClick={() => { setIndex(i); setPaused(true); }} className={`story-control rounded-full border px-3 text-sm ${index === i ? "border-signal text-signal" : "border-ridge text-lichen"}`}>{i + 1}</button>)}</div><button type="button" className="story-control rounded-full border border-ridge px-4 text-sm text-mist" aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? "Resume photos" : "Pause photos"}</button></div>}
  </section>;
}
