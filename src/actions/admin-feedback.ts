"use server";

import { revalidatePath } from "next/cache";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { formSettingsSchema } from "@/lib/feedback";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { isPublicStatus } from "@/lib/trips";

/*
 * Organiser actions for trip feedback. Like every organiser action, each one
 * re-checks the ADMIN role before touching anything.
 */

const NO_ACCESS = "You don't have access to that.";

function revalidateFeedback(tripId: string) {
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/feedback`);
}

/** Saves the welcome note and the trip's extra questions. */
export async function saveFeedbackForm(tripId: string, input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

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
}

/** Opens or closes the form. Only trips visible on the site can take answers. */
export async function setFeedbackOpen(tripId: string, open: boolean): Promise<ActionResult> {
  if (!(await getAdmin())) return fail(NO_ACCESS);

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
}
