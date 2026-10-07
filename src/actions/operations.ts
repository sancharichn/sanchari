"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { expectedPayment, ledgerStatus, paymentInput } from "@/lib/operations";
import { toPaise } from "@/lib/format";
import { splitRoster } from "@/lib/trips";

function refresh() { revalidatePath("/admin", "layout"); revalidatePath("/profile"); }

export async function saveFeedbackFollowUp(id: string, status: string, note: string): Promise<ActionResult> {
  if (!await getAdmin()) return fail("Admin access required.");
  if (!["NEW", "IN_PROGRESS", "RESOLVED"].includes(status) || typeof note !== "string" || note.length > 4000) return fail("Choose a status and keep notes under 4000 characters.");
  const result = await prisma.feedbackResponse.updateMany({ where: { id }, data: { followUpStatus: status, followUpNote: note.trim() || null } });
  if (!result.count) return fail("Feedback no longer exists.");
  refresh(); return done("Private follow-up saved.");
}

export async function recordPayment(input: unknown): Promise<ActionResult> {
  const admin = await getAdmin(); if (!admin) return fail("Admin access required.");
  const parsed = paymentInput.safeParse(input); if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      const duplicate = await tx.paymentEvent.findUnique({ where: { requestId: v.requestId } });
      if (duplicate) return;
      const registration = await tx.tripRegistration.findUnique({ where: { id: v.registrationId }, include: { trip: true, paymentEvents: true } });
      if (!registration) throw new Error("Registration no longer exists.");
      const net = registration.paymentEvents.reduce((sum, event) => sum + toPaise(event.amount), 0);
      const delta = toPaise(v.amount) * (v.kind === "REFUND" ? -1 : 1);
      if (net + delta < 0) throw new Error("Refund cannot exceed the receipts recorded in this ledger.");
      await tx.paymentEvent.create({ data: { tripId: registration.tripId, registrationId: registration.id, recordedById: admin.id, requestId: v.requestId, amount: new Prisma.Decimal(v.amount).mul(v.kind === "REFUND" ? -1 : 1), method: v.method, reference: v.reference || null, note: v.note || null } });
      await tx.tripRegistration.update({ where: { id: registration.id }, data: { paymentStatus: ledgerStatus(net + delta, expectedPayment(registration.trip, registration.companions), v.kind === "REFUND") } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refresh(); return done("Ledger entry recorded. Payment status updated.");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return fail("Another payment changed this ledger. Please retry.");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return done("This payment was already recorded.");
    return fail(error instanceof Error && ["Registration no longer exists.", "Refund cannot exceed the receipts recorded in this ledger."].includes(error.message) ? error.message : "Payment could not be recorded. Please retry.");
  }
}

export async function saveAttendance(id: string, count: number): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("Admin access required.");
  if (!Number.isInteger(count) || count < 0) return fail("Enter a whole number of travellers.");
  const registration = await prisma.tripRegistration.findUnique({ where: { id }, include: { trip: { include: { registrations: true } } } });
  if (!registration || count > registration.partySize) return fail("Count must fit this registration.");
  const confirmed = splitRoster(registration.trip.registrations, registration.trip.maxCapacity).confirmed;
  if (!confirmed.some((r) => r.id === id)) return fail("Waitlisted registrations cannot check in.");
  await prisma.tripRegistration.update({ where: { id }, data: { checkedInCount: count } }); refresh(); return done("Attendance saved.");
}

export async function saveCarpool(id: string, matched: boolean): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("Admin access required.");
  if (typeof matched !== "boolean") return fail("Invalid carpool status.");
  const updated = await prisma.tripRegistration.updateMany({ where: { id, carpoolChoice: "NEED_RIDE" }, data: { carpoolMatched: matched } });
  if (!updated.count) return fail("Ride request no longer exists.");
  refresh(); return done("Carpool coordination updated.");
}

export async function saveTaskDetails(id: string, input: unknown): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("Admin access required.");
  const parsed = z.object({ title: z.string().trim().min(3).max(160), ownerId: z.string(), dueAt: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), "Choose a valid date.") }).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  if (v.ownerId && !await prisma.user.findFirst({ where: { id: v.ownerId, role: "ADMIN" } })) return fail("Choose an organiser.");
  const updated = await prisma.tripTask.updateMany({ where: { id }, data: { title: v.title, ownerId: v.ownerId || null, dueAt: v.dueAt ? new Date(v.dueAt + "T00:00:00+05:30") : null } });
  if (!updated.count) return fail("Task no longer exists.");
  refresh(); return done("Task details saved.");
}

export async function resolveIncident(id: string, actionTaken: string, close: boolean): Promise<ActionResult> {
  if (!(await getAdmin())) return fail("Admin access required.");
  if (typeof actionTaken !== "string" || actionTaken.trim().length < 5 || actionTaken.length > 4000 || typeof close !== "boolean") return fail("Describe the follow-up action (5–4000 characters).");
  const updated = await prisma.tripIncident.updateMany({ where: { id }, data: { actionTaken: actionTaken.trim(), closedAt: close ? new Date() : null } });
  if (!updated.count) return fail("Incident no longer exists.");
  refresh(); return done(close ? "Incident resolved." : "Follow-up saved; incident open.");
}
