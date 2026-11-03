"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { publishInstagramImage, instagramPublishingConfigured } from "@/lib/instagram-publish";
import { auditedTransaction, prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";

const schema = z.object({ tripId: z.string().min(1), campaignId: z.string().uuid(), caption: z.string().trim().min(10, "Add a useful caption.").max(2200, "Instagram captions can contain up to 2,200 characters.") });

export async function publishTripToInstagram(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return fail("You do not have access to Instagram publishing.");
  if (!instagramPublishingConfigured()) return fail("Instagram publishing is not configured. Connect a Professional account with content-publishing permission.");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const trip = await prisma.trip.findUnique({ where: { id: parsed.data.tripId }, select: { id: true, slug: true, title: true, location: true, coverPhotoId: true } });
  if (!trip) return fail("That trip no longer exists.");
  if (!trip.coverPhotoId) return fail("Choose a trip cover photo before publishing to Instagram.");

  const deliveryKey = `instagram:${trip.id}:${parsed.data.campaignId}`;
  const previous = await prisma.tripMessageDelivery.findUnique({ where: { deliveryKey }, select: { id: true, status: true } });
  if (previous?.status === "SENT") return done("This Instagram post was already published; the duplicate click was safely skipped.");
  const delivery = previous ? await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { id: previous.id }, data: { status: "SENDING" } })) : await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.create({ data: { deliveryKey, recipient: "@sanchari.chennai", kind: "INSTAGRAM_POST", status: "SENDING" } }));

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://sancharichennai.vercel.app";
  const imageUrl = `${origin}/api/gallery/${encodeURIComponent(trip.coverPhotoId)}`;
  try {
    await publishInstagramImage(imageUrl, parsed.data.caption, `${trip.title} in ${trip.location}, shared by Sanchari Chennai`);
    await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "SENT" } }));
    revalidatePath(`/admin/trips/${trip.id}`);
    revalidatePath("/");
    return done(`Published ${trip.title} to Instagram.`);
  } catch (error) {
    console.error("[instagram-publish] failed", error instanceof Error ? error.message : "Unknown error");
    await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }));
    return fail(error instanceof Error ? `Instagram did not publish this post: ${error.message}` : "Instagram did not publish this post. Review the connection and try again.");
  }
}
