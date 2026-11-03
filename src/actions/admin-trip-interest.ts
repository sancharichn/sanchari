"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { gmailConfigured } from "@/lib/gmail";
import { auditedTransaction, prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { sendInterestGroupEmail } from "@/lib/trip-emails";

const inputSchema = z.object({
  journey: z.string().regex(/^(sri-lanka-2027|trip:[a-z0-9]+)$/),
  campaignId: z.string().uuid(),
  subject: z.string().trim().min(3, "Add a clear email subject.").max(140),
  details: z.string().trim().min(10, "Add the planning update before sending.").max(5000),
});

export async function sendTripInterestCommunication(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return fail("You do not have access to interest-group communications.");
  if (!gmailConfigured()) return fail("Gmail is not configured in the current deployment.");
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const journey = parsed.data.journey;
  const trip = journey.startsWith("trip:") ? await prisma.trip.findUnique({ where: { id: journey.slice(5) }, select: { id: true, slug: true, title: true, interestOpen: true } }) : null;
  if (journey.startsWith("trip:") && (!trip || !trip.interestOpen)) return fail("This trip does not have an open interest group.");
  const journeyTitle = trip?.title ?? "International Trip to Sri Lanka 2027";
  const publicPath = trip ? `/trips/${trip.slug ?? trip.id}` : "/trips/international-trip-to-sri-lanka-2027";

  const recipients = await prisma.tripInterest.findMany({
    where: { journey, user: { deletedAt: null, email: { not: "" } } },
    orderBy: { createdAt: "asc" },
    select: { userId: true, user: { select: { email: true } } },
  });
  if (!recipients.length) return fail("There are no interested members with email addresses.");
  if (recipients.length > 200) return fail("This audience is larger than the safe send limit. Export the list and split the communication into smaller groups.");

  const origin = process.env.NEXTAUTH_URL?.trim() || "https://sancharichennai.vercel.app";
  let sent = 0;
  let alreadySent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const deliveryKey = `interest-email:${journey}:${parsed.data.campaignId}:${recipient.userId}`;
    const previous = await prisma.tripMessageDelivery.findUnique({ where: { deliveryKey }, select: { status: true } });
    if (previous?.status === "SENT") { alreadySent += 1; continue; }

    const delivery = previous
      ? await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { deliveryKey }, data: { status: "SENDING" } }))
      : await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.create({ data: { deliveryKey, recipient: recipient.user.email, kind: "TRIP_INTEREST_EMAIL", status: "SENDING" } }));
    try {
      await sendInterestGroupEmail(recipient.user.email, origin, parsed.data.subject, parsed.data.details, journeyTitle, publicPath);
      await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "SENT" } }));
      sent += 1;
    } catch (error) {
      console.error("[trip-interest-email] delivery failed", error);
      await auditedTransaction(admin.id, () => prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }));
      failed += 1;
    }
  }

  revalidatePath("/admin/trip-interest");
  if (!sent && !alreadySent) return fail("No emails were accepted. Check the Gmail credentials and delivery logs.");
  const delivered = sent + alreadySent;
  const suffix = failed ? ` ${failed} delivery${failed === 1 ? "" : "ies"} need review.` : "";
  return done(`${delivered} interested household${delivered === 1 ? "" : "s"} received this campaign.${alreadySent ? ` ${alreadySent} duplicate ${alreadySent === 1 ? "was" : "were"} safely skipped.` : ""}${suffix}`);
}
