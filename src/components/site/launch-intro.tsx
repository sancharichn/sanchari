"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_DONE_EVENT, INTRO_SEEN_KEY } from "@/lib/intro";

type Phase = "idle" | "playing" | "leaving" | "gone";

/**
 * The animated Sanchari logo, played once as the site opens. Muted (browsers
 * only autoplay silent video), skippable with the button or Escape, and it
 * gets out of the way on its own if the video can't start quickly.
 */
export function LaunchIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const finish = useCallback(() => {
    setPhase((current) => (current === "leaving" || current === "gone" ? current : "leaving"));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "on") {
      setPhase("gone");
      return;
    }

    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Private mode or blocked storage: the intro may play again next visit, which is fine.
    }

    root.style.overflow = "hidden";
    const video = videoRef.current;
    let started = false;

    // If the video hasn't started within 1.75s (slow connection), skip it.
    const slowStart = window.setTimeout(() => {
      if (!started) finish();
    }, 1750);
    // Never hold the page longer than this, whatever happens.
    const ceiling = window.setTimeout(finish, 7000);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    if (video) {
      video.playbackRate = 2;
      video.play().then(
        () => {
          started = true;
          setPhase("playing");
        },
        () => finish(),
      );
    } else {
      finish();
    }

    return () => {
      window.clearTimeout(slowStart);
      window.clearTimeout(ceiling);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish]);

  // Fade out, then hand the page back.
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => {
      const root = document.documentElement;
      root.style.overflow = "";
      root.setAttribute("data-intro", "done");
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      setPhase("gone");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className="launch-intro fixed inset-0 z-[100] items-center justify-center bg-black transition-opacity duration-300 ease-out data-[phase=leaving]:pointer-events-none data-[phase=leaving]:opacity-0"
      data-phase={phase}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src="/media/sanchari-intro.mp4"
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onEnded={finish}
        onError={finish}
      />
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-6 rounded-full border border-white/30 bg-black/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal md:bottom-10 md:right-10"
      >
        Skip intro
      </button>
      <p className="sr-only" role="status">
        Playing the Sanchari logo animation. Press Escape or use Skip intro to go straight to the site.
      </p>
    </div>
  );
}
