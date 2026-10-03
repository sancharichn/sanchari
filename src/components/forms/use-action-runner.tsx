"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";

const NETWORK_ERROR: ActionResult = {
  ok: false,
  message: "That didn't go through. Check your connection and try again.",
};

/** Runs a server action, tracks pending state and refreshes the page's data on success. */
export function useActionRunner() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = useCallback(
    async (action: () => Promise<ActionResult>, onSuccess?: (result: ActionResult) => void) => {
      setPending(true);
      try {
        const next = await action();
        setResult(next);
        if (next.ok) {
          startTransition(() => router.refresh());
          onSuccess?.(next);
        }
        return next;
      } catch {
        setResult(NETWORK_ERROR);
        return NETWORK_ERROR;
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  return { pending, result, setResult, run, fieldErrors };
}

export function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="text-sm text-mist">
      {result.message}
    </p>
  ) : (
    <p role="alert" className="text-sm text-ember">
      {result.message}
    </p>
  );
}
