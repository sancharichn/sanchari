"use server";
import { withAudit } from "@/lib/action-audit";

import { revalidatePath } from "next/cache";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import type { SuggestionStatus } from "@prisma/client";
import { formSettingsSchema, TOPICS } from "@/lib/feedback";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { isPublicStatus } from "@/lib/trips";

/*
 * Organiser actions for trip feedback. Like every organiser action, each one
 * re-checks the ADMIN role before touching anything.
 */

const NO_ACCESS = "You don't have access to that.";

function revalidateFeedback(tripId: string) {
  revalidatePath("/staff");
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/feedback`);
}

/** Saves the welcome note and the trip's extra questions. */
export async function saveFeedbackForm(tripId: string, input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const parsed = formSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } });
  if (!trip) return fail("That trip no longer exists.");

  await prisma.feedbackForm.upsert({
    where: { tripId },
    create: { tripId, intro: parsed.data.intro, questions: parsed.data.questions },
    update: { intro: parsed.data.intro, questions: parsed.data.questions },
  });
  revalidateFeedback(tripId);
  return done("Form saved.", { intro: parsed.data.intro, questions: parsed.data.questions });

  });
}

/** Opens or closes the form. Only trips visible on the site can take answers. */
export async function setFeedbackOpen(tripId: string, open: boolean): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, status: true } });
  if (!trip) return fail("That trip no longer exists.");
  if (open && !isPublicStatus(trip.status)) {
    return fail("Only trips visible on the site can take feedback. Change the trip's status first (Completed, after the trip).");
  }

  await prisma.feedbackForm.upsert({
    where: { tripId },
    create: { tripId, isOpen: Boolean(open) },
    update: { isOpen: Boolean(open) },
  });
  revalidateFeedback(tripId);
  return done(open ? "Feedback is open. Share the link with the group." : "Feedback is closed.");

  });
}

/** Picks (or un-picks) a response's "what I loved" for the website. Only with the writer's permission. */
export async function setResponseFeatured(responseId: string, featured: boolean): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const response = await prisma.feedbackResponse.findUnique({
    where: { id: responseId },
    select: { tripId: true, shareOk: true, loved: true, hidden: true },
  });
  if (!response) return fail("That response no longer exists.");
  if (featured && (!response.shareOk || !response.loved)) {
    return fail("Only answers whose writers allowed quoting, and that say what they loved, can go on the website.");
  }
  if (featured && response.hidden) return fail("Unhide this response before showing it on the website.");

  await prisma.feedbackResponse.update({ where: { id: responseId }, data: { featured: Boolean(featured) } });
  revalidateFeedback(response.tripId);
  revalidatePath("/");
  revalidatePath("/feedback");
  return done(featured ? "Shown on the website." : "Taken off the website.");

  });
}

/** Hides a response (spam, a joke, a duplicate) from the scores and the website without deleting it. */
export async function setResponseHidden(responseId: string, hidden: boolean): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const response = await prisma.feedbackResponse.findUnique({ where: { id: responseId }, select: { tripId: true } });
  if (!response) return fail("That response no longer exists.");

  await prisma.feedbackResponse.update({
    where: { id: responseId },
    data: hidden ? { hidden: true, featured: false } : { hidden: false },
  });
  revalidateFeedback(response.tripId);
  revalidatePath("/");
  revalidatePath("/feedback");
  return done(hidden ? "Hidden. It no longer counts in the scores." : "Back in the scores.");

  });
}

/** Deletes a response and the suggestions that came from it. */
export async function deleteResponse(responseId: string): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const response = await prisma.feedbackResponse
    .delete({ where: { id: responseId }, select: { tripId: true } })
    .catch(() => null);
  if (!response) return fail("That response no longer exists.");
  revalidateFeedback(response.tripId);
  revalidatePath("/");
  revalidatePath("/feedback");
  return done("Response deleted.");

  });
}

const SUGGESTION_STATUSES: SuggestionStatus[] = ["NEW", "PLANNED", "DONE", "NOT_NOW"];

/** Moves an idea along the board (status), files it under another topic, or adds the organisers' note. */
export async function updateSuggestion(
  suggestionId: string,
  change: { status?: string; topic?: string; note?: string },
): Promise<ActionResult> {
  return withAudit(async () => {
  if (!(await getAdmin("moderate"))) return fail(NO_ACCESS);

  const data: { status?: SuggestionStatus; topic?: string; note?: string | null } = {};
  if (change.status !== undefined) {
    if (!SUGGESTION_STATUSES.includes(change.status as SuggestionStatus)) return fail("Pick a status from the list.");
    data.status = change.status as SuggestionStatus;
  }
  if (change.topic !== undefined) {
    if (!(TOPICS as readonly string[]).includes(change.topic)) return fail("Pick a topic from the list.");
    data.topic = change.topic;
  }
  if (change.note !== undefined) {
    const note = String(change.note).trim();
    if (note.length > 300) return fail("Keep the note under 300 characters.");
    data.note = note || null;
  }
  if (Object.keys(data).length === 0) return fail("Nothing to change.");

  const updated = await prisma.suggestion.updateMany({ where: { id: suggestionId }, data });
  if (updated.count === 0) return fail("That suggestion no longer exists.");
  revalidatePath("/admin/suggestions");
  return done(data.note !== undefined ? "Note saved." : "Saved.");

  });
}
