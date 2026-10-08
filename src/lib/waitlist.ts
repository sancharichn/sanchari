import "server-only";
import { prisma } from "./prisma";
import { splitRoster } from "./trips";

export async function rosterSnapshot(tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { registrations: true } });
  return trip ? splitRoster(trip.registrations, trip.maxCapacity) : null;
}

/** Called inside the same serializable transaction as a capacity change/cancellation. */
export async function queuePromotions(tripId: string, before: Awaited<ReturnType<typeof rosterSnapshot>>) {
  if (!before) return;
  const after = await rosterSnapshot(tripId);
  if (!after) return;
  const waiting = new Set(before.waitlisted.map(r => r.id));
  for (const registration of after.confirmed.filter(r => waiting.has(r.id))) {
    const updated = await prisma.tripRegistration.update({ where: { id: registration.id }, data: { promotionVersion: { increment: 1 } } });
    for (const channel of ["EMAIL", "WHATSAPP"]) {
      const key = `${registration.id}:${updated.promotionVersion}:${channel}`;
      await prisma.notification.upsert({ where: { key }, create: { key, registrationId: registration.id, userId: registration.userId, tripId, channel, kind: "WAITLIST_PROMOTED" }, update: {} });
    }
  }
}

export async function cancelBooking(id: string, reason: string) {
  const registration = await prisma.tripRegistration.findUnique({ where: { id } });
  if (!registration) return null;
  const before = await rosterSnapshot(registration.tripId);
  await prisma.cancellation.create({ data: { userId: registration.userId, tripId: registration.tripId, partySize: registration.partySize, wasConfirmed: Boolean(before?.confirmed.some(r => r.id === id)), reason } });
  await prisma.tripRegistration.delete({ where: { id } });
  await queuePromotions(registration.tripId, before);
  return registration;
}
