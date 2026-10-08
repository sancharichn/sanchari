"use client";

import { useEffect, useRef, useState } from "react";

/** A quiet count-up, used only for small factual signals rather than decoration. */
export function RevealNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 700);
        setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref} className="tabular-nums">{shown}</span>;
}
