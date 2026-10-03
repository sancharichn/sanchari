"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { callbackUrl });
      }}
    >
      <GoogleMark />
      {pending ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.98h5.29c-.23 1.5-1.79 4.4-5.29 4.4-3.18 0-5.78-2.64-5.78-5.9s2.6-5.9 5.78-5.9c1.81 0 3.03.77 3.72 1.44l2.54-2.45C16.8 4.17 14.73 3.2 12.18 3.2 7.03 3.2 2.86 7.37 2.86 12.58s4.17 9.38 9.32 9.38c5.38 0 8.95-3.78 8.95-9.11 0-.61-.07-1.08-.16-1.55z"
      />
    </svg>
  );
}
