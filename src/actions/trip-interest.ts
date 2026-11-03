"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
const defaultJourney = "sri-lanka-2027";
const journeySchema = z.string().regex(/^(sri-lanka-2027|trip:[a-z0-9]+)$/, "This interest group is not valid.");
const schema = z.object({ journey: journeySchema.default(defaultJourney), consent: z.literal("on", { errorMap: () => ({ message: "Confirm that this is a planning enquiry and organisers may contact you." }) }), partySize: z.coerce.number().int().min(1).max(20), note: z.string().trim().max(1000) });
async function openJourney(journey: string) {
  if (journey === defaultJourney) return true;
  const trip = await prisma.trip.findUnique({ where: { id: journey.slice(5) }, select: { interestOpen: true } });
  return Boolean(trip?.interestOpen);
}
export async function saveTripInterest(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to register your interest.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { consent, journey, ...details } = parsed.data;
  if (!await openJourney(journey)) return fail("This trip is not accepting planning interest.");
  await prisma.tripInterest.upsert({ where: { journey_userId: { journey, userId: user.id } }, create: { journey, userId: user.id, ...details }, update: details });
  revalidatePath(journey === defaultJourney ? "/trips/international-trip-to-sri-lanka-2027" : `/trips/${journey.slice(5)}`); revalidatePath("/admin/trip-interest"); revalidatePath("/profile");
  return done("Your interest is saved. Organisers can contact you about planning. This is not a booking or a payment commitment.");
}
export async function withdrawTripInterest(input: string = defaultJourney): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to manage your interest.");
  const parsed = journeySchema.safeParse(input);
  if (!parsed.success) return fail("This interest group is not valid.");
  await prisma.tripInterest.deleteMany({ where: { journey: parsed.data, userId: user.id } });
  revalidatePath(parsed.data === defaultJourney ? "/trips/international-trip-to-sri-lanka-2027" : `/trips/${parsed.data.slice(5)}`); revalidatePath("/admin/trip-interest"); revalidatePath("/profile");
  return done("Your interest has been withdrawn.");
}
