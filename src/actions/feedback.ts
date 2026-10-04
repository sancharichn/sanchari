"use server";

import { Prisma, type SuggestionKind } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { buildResponseSchema, guessTopic, normaliseWhatsApp, parseExtraQuestions, qualityFlags } from "@/lib/feedback";
import {
  clientIp,
  dedupeKey,
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE,
  hashIp,
  isDeviceId,
  isFromTraveller,
  newDeviceId,
  readFormToken,
} from "@/lib/feedback-server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserSafe } from "@/lib/session";
import { isPublicStatus } from "@/lib/trips";

/*
 * Trip feedback from anyone with the link. Signing in is optional; it only
 * decides how "one response each" is counted and lets travellers' answers
 * be marked verified.
 */

/** Faster than this, it's a script rather than a person. */
const MIN_SECONDS = 5;
/** Generous, because a whole group can share one mobile network address. */
const HOURLY_LIMIT_PER_ADDRESS = 30;

type Payload = { token?: unknown; website?: unknown; answers?: unknown };

export async function submitTripFeedback(tripId: string, payload: Payload): Promise<ActionResult> {
  const trip = await prisma.trip.findUnique({
    where: { id: String(tripId) },
    select: {
      id: true,
      status: true,
      maxCapacity: true,
      feedbackForm: { select: { id: true, isOpen: true, questions: true } },
    },
  });
  const form = trip?.feedbackForm;
  if (!trip || !form || !isPublicStatus(trip.status)) return fail("This feedback form isn't available.");
  if (!form.isOpen) return fail("Feedback for this trip is closed now. Thank you for wanting to share!");

  // Only bots fill in the hidden field. Tell them it worked and keep nothing.
  if (typeof payload?.website === "string" && payload.website.trim()) return done("Nanni! Your feedback is in.");

  const openedAt = readFormToken(payload?.token, form.id);
  if (openedAt === null) {
    return fail("This page was open for too long. Copy anything long you wrote, reload the page and send again.");
  }
  const secondsToFill = Math.round((Date.now() - openedAt) / 1000);
  if (secondsToFill < MIN_SECONDS) return fail("That was very quick. Take a moment over the questions, then send.");

  const extras = parseExtraQuestions(form.questions);
  const parsed = buildResponseSchema(extras).safeParse(payload?.answers);
  if (!parsed.success) return invalid(parsed.error, "A few answers need another look.");
  const answers = parsed.data;

  const headerList = headers();
  const ipHash = hashIp(clientIp(headerList.get("x-forwarded-for"), headerList.get("x-real-ip")));
  if (ipHash) {
    const lastHour = await prisma.feedbackResponse.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (lastHour >= HOURLY_LIMIT_PER_ADDRESS) {
      return fail("A lot of answers have come from this connection in the last hour. Please try again later.");
    }
  }

  const user = await getCurrentUserSafe();
  let deviceId: string | undefined;
  if (!user) {
    const jar = cookies();
    deviceId = jar.get(DEVICE_COOKIE)?.value;
    if (!isDeviceId(deviceId)) {
      deviceId = newDeviceId();
      jar.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: DEVICE_COOKIE_MAX_AGE,
        path: "/",
      });
    }
  }
  const key = dedupeKey(form.id, user ? { userId: user.id } : { deviceId: deviceId! });

  const whatsapp = !answers.anonymous && answers.whatsapp ? normaliseWhatsApp(answers.whatsapp) : null;
  // Anonymous answers can still be verified for a signed-in traveller; the account just isn't stored.
  const verified = await isFromTraveller(trip, { userId: user?.id ?? null, whatsapp });

  const extraTexts = extras.filter((q) => q.type === "text").map((q) => answers.extras[q.id] as string | null);
  const flags = qualityFlags([answers.loved, answers.leaderIdea, answers.nextPlace, ...extraTexts], secondsToFill);

  const fields = {
    anonymous: answers.anonymous,
    name: answers.anonymous ? null : answers.name,
    whatsapp,
    userId: answers.anonymous ? null : (user?.id ?? null),
    groupSize: answers.groupSize,
    overall: answers.overall,
    comeAgain: answers.comeAgain,
    ratings: answers.ratings,
    extras: answers.extras as Prisma.InputJsonObject,
    loved: answers.loved,
    leaderIdea: answers.leaderIdea,
    nextPlace: answers.nextPlace,
    shareOk: answers.shareOk,
    verified,
    flags,
    secondsToFill,
    ipHash,
  };

  const ideas: Array<{ kind: SuggestionKind; text: string }> = [];
  if (answers.leaderIdea) ideas.push({ kind: "IDEA", text: answers.leaderIdea });
  if (answers.nextPlace) ideas.push({ kind: "PLACE", text: answers.nextPlace });

  const save = () =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.feedbackResponse.findUnique({
        where: { formId_dedupeKey: { formId: form.id, dedupeKey: key } },
        select: { id: true },
      });
      const response = existing
        ? await tx.feedbackResponse.update({
            where: { id: existing.id },
            // New words haven't been approved for the website yet.
            data: { ...fields, featured: false },
            select: { id: true },
          })
        : await tx.feedbackResponse.create({
            data: { ...fields, formId: form.id, tripId: trip.id, dedupeKey: key },
            select: { id: true },
          });

      // Replace this response's untouched suggestions; keep the ones organisers have already acted on.
      await tx.suggestion.deleteMany({ where: { responseId: response.id, status: "NEW" } });
      const kept = await tx.suggestion.findMany({ where: { responseId: response.id }, select: { kind: true, text: true } });
      const fresh = ideas.filter((idea) => !kept.some((k) => k.kind === idea.kind && k.text === idea.text));
      if (fresh.length > 0) {
        await tx.suggestion.createMany({
          data: fresh.map((idea) => ({
            responseId: response.id,
            tripId: trip.id,
            kind: idea.kind,
            text: idea.text,
            topic: guessTopic(idea.text, idea.kind),
          })),
        });
      }
      return Boolean(existing);
    });

  let replaced: boolean;
  try {
    replaced = await save();
  } catch (error) {
    // Two tabs sending at once: the second finds the first's row on a retry and updates it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") replaced = await save();
    else throw error;
  }

  return done(
    replaced ? "Nanni! Your new answers replaced the ones you sent before." : "Nanni! Your feedback is in.",
    { replaced },
  );
}
