import type { ZodError } from "zod";

/** What every server action returns, so forms can show one clear message. */
export type ActionResult =
  | { ok: true; message: string; data?: Record<string, unknown> }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function invalid(error: ZodError, message = "Check the highlighted fields."): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message, fieldErrors };
}

export function fail(message: string): ActionResult {
  return { ok: false, message };
}

export function done(message: string, data?: Record<string, unknown>): ActionResult {
  return { ok: true, message, data };
}
