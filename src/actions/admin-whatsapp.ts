"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { withAudit } from "@/lib/action-audit";
import { gmailConfigured } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { sendTripGroupInviteEmail } from "@/lib/trip-emails";
import { splitRoster } from "@/lib/trips";
import { normalizeWhatsappInviteUrl } from "@/lib/whatsapp";

export async function saveTripWhatsappGroup(tripId: string, inviteUrl: string): Promise<ActionResult> {
  return withAudit(async () => {
    if (!(await getAdmin("lead", tripId))) return fail("You don't have access to that.");
    const input = inviteUrl.trim();
    const clean = input ? normalizeWhatsappInviteUrl(input) : "";
    if (input && !clean) return fail("Paste the full group invite link beginning https://chat.whatsapp.com/.");
    const trip = await prisma.trip.update({ where: { id: tripId }, data: { whatsappGroupInviteUrl: clean || null, whatsappGroupInvitesSentAt: null }, select: { title: true } }).catch(() => null);
    if (!trip) return fail("Trip not found.");
    revalidatePath(`/admin/trips/${tripId}`);
    return done(clean ? `WhatsApp group saved as “${trip.title}”.` : "WhatsApp group link removed.");
  });
}

async function recipientsForTrip(tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { registrations: { include: { user: { select: { id: true, email: true, deletedAt: true } } } } } });
  if (!trip) return null;
  const split = splitRoster(trip.registrations, trip.maxCapacity);
  const candidates = [...split.confirmed, ...split.waitlisted];
  if (trip.status === "WAITLIST") candidates.push(...trip.registrations.filter((item) => item.approvalStatus === "PENDING"));
  const recipients = Array.from(new Map(candidates.map((registration) => [registration.user.id, registration])).values()).filter((registration) => !registration.user.deletedAt && Boolean(registration.user.email));
  return { trip, recipients };
}

export async function sendTripGroupInviteEmails(tripId: string): Promise<ActionResult> {
  return withAudit(async () => {
    if (!(await getAdmin("lead", tripId))) return fail("You don't have access to that.");
    if (!gmailConfigured() || !process.env.NEXTAUTH_URL) return fail("Gmail is not configured in the current deployment.");
    const scoped = await recipientsForTrip(tripId);
    if (!scoped) return fail("Trip not found.");
    const inviteUrl = normalizeWhatsappInviteUrl(scoped.trip.whatsappGroupInviteUrl ?? "");
    if (!inviteUrl) return fail("Save a valid WhatsApp group invite link first.");
    if (!scoped.recipients.length) return fail("There are no approved or waitlisted members with an email address.");
    const version = createHash("sha256").update(inviteUrl).digest("hex").slice(0, 12);
    let sent = 0;
    let alreadySent = 0;
    let failed = 0;
    for (const recipient of scoped.recipients) {
      const deliveryKey = `whatsapp-group-email:${tripId}:${recipient.id}:${version}`;
      let delivery = await prisma.tripMessageDelivery.findUnique({ where: { deliveryKey }, select: { id: true, status: true } });
      if (delivery?.status === "SENT") { alreadySent += 1; continue; }
      try {
        delivery = delivery ? await prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "SENDING" }, select: { id: true, status: true } }) : await prisma.tripMessageDelivery.create({ data: { deliveryKey, recipient: recipient.user.email, kind: "WHATSAPP_GROUP_EMAIL" }, select: { id: true, status: true } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { alreadySent += 1; continue; }
        failed += 1;
        continue;
      }
      try {
        await sendTripGroupInviteEmail(recipient.user.email, scoped.trip, process.env.NEXTAUTH_URL, inviteUrl);
        await prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "SENT" } });
        sent += 1;
      } catch {
        await prisma.tripMessageDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }).catch(() => null);
        failed += 1;
      }
    }
    if (sent > 0) await prisma.trip.update({ where: { id: tripId }, data: { whatsappGroupInvitesSentAt: new Date() } });
    revalidatePath(`/admin/trips/${tripId}`);
    if (!sent && failed) return fail(`No emails were sent. ${failed} need review.`);
    const notes = [sent ? `${sent} sent` : "", alreadySent ? `${alreadySent} already sent` : "", failed ? `${failed} need review` : ""].filter(Boolean).join(" · ");
    return done(`Group invitation email: ${notes}.`);
  });
}
