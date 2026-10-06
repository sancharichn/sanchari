"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mobile-glass-screen container flex min-h-[60dvh] flex-col justify-center py-24">
      <h1 className="stretch-semiwide text-3xl font-bold">This page didn&apos;t load</h1>
      <p className="measure mt-4 text-lichen">
        Something went wrong while fetching it. Try again in a moment. If it keeps happening, write to
        sanchari.chn@gmail.com.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
