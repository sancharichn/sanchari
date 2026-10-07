import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ admin: null as null | { id: string }, user: null as null | { id: string } }));
vi.mock("@/lib/session", () => ({ getAdmin: async () => state.admin, getCurrentUser: async () => state.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { prisma: new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL }) };
});
import { prisma } from "@/lib/prisma";
import { recordPayment, saveAttendance, resolveIncident, saveTaskDetails, saveCarpool } from "./operations";
import { createTripTask, createTripIncident, removeRegistration } from "./admin";
import { updateProfile } from "./member";

const enabled = Boolean(process.env.TEST_DATABASE_URL?.includes("localhost") && process.env.TEST_DATABASE_URL?.includes("verify"));
describe.skipIf(!enabled)("real local database operational workflows", () => {
  let adminId: string, memberId: string, tripId: string, registrationId: string;
  beforeAll(async () => {
    const suffix = crypto.randomUUID();
    const admin = await prisma.user.create({ data: { email: "admin-" + suffix + "@example.test", role: "ADMIN" } });
    const member = await prisma.user.create({ data: { email: "member-" + suffix + "@example.test" } });
    adminId = admin.id; memberId = member.id; state.admin = { id: adminId }; state.user = { id: memberId };
    const trip = await prisma.trip.create({ data: { title: "Integration departure", description: "Isolated test", startDate: new Date("2099-01-01"), endDate: new Date("2099-01-02"), location: "Test", maxCapacity: 2, adultBudgetEst: "1000", childBudgetEst: "500" } }); tripId = trip.id;
    const registration = await prisma.tripRegistration.create({ data: { tripId, userId: memberId, partySize: 2, carpoolChoice: "NEED_RIDE", companions: [{ name: "Child", age: 8, relationship: "Child" }] } }); registrationId = registration.id;
  });
  afterAll(async () => {
    await prisma.paymentEvent.deleteMany({ where: { tripId } }); await prisma.tripRegistration.deleteMany({ where: { tripId } });
    await prisma.trip.delete({ where: { id: tripId } }); await prisma.user.deleteMany({ where: { id: { in: [adminId, memberId] } } }); await prisma.$disconnect();
  });
  it("enforces admin access before payment or attendance writes", async () => {
    state.admin = null;
    expect((await recordPayment({})).ok).toBe(false); expect((await saveAttendance(registrationId, 1)).ok).toBe(false);
    state.admin = { id: adminId };
  });
  it("records once, derives paid status, rejects excess refund and protects ledger deletion", async () => {
    const input = { registrationId, requestId: crypto.randomUUID(), amount: "1500", kind: "RECEIPT", method: "UPI", reference: "TEST", note: "" };
    expect((await recordPayment(input)).ok).toBe(true); expect((await recordPayment(input)).ok).toBe(true);
    expect(await prisma.paymentEvent.count({ where: { registrationId } })).toBe(1);
    expect((await prisma.tripRegistration.findUniqueOrThrow({ where: { id: registrationId } })).paymentStatus).toBe("PAID");
    expect((await recordPayment({ ...input, requestId: crypto.randomUUID(), kind: "REFUND", amount: "1501" })).ok).toBe(false);
    expect((await recordPayment({ ...input, requestId: crypto.randomUUID(), kind: "REFUND", amount: "500" })).ok).toBe(true);
    expect((await prisma.tripRegistration.findUniqueOrThrow({ where: { id: registrationId } })).paymentStatus).toBe("PARTIAL");
    expect((await removeRegistration(registrationId)).ok).toBe(false);
  });
  it("saves partial family attendance and ride coordination", async () => {
    expect((await saveAttendance(registrationId, 3)).ok).toBe(false);
    expect((await saveAttendance(registrationId, 1)).ok).toBe(true);
    expect((await saveCarpool(registrationId, true)).ok).toBe(true);
    expect(await prisma.tripRegistration.findUniqueOrThrow({ where: { id: registrationId } })).toMatchObject({ checkedInCount: 1, carpoolMatched: true });
  });
  it("persists task assignment/deadline and incident resolution", async () => {
    expect((await createTripTask(tripId, "Confirm transport")).ok).toBe(true);
    const task = await prisma.tripTask.findFirstOrThrow({ where: { tripId } });
    expect((await saveTaskDetails(task.id, { title: "Transport confirmed", ownerId: adminId, dueAt: "2026-10-10" })).ok).toBe(true);
    expect((await createTripIncident(tripId, "Bus delayed", "Replacement arranged", "MEDIUM")).ok).toBe(true);
    const incident = await prisma.tripIncident.findFirstOrThrow({ where: { tripId } });
    expect((await resolveIncident(incident.id, "Replacement reached pickup point.", true)).ok).toBe(true);
    expect((await prisma.tripIncident.findUniqueOrThrow({ where: { id: incident.id } })).closedAt).not.toBeNull();
  });
  it("keeps family IDs stable and does not modify another account's family", async () => {
    const base = { phone: "9840012345", emergencyContact: "Ravi 9840012345", bloodGroup: "", birthdayDay: "", birthdayMonth: "", image: "" };
    expect((await updateProfile({ ...base, familyMembers: [{ name: "Child", relationship: "Child", birthdayMonth: 2, birthdayDay: 29 }] })).ok).toBe(true);
    const family = await prisma.familyMember.findFirstOrThrow({ where: { userId: memberId } });
    expect((await updateProfile({ ...base, familyMembers: [{ ...family, name: "New name" }] })).ok).toBe(true);
    expect((await prisma.familyMember.findFirstOrThrow({ where: { userId: memberId } })).id).toBe(family.id);
  });
});
