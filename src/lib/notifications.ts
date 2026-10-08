import "server-only";
import { prisma } from "./prisma";
import { gmailConfigured, sendBirthdayEmail } from "./gmail";
import { whatsappConfigured, sendPromotionWhatsapp } from "./whatsapp";
import { splitRoster } from "./trips";
import { escapeHtml } from "./email-content";
import { tripPath } from "./trip-url";

/** Claims are never automatically retried after an uncertain provider response. */
export async function deliverPromotions() {
  await prisma.notification.updateMany({ where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - 10 * 60000) } }, data: { status: "REVIEW_REQUIRED", error: "Delivery interrupted; check provider before retrying." } });
  const channels: string[] = [];
  if (process.env.TRIP_EMAILS_ENABLED === "true" && gmailConfigured()) channels.push("EMAIL");
  if (whatsappConfigured()) channels.push("WHATSAPP");
  if (!process.env.NEXTAUTH_URL || !channels.length) return { sent: 0, review: 0, configured: false };
  const queue = await prisma.notification.findMany({ where: { status: "QUEUED", channel: { in: channels } }, orderBy: { createdAt: "asc" }, take: 20 });
  let sent = 0, review = 0;
  const deadline = Date.now() + 35000;
  for (const message of queue) {
    if (Date.now() >= deadline) break;
    const r = await prisma.tripRegistration.findUnique({ where: { id: message.registrationId }, include: { user: true, trip: { include: { registrations: true } } } });
    if (!r || r.user.deletedAt || r.trip.startDate <= new Date() || !["OPEN", "WAITLIST", "FULL"].includes(r.trip.status) || !splitRoster(r.trip.registrations, r.trip.maxCapacity).confirmed.some(p => p.id === r.id) || message.key !== `${r.id}:${r.promotionVersion}:${message.channel}` || message.channel === "WHATSAPP" && (!r.user.whatsappOptIn || !r.user.whatsappNumber)) {
      await prisma.notification.updateMany({ where: { id: message.id, status: "QUEUED" }, data: { status: "CANCELLED" } }); continue;
    }
    const claim = await prisma.notification.updateMany({ where: { id: message.id, status: "QUEUED" }, data: { status: "SENDING", error: null } });
    if (!claim.count) continue;
    const url = process.env.NEXTAUTH_URL.replace(/\/$/, "") + tripPath(r.trip);
    try {
      const providerId = message.channel === "WHATSAPP" ? await sendPromotionWhatsapp(r.user.whatsappNumber!, r.trip.title, url, message.id) : null;
      if (message.channel === "EMAIL") await sendBirthdayEmail(r.user.email, "Your waitlist place is confirmed · " + r.trip.title, `<div style="font-family:Arial;background:#171a18;color:#faf8ef;padding:32px"><h1 style="color:#ffe600">You're in!</h1><p>Your ${r.partySize} traveller(s) now have confirmed places on ${escapeHtml(r.trip.title)}.</p><p>Check the current trip details and contact the organiser about payment and travel arrangements.</p><a style="color:#ffe600" href="${escapeHtml(url)}">View your trip</a><p>Sanchari Chennai · Travel with Nature</p></div>`);
      await prisma.notification.updateMany({ where: { id: message.id, status: "SENDING" }, data: { status: "SENT", providerId } }); sent++;
    } catch {
      await prisma.notification.updateMany({ where: { id: message.id, status: "SENDING" }, data: { status: "REVIEW_REQUIRED", error: "Provider acceptance uncertain. Check delivery before retrying." } }); review++;
    }
  }
  return { sent, review, configured: true };
}
