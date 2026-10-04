"use client";

import { useEffect } from "react";

/**
 * Opens the collapsed answer a link points at, like /faq#joining, and brings it into view.
 * Some browsers leave a closed <details> shut when the link targets it.
 */
export function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const details = target?.closest("details");
      if (!target || !details || details.open) return;
      details.open = true;
      target.scrollIntoView({ block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
