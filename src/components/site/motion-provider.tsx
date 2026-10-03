"use client";

import { MotionConfig } from "framer-motion";

/** Framer Motion follows the visitor's reduced-motion setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
