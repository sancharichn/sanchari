import { deliverPromotions } from "@/lib/notifications";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { escapeHtml } from "@/lib/email-content";
import { splitRoster } from "@/lib/trips";
import { toDateInputValue, formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const promotions = await deliverPromotions();
  if (process.env.TRIP_EMAILS_ENABLED !== "true" || !gmailConfigured() || !process.env.NEXTAUTH_URL) return NextResponse.json({ status: "not_configured", sent: 0, promotions });
  const now = new Date();
  const today = Date.parse(toDateInputValue(now) + "T00:00:00Z");
  const trips = await prisma.trip.findMany({ where: { status: { in: ["OPEN", "WAITLIST", "FULL", "COMPLETED"] }, endDate: { gte: new Date(now.getTime() - 3*86400000) }, startDate: { lte: new Date(now.getTime() + 5*86400000) } }, include: { registrations: { include: { user: true } }, feedbackForm: true } });
  let sent = 0, failed = 0;
  for (const trip of trips) {
    const until = (Date.parse(toDateInputValue(trip.startDate)+"T00:00:00Z")-today)/86400000;
    const after = (today-Date.parse(toDateInputValue(trip.endDate)+"T00:00:00Z"))/86400000;
    const kind = until === 3 ? "PAYMENT" : until === 1 ? "BRIEFING" : after === 1 && trip.feedbackForm?.isOpen ? "FEEDBACK" : null;
    if (!kind) continue;
    for (const r of splitRoster(trip.registrations, trip.maxCapacity).confirmed) {
      if (kind === "PAYMENT" && !["PENDING", "PARTIAL"].includes(r.paymentStatus)) continue;
      let claim;
      try { claim = await prisma.tripMessageDelivery.create({ data: { deliveryKey: [trip.id, r.id, kind, toDateInputValue(now)].join(":"), recipient: r.user.email, kind } }); }
      catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue; throw error; }
      const subject = kind === "PAYMENT" ? "Payment reminder" : kind === "BRIEFING" ? "Your trip is tomorrow" : "How was your trip?";
      const body = kind === "PAYMENT" ? "Our roster shows a pending or partial payment. Please contact your organiser if you have already paid." : kind === "BRIEFING" ? "Review the itinerary, packing information and travel arrangements. Contact your organiser if anything is unclear." : "Thank you for travelling with Sanchari. Please share your feedback to help us improve.";
      const url = process.env.NEXTAUTH_URL.replace(/\/$/,"") + "/trips/" + trip.id + (kind === "FEEDBACK" ? "/feedback" : "");
      try {
        await sendBirthdayEmail(r.user.email, subject + " · " + trip.title, `<div style="font-family:Arial;max-width:600px;padding:28px;background:#121212;color:#f2f2ec"><h1 style="color:#ffe600">${escapeHtml(subject)}</h1><h2>${escapeHtml(trip.title)}</h2><p>${escapeHtml(formatDateRange(trip.startDate,trip.endDate))}</p><p>${escapeHtml(body)}</p><a style="color:#ffe600" href="${escapeHtml(url)}">Open trip</a><p>Sanchari Chennai · Travel with Nature</p></div>`);
        await prisma.tripMessageDelivery.update({ where: { id: claim.id }, data: { status: "SENT" } }); sent++;
      } catch { await prisma.tripMessageDelivery.update({ where: { id: claim.id }, data: { status: "REVIEW_REQUIRED" } }); failed++; }
    }
  }
  return NextResponse.json({ sent, failed, promotions });
}
