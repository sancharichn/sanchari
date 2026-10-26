"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { withAudit } from "@/lib/action-audit";
import { FAMILY_RELATIONSHIPS } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { BLOOD_GROUPS } from "@/lib/validation";
import { normalizeWhatsapp } from "@/lib/whatsapp";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const optionalBirthday = (max: number) => z.preprocess((value) => value === "" || value === undefined || value === null ? null : value, z.coerce.number().int().min(1).max(max).nullable());
const optionalImage = z.string().trim().max(400000).refine((value) => !value || /^https:\/\//.test(value) || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value), "Use an HTTPS image URL or a JPEG profile photo.").transform((value) => value || null);

const familySchema = z.object({
  id: z.string().optional(), name: z.string().trim().min(2).max(100),
  relationship: z.enum(FAMILY_RELATIONSHIPS), birthdayMonth: optionalBirthday(12), birthdayDay: optionalBirthday(31), image: optionalImage,
});

const memberSchema = z.object({
  id: z.string().min(1), name: optionalText(100), email: z.string().trim().email().max(320), image: optionalImage,
  role: z.nativeEnum(Role), staffRole: z.union([z.literal(""), z.enum(["FINANCE", "LEADER", "MODERATOR"])]).transform((value) => value || null),
  phone: optionalText(20), bloodGroup: z.union([z.literal(""), z.enum(BLOOD_GROUPS)]).transform((value) => value || null),
  emergencyContact: optionalText(120), birthdayMonth: optionalBirthday(12), birthdayDay: optionalBirthday(31),
  whatsappOptIn: z.boolean(), whatsappNumber: optionalText(20), familyMembers: z.array(familySchema).max(20),
  preferredTripKinds: z.array(z.enum(["MEETUP", "DAY_TRIP", "STAY_BACK", "INTERNATIONAL", "TREK"])).max(5),
  travelPace: z.union([z.literal(""), z.enum(["RELAXED", "BALANCED", "ACTIVE"])]).transform((value) => value || null),
  homeArea: optionalText(80),
}).superRefine((value, ctx) => {
  const validBirthday = (month: number | null, day: number | null) => (month === null && day === null) || (month !== null && day !== null && new Date(Date.UTC(2000, month - 1, day)).getUTCMonth() === month - 1);
  if (!validBirthday(value.birthdayMonth, value.birthdayDay)) ctx.addIssue({ code: "custom", path: ["birthdayDay"], message: "Choose a valid birthday month and day, or leave both blank." });
  value.familyMembers.forEach((member, index) => { if (!validBirthday(member.birthdayMonth, member.birthdayDay)) ctx.addIssue({ code: "custom", path: ["familyMembers", index, "birthdayDay"], message: "Choose a valid birthday." }); });
  if (value.phone && !/^\+?[\d\s()-]+$/.test(value.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "Use a valid phone number." });
  if (value.whatsappOptIn && !normalizeWhatsapp(value.whatsappNumber ?? "")) ctx.addIssue({ code: "custom", path: ["whatsappNumber"], message: "Add a valid international WhatsApp number." });
});

export async function updateMemberByAdmin(input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
    const admin = await getAdmin();
    if (!admin) return fail("Admin access required.");
    const parsed = memberSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { id, familyMembers, whatsappNumber, ...data } = parsed.data;
    const member = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, deletedAt: true } });
    if (!member || member.deletedAt) return fail("This member is no longer active.");
    if (id === admin.id && data.role !== "ADMIN") return fail("You cannot remove your own administrator access.");
    if (member.role === "ADMIN" && data.role !== "ADMIN" && await prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }) <= 1) return fail("Keep at least one active administrator.");
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { ...data, whatsappNumber: data.whatsappOptIn ? normalizeWhatsapp(whatsappNumber ?? "") : null, staffRole: data.role === "ADMIN" ? null : data.staffRole, personalizationUpdatedAt: data.preferredTripKinds.length || data.travelPace || data.homeArea ? new Date() : null } });
        const existing = await tx.familyMember.findMany({ where: { userId: id }, select: { id: true } });
        const owned = new Set(existing.map((entry) => entry.id));
        const retained = familyMembers.flatMap((entry) => entry.id && owned.has(entry.id) ? [entry.id] : []);
        await tx.familyMember.deleteMany({ where: { userId: id, id: { notIn: retained } } });
        for (const entry of familyMembers) {
          const familyData = { name: entry.name, relationship: entry.relationship, birthdayMonth: entry.birthdayMonth, birthdayDay: entry.birthdayDay, image: entry.image };
          if (entry.id && owned.has(entry.id)) await tx.familyMember.update({ where: { id: entry.id }, data: familyData });
          else await tx.familyMember.create({ data: { ...familyData, userId: id } });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("That email address already belongs to another member.");
      throw error;
    }
    revalidatePath("/admin/members"); revalidatePath("/admin/access"); revalidatePath("/profile");
    return done("Member details updated.");
  });
}

export async function deleteMemberByAdmin(id: string): Promise<ActionResult> {
  return withAudit(async () => {
    const admin = await getAdmin();
    if (!admin) return fail("Admin access required.");
    if (!id || id === admin.id) return fail("You cannot delete your own administrator account.");
    const member = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true, deletedAt: true } });
    if (!member || member.deletedAt) return fail("This member is already removed.");
    if (member.role === "ADMIN") return fail("Change this organiser to Member before deleting the account.");
    const [upcoming, activeOrders] = await Promise.all([
      prisma.tripRegistration.count({ where: { userId: id, trip: { endDate: { gte: new Date() }, status: { not: "ARCHIVED" } } } }),
      prisma.shopOrder.count({ where: { userId: id, status: { in: ["REQUESTED", "CONFIRMED", "READY"] } } }),
    ]);
    if (upcoming) return fail("Resolve this member’s upcoming trip registrations before deleting the account.");
    if (activeOrders) return fail("Complete or cancel this member’s pickup orders before deleting the account.");
    await prisma.feedbackResponse.deleteMany({ where: { userId: id } });
    await prisma.feedback.deleteMany({ where: { userId: id } });
    await prisma.tripInterest.deleteMany({ where: { userId: id } });
    await prisma.familyMember.deleteMany({ where: { userId: id } });
    await prisma.staffTrip.deleteMany({ where: { userId: id } });
    await prisma.tripRegistration.updateMany({ where: { userId: id }, data: { companions: [], vehicleDetails: null, carpoolLocation: null, carpoolChoice: "NONE", carpoolSeats: null } });
    await prisma.shopOrder.updateMany({ where: { userId: id }, data: { pickupNote: null } });
    await prisma.notification.updateMany({ where: { userId: id }, data: { status: "CANCELLED", error: null } });
    await prisma.tripMessageDelivery.updateMany({ where: { recipient: member.email }, data: { recipient: "removed" } });
    await prisma.birthdayDelivery.deleteMany({ where: { recipientKey: { endsWith: `:${member.email}` } } });
    await prisma.user.update({ where: { id }, data: { name: "Removed member", email: `removed-${id}@example.invalid`, image: null, phone: null, emergencyContact: null, bloodGroup: null, birthdayDay: null, birthdayMonth: null, whatsappOptIn: false, whatsappNumber: null, staffRole: null, preferredTripKinds: [], travelPace: null, homeArea: null, personalizationUpdatedAt: null, deletedAt: new Date() } });
    revalidatePath("/admin/members"); revalidatePath("/admin/access");
    return done("Member removed. Historical trip and order records were anonymised and retained.");
  });
}
