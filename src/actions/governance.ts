"use server";
import { withAudit } from "@/lib/action-audit";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdmin, getCurrentUser } from "@/lib/session";
import { done, fail } from "@/lib/action-result";
import { normalizeWhatsapp } from "@/lib/whatsapp";

export async function assignStaff(input: { userId: string; role: string; tripIds: string[] }) {
  return withAudit(async () => {
  if (!await getAdmin()) return fail("Admin access required.");
  if (!["", "FINANCE", "LEADER", "MODERATOR"].includes(input.role) || !Array.isArray(input.tripIds) || input.tripIds.length > 100) return fail("Invalid staff assignment.");
  const member = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!member || member.role === "ADMIN" || member.deletedAt) return fail("Choose an active member. Full administrators keep their existing access.");
  const ids = [...new Set(input.tripIds)];
  if (input.role === "LEADER" && await prisma.trip.count({ where: { id: { in: ids } } }) !== ids.length) return fail("A selected trip no longer exists.");
  await prisma.user.update({ where: { id: member.id }, data: { staffRole: input.role || null } });
  await prisma.staffTrip.deleteMany({ where: { userId: member.id } });
  if (input.role === "LEADER" && ids.length) await prisma.staffTrip.createMany({ data: ids.map(tripId => ({ userId: member.id, tripId })) });
  revalidatePath("/admin/access"); revalidatePath("/staff");
  return done("Access updated. Changes apply on the next request.");

  });
}

export async function saveWhatsappPreference(enabled: boolean, number: string) {
  return withAudit(async () => {
  const user = await getCurrentUser(); if (!user) return fail("Sign in first.");
  if (typeof enabled !== "boolean" || typeof number !== "string") return fail("Invalid preference.");
  const normalized = normalizeWhatsapp(number);
  if (enabled && !normalized) return fail("Use a full international number, for example +919876543210.");
  await prisma.user.update({ where: { id: user.id }, data: { whatsappOptIn: enabled, whatsappNumber: enabled ? normalized : null } });
  revalidatePath("/profile"); return done(enabled ? "WhatsApp trip notifications enabled." : "WhatsApp notifications disabled.");

  });
}

export async function requestDeletion(confirmation: string) {
  return withAudit(async () => {
  const user = await getCurrentUser(); if (!user) return fail("Sign in first.");
  if (user.role === "ADMIN") return fail("Transfer administrator responsibilities before requesting deletion.");
  if (confirmation !== "DELETE") return fail("Type DELETE to request removal of your profile and family data.");
  if (await prisma.dataRequest.findFirst({ where: { userId: user.id, kind: "DELETE", status: { in: ["OPEN", "REVIEWING"] } } })) return done("Your request is already with the organisers.");
  await prisma.dataRequest.create({ data: { userId: user.id, kind: "DELETE" } });
  revalidatePath("/profile"); return done("Deletion requested. Organisers will review outstanding trips and accounting records before removing personal details.");

  });
}

export async function reviewDataRequest(id: string, status: string, note: string) {
  return withAudit(async () => {
  if (!await getAdmin()) return fail("Admin access required.");
  if (!["REVIEWING", "DECLINED", "COMPLETED"].includes(status) || typeof note !== "string" || note.trim().length < 10 || note.length > 1000) return fail("Choose a status and explain the decision in 10–1000 characters. This explanation is visible to the member.");
  const request = await prisma.dataRequest.findUnique({ where: { id } });
  if (!request || !["OPEN", "REVIEWING"].includes(request.status)) return fail("This request is already closed.");
  if (status === "COMPLETED") {
    const member = await prisma.user.findUnique({ where: { id: request.userId }, include: { familyMembers: true } });
    if (!member || member.role === "ADMIN") return fail("This account cannot be removed here.");
    const upcoming = await prisma.tripRegistration.count({ where: { userId: member.id, trip: { endDate: { gte: new Date() }, status: { not: "ARCHIVED" } } } });
    if (upcoming) return fail("Resolve upcoming registrations first. This request can remain under review.");
    // Keep an anonymous accounting identity so ledger foreign keys remain intact.
    await prisma.feedbackResponse.deleteMany({ where: { userId: member.id } });
    await prisma.feedback.deleteMany({ where: { userId: member.id } });
    await prisma.familyMember.deleteMany({ where: { userId: member.id } });
    await prisma.staffTrip.deleteMany({ where: { userId: member.id } });
    await prisma.tripRegistration.updateMany({ where: { userId: member.id }, data: { companions: [], vehicleDetails: null, carpoolLocation: null, carpoolChoice: "NONE", carpoolSeats: null } });
    await prisma.notification.updateMany({ where: { userId: member.id }, data: { status: "CANCELLED", error: null } });
    await prisma.tripMessageDelivery.updateMany({ where: { recipient: member.email }, data: { recipient: "removed" } });
    await prisma.birthdayDelivery.deleteMany({ where: { recipientKey: { endsWith: ":" + member.email } } });
    await prisma.user.update({ where: { id: member.id }, data: { name: "Removed member", email: `removed-${member.id}@example.invalid`, image: null, phone: null, emergencyContact: null, bloodGroup: null, birthdayDay: null, birthdayMonth: null, whatsappOptIn: false, whatsappNumber: null, staffRole: null, deletedAt: new Date() } });
  }
  await prisma.dataRequest.update({ where: { id }, data: { status, note: note.trim(), resolvedAt: status === "REVIEWING" ? null : new Date() } });
  revalidatePath("/admin/data-requests"); revalidatePath("/profile"); return done("Request updated.");

  });
}

export async function retryNotification(id: string, checked: boolean) {
  return withAudit(async () => {
  if (!await getAdmin()) return fail("Admin access required.");
  if (checked !== true) return fail("Confirm you checked the provider and the message was not delivered.");
  const result = await prisma.notification.updateMany({ where: { id, status: { in: ["REVIEW_REQUIRED", "FAILED"] } }, data: { status: "QUEUED", error: null } });
  revalidatePath("/admin/notifications"); return result.count ? done("Queued for the next delivery run.") : fail("This message cannot be retried.");

  });
}
