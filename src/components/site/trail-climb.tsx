"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { INTRO_DONE_EVENT } from "@/lib/intro";

/**
 * The page's one orchestrated moment: a trail climbs to the summit card and
 * a marker drops at the top. It waits for the launch intro to finish, so it
 * plays as the page is revealed. Shown complete, without motion, when the
 * visitor prefers reduced motion.
 */

// Trail paths end at x = 75% of the box, y = 0 — where the summit marker sits.
const TRAIL_TALL = "M14 500 C70 470 30 410 96 380 S214 392 226 318 S150 226 214 182 S320 150 292 86 S290 26 300 0";
const TRAIL_SHORT = "M14 200 C80 196 60 150 130 146 S240 156 236 112 S190 66 250 52 S306 26 300 0";

function useIntroFinished() {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (document.documentElement.getAttribute("data-intro") !== "on") {
      setFinished(true);
      return;
    }
    const done = () => setFinished(true);
    window.addEventListener(INTRO_DONE_EVENT, done);
    return () => window.removeEventListener(INTRO_DONE_EVENT, done);
  }, []);
  return finished;
}

function Trail({ d, viewBox, className, go }: { d: string; viewBox: string; className: string; go: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      <svg aria-hidden="true" focusable="false" viewBox={viewBox} className="absolute inset-0 h-full w-full overflow-visible">
        <path d={d} fill="none" stroke="#E6D65C" strokeOpacity={0.14} strokeWidth={10} strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke="#E6D65C"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 230, 0, 0.45))" }}
          initial={reduce ? false : { pathLength: 0 }}
          animate={go || reduce ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.9, ease: [0.65, 0, 0.35, 1], delay: 0.25 }}
        />
      </svg>
      <motion.span
        aria-hidden="true"
        className="absolute left-3/4 top-0 block size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-signal bg-night shadow-[0_0_0_6px_rgba(255,230,0,0.12)]"
        initial={reduce ? false : { scale: 0 }}
        animate={go || reduce ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 2.05, type: "spring", stiffness: 420, damping: 18 }}
      />
    </div>
  );
}

export function TrailClimb() {
  const go = useIntroFinished();
  return (
    <>
      <Trail go={go} d={TRAIL_SHORT} viewBox="0 0 400 200" className="relative aspect-[2/1] w-full md:hidden" />
      <Trail go={go} d={TRAIL_TALL} viewBox="0 0 400 500" className="relative hidden aspect-[4/5] w-full md:block" />
    </>
  );
}
