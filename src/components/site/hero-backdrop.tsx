"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

export type HeroSlide = { id: string; src: string; srcSet?: string; alt: string; headline: string; branded?: boolean };

export function HeroBackdrop({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const step = (amount: number) => { setIndex((current) => (current + amount + slides.length) % slides.length); setPaused(true); };
  const active = slides[index] ?? { id: "empty", headline: "Travel with nature." };
  return <><div className="hero-backdrop absolute inset-0 -z-20" aria-live="off">{slides.map((slide, slideIndex) => <img key={slide.id} src={slide.src} srcSet={slide.srcSet} sizes="100vw" alt={slide.alt} fetchPriority={slideIndex === 0 ? "high" : "auto"} className={`hero-landscape absolute inset-0 size-full object-cover ${index === slideIndex ? "hero-landscape-active" : ""}`} />)}</div><div className={`hero-slide-copy ${active.branded ? "hero-slide-copy-branded" : ""}`} aria-live="off">{active.branded ? <img src="/brand/sanchari-logo.svg" alt="Sanchari Chennai" className="hero-opening-logo" /> : <p className="hero-slide-kicker">Sanchari Chennai</p>}<h1 key={active.id}>{active.headline}</h1></div>{slides.length > 1 ? <div className="hero-story-controls" aria-label="Hero images"><button type="button" onClick={() => step(-1)} aria-label="Previous landscape"><ChevronLeft className="size-5" /></button><div className="hero-story-dots">{slides.map((slide, slideIndex) => <button key={slide.id} type="button" onClick={() => { setIndex(slideIndex); setPaused(true); }} aria-label={`Show landscape ${slideIndex + 1}: ${slide.headline}`} aria-pressed={index === slideIndex} className={index === slideIndex ? "active" : ""} />)}</div><button type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Resume landscape slideshow" : "Pause landscape slideshow"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button><button type="button" onClick={() => step(1)} aria-label="Next landscape"><ChevronRight className="size-5" /></button></div> : null}</>;
}
