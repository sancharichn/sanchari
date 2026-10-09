import { escapeHtml } from "@/lib/email-content";
import { formatDateRange } from "@/lib/format";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { tripPath } from "@/lib/trip-url";
import type { TripKind } from "@prisma/client";

type TripEmailData = { id: string; slug: string | null; title: string; location: string; startDate: Date; endDate: Date; kind: TripKind; description?: string | null };

function shell(subject: string, body: string, link: string) {
  return `<div style="background:#102820;color:#f6f4ed;padding:32px;font-family:Arial,sans-serif;max-width:600px"><p style="color:#e6d65c;letter-spacing:4px">SANCHARI CHENNAI</p><h1 style="font-size:30px;color:#e6d65c">${escapeHtml(subject)}</h1>${body}<p><a style="display:inline-block;padding:12px 18px;background:#e6d65c;color:#0a0a0a;text-decoration:none;border-radius:6px;font-weight:bold" href="${escapeHtml(link)}">Open your trip</a></p><p style="font-size:12px;color:#b8c8c2">Travel with Nature · Sanchari Chennai</p></div>`;
}

export function tripBriefingMessage(trip: TripEmailData) {
  const meetup = trip.kind === "MEETUP";
  const subject = meetup ? "Your meetup is coming up" : "Your trip briefing";
  const body = `<h2>${escapeHtml(trip.title)}</h2><p>${escapeHtml(formatDateRange(trip.startDate, trip.endDate))} · ${escapeHtml(trip.location)}</p><p>${meetup ? "Your meetup is coming up soon. Please review the time, location and organiser updates before you join." : "Your place is confirmed. Please review the itinerary, packing information and travel arrangements before departure."}</p>`;
  return { subject, body };
}

export async function sendTripBriefingEmail(to: string, trip: TripEmailData, origin: string) {
  if (!gmailConfigured()) throw new Error("Gmail is not configured.");
  const message = tripBriefingMessage(trip);
  await sendBirthdayEmail(to, `${message.subject} · ${trip.title}`, shell(message.subject, message.body, `${origin.replace(/\/$/, "")}${tripPath(trip)}`));
}

export async function sendApprovalEmail(to: string, trip: TripEmailData, origin: string) {
  if (!gmailConfigured()) throw new Error("Gmail is not configured.");
  const subject = trip.kind === "MEETUP" ? "Your meetup registration is approved" : "Your trip registration is approved";
  const body = `<h2>${escapeHtml(trip.title)}</h2><p>${escapeHtml(formatDateRange(trip.startDate, trip.endDate))} · ${escapeHtml(trip.location)}</p><p>Your registration has been approved by the organiser. ${trip.kind === "MEETUP" ? "There is no payment required for this meetup." : "Please review the trip cost and contact the organiser about payment."}</p>`;
  await sendBirthdayEmail(to, `${subject} · ${trip.title}`, shell(subject, body, `${origin.replace(/\/$/, "")}${tripPath(trip)}`));
}

export async function sendTripCommunicationEmail(to: string, trip: TripEmailData, origin: string, subject: string, details: string) {
  if (!gmailConfigured()) throw new Error("Gmail is not configured.");
  const body = `<h2>${escapeHtml(trip.title)}</h2><p>${escapeHtml(formatDateRange(trip.startDate, trip.endDate))} · ${escapeHtml(trip.location)}</p><p style="white-space:pre-line;line-height:1.7">${escapeHtml(details)}</p>`;
  await sendBirthdayEmail(to, `${subject} · ${trip.title}`, shell(subject, body, `${origin.replace(/\/$/, "")}${tripPath(trip)}`));
}
