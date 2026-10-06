import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normaliseWhatsApp } from "@/lib/feedback";
import { splitRoster } from "@/lib/trips";

/*
 * Server-side pieces of trip feedback: keyed hashes for "one response per
 * account or device" and rate limiting (so no raw IPs or device ids are
 * stored), a signed timestamp to tell how long the form took, and the
 * traveller checks behind the verified tag.
 */

export const DEVICE_COOKIE = "sanchari_device";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET must be set to accept feedback.");
  return value;
}

function hmac(label: string, value: string): string {
  return createHmac("sha256", secret()).update(`${label}:${value}`).digest("hex");
}

export function newDeviceId(): string {
  return randomUUID();
}

export function isDeviceId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f-]{36}$/i.test(value));
}

/** Same account or device, same form: same key, so a second response replaces the first. */
export function dedupeKey(formId: string, subject: { userId: string } | { deviceId: string }): string {
  const who = "userId" in subject ? `user:${subject.userId}` : `device:${subject.deviceId}`;
  return hmac("dedupe", `${formId}:${who}`);
}

export function hashIp(ip: string | null): string | null {
  return ip ? hmac("ip", ip).slice(0, 32) : null;
}

/** "issuedAt.signature", rendered with the form, so the server knows when it was opened. */
export function signFormToken(formId: string, issuedAt = Date.now()): string {
  return `${issuedAt}.${hmac("form", `${formId}:${issuedAt}`).slice(0, 32)}`;
}

const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

/** When the form was opened, or null if the token is forged, from the future or too old. */
export function readFormToken(token: unknown, formId: string, now = Date.now()): number | null {
  if (typeof token !== "string") return null;
  const [issued, signature] = token.split(".");
  const issuedAt = Number(issued);
  if (!Number.isSafeInteger(issuedAt) || !signature) return null;
  const expected = Buffer.from(hmac("form", `${formId}:${issuedAt}`).slice(0, 32));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (issuedAt > now + 60_000 || now - issuedAt > TOKEN_MAX_AGE_MS) return null;
  return issuedAt;
}

/** The first address in x-forwarded-for, as set by Vercel's proxy. */
export function clientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || realIp?.trim() || null;
}

/**
 * Whether this response comes from someone who had a seat on the trip: a
 * signed-in traveller, or a WhatsApp number matching a traveller's phone.
 */
export async function isFromTraveller(
  trip: { id: string; maxCapacity: number },
  who: { userId: string | null; whatsapp: string | null },
): Promise<boolean> {
  const registrations = await prisma.tripRegistration.findMany({
    where: { tripId: trip.id },
    select: { id: true, createdAt: true, partySize: true, userId: true, user: { select: { phone: true } } },
  });
  if (registrations.length === 0) return false;
  const { confirmed } = splitRoster(registrations, trip.maxCapacity);
  if (who.userId && confirmed.some((r) => r.userId === who.userId)) return true;
  if (!who.whatsapp) return false;
  return confirmed.some((r) => r.user.phone && normaliseWhatsApp(r.user.phone) === who.whatsapp);
}
