"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
const journey = "sri-lanka-2027";
const schema = z.object({ consent: z.literal("on", { errorMap: () => ({ message: "Confirm that this is a planning enquiry and organisers may contact you." }) }), partySize: z.coerce.number().int().min(1).max(20), note: z.string().trim().max(1000) });
export async function saveTripInterest(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to register your interest.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { consent, ...details } = parsed.data;
  await prisma.tripInterest.upsert({ where: { journey_userId: { journey, userId: user.id } }, create: { journey, userId: user.id, ...details }, update: details });
  revalidatePath("/trips/international-trip-to-sri-lanka-2027"); revalidatePath("/admin/trip-interest"); revalidatePath("/profile");
  return done("Your interest is saved. Organisers can contact you about planning. This is not a booking or a payment commitment.");
}
export async function withdrawTripInterest(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to manage your interest.");
  await prisma.tripInterest.deleteMany({ where: { journey, userId: user.id } });
  revalidatePath("/trips/international-trip-to-sri-lanka-2027"); revalidatePath("/admin/trip-interest"); revalidatePath("/profile");
  return done("Your interest has been withdrawn.");
}
