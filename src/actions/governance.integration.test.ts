import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ id: "", send: vi.fn(), whatsapp: vi.fn(), configured: true }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: async () => { const { prisma } = await import("@/lib/prisma"); const user = state.id ? await prisma.user.findUnique({ where: { id: state.id } }) : null; return user && !user.deletedAt ? { user } : null; } }));
vi.mock("@/lib/gmail", () => ({ gmailConfigured: () => state.configured, sendBirthdayEmail: state.send }));
vi.mock("@/lib/whatsapp", async importOriginal => ({ ...await importOriginal<object>(), whatsappConfigured: () => false, sendPromotionWhatsapp: state.whatsapp }));
import { auditedTransaction, prisma } from "@/lib/prisma";
import { assignStaff, requestDeletion, reviewDataRequest, saveWhatsappPreference } from "./governance";
import { cancelRegistration } from "./member";
import { saveAttendance, recordPayment, saveFeedbackFollowUp } from "./operations";
import { createTripTask } from "./admin";
import { deliverPromotions } from "@/lib/notifications";
import { GET as exportData } from "@/app/api/member/export/route";
import { POST as webhook } from "@/app/api/webhooks/whatsapp/route";
import { createHmac } from "node:crypto";

const enabled = Boolean(process.env.TEST_DATABASE_URL?.includes("localhost") && process.env.TEST_DATABASE_URL?.includes("verify") && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL);
describe.skipIf(!enabled)("staff, audit, notification and privacy integration", () => {
  const users: string[] = [], trips: string[] = [];
  let admin: string, finance: string, leader: string, moderator: string, member: string, waiter: string, deletable: string, registration: string, waitingRegistration: string, feedbackId: string;
  beforeAll(async () => {
    process.env.TRIP_EMAILS_ENABLED = "true"; process.env.NEXTAUTH_URL = "https://example.test"; process.env.WHATSAPP_APP_SECRET = "test-secret";
    for (const role of ["ADMIN", "FINANCE", "LEADER", "MODERATOR", "MEMBER", "MEMBER", "MEMBER"]) {
      const user = await prisma.user.create({ data: { email: crypto.randomUUID()+"@example.test", name: role, role: role === "ADMIN" ? "ADMIN" : "MEMBER", staffRole: ["FINANCE", "LEADER", "MODERATOR"].includes(role) ? role : null } }); users.push(user.id);
    }
    [admin,finance,leader,moderator,member,waiter,deletable] = users;
    for (let i=0;i<2;i++) { const trip = await prisma.trip.create({ data: { title: "Governance test", description: "Test", location: "Test", status: "OPEN", startDate: new Date("2099-01-01"), endDate: new Date("2099-01-02"), maxCapacity: 1, adultBudgetEst: "100" } }); trips.push(trip.id); }
    await prisma.staffTrip.create({ data: { userId: leader, tripId: trips[0] } });
    registration = (await prisma.tripRegistration.create({ data: { tripId: trips[0], userId: member, createdAt: new Date(1) } })).id;
    waitingRegistration = (await prisma.tripRegistration.create({ data: { tripId: trips[0], userId: waiter, createdAt: new Date(2) } })).id;
    const form = await prisma.feedbackForm.create({ data: { tripId: trips[0] } });
    feedbackId = (await prisma.feedbackResponse.create({ data: { formId: form.id, tripId: trips[0], anonymous: true, overall: 4, comeAgain: "YES", ratings: {}, dedupeKey: crypto.randomUUID() } })).id;
  });
  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: users } } });
    await prisma.dataRequest.deleteMany({ where: { userId: { in: users } } });
    await prisma.cancellation.deleteMany({ where: { tripId: { in: trips } } });
    await prisma.feedbackResponse.deleteMany({ where: { tripId: { in: trips } } });
    await prisma.paymentEvent.deleteMany({ where: { tripId: { in: trips } } });
    await prisma.tripRegistration.deleteMany({ where: { tripId: { in: trips } } });
    await prisma.trip.deleteMany({ where: { id: { in: trips } } });
    await prisma.activityLog.deleteMany({ where: { actorId: { in: users } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
  });
  it("restricts role actions and assigned trip scope, including revocation", async () => {
    state.id = finance;
    expect((await saveAttendance(registration,1)).ok).toBe(false);
    expect((await saveFeedbackFollowUp(feedbackId,"RESOLVED","Done")).ok).toBe(false);
    state.id = moderator;
    expect((await saveFeedbackFollowUp(feedbackId,"RESOLVED","Done")).ok).toBe(true);
    expect((await recordPayment({})).ok).toBe(false);
    state.id = leader;
    expect((await createTripTask(trips[0],"Allowed task")).ok).toBe(true);
    expect((await createTripTask(trips[1],"Forbidden task")).ok).toBe(false);
    expect((await saveAttendance(registration,1)).ok).toBe(true);
    expect((await assignStaff({ userId: member, role: "FINANCE", tripIds: [] })).ok).toBe(false);
    state.id = admin;
    expect((await assignStaff({ userId: leader, role: "", tripIds: [] })).ok).toBe(true);
    state.id = leader;
    expect((await createTripTask(trips[0],"Revoked task")).ok).toBe(false);
  });
  it("writes who changed what and rolls back changes and audit rows together", async () => {
    const log = await prisma.activityLog.findFirstOrThrow({ where: { actorId: leader, entity: "tripRegistration" } });
    expect(log.changedFields).toContain("checkedInCount"); expect(log.before).toMatchObject({ checkedInCount: 0 }); expect(log.after).toMatchObject({ checkedInCount: 1 });
    const before = await prisma.trip.findUniqueOrThrow({ where: { id: trips[0] } });
    await expect(auditedTransaction(admin, async () => { await prisma.trip.update({ where: { id: trips[0] }, data: { title: "Should roll back" } }); throw new Error("forced audit workflow failure"); })).rejects.toThrow();
    expect((await prisma.trip.findUniqueOrThrow({ where: { id: trips[0] } })).title).toBe(before.title);
    expect(await prisma.activityLog.count({ where: { entityId: trips[0], actorId: admin } })).toBe(0);

  });
  it("cancels atomically, promotes the waiter and sends once across concurrent workers", async () => {
    state.id = member;
    expect((await cancelRegistration(trips[0])).ok).toBe(true);
    expect(await prisma.cancellation.count({ where: { userId: member, wasConfirmed: true } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: waiter } })).toBe(2);
    await Promise.all([deliverPromotions(),deliverPromotions()]);
    expect(state.send).toHaveBeenCalledTimes(1);
    await deliverPromotions(); expect(state.send).toHaveBeenCalledTimes(1);
    expect(await prisma.notification.findFirst({ where: { userId: waiter, channel: "EMAIL" } })).toMatchObject({ status: "SENT" });
  });
  it("does not deliver stale promotions after cancellation", async () => {
    const key = `${waitingRegistration}:2:EMAIL`;
    await prisma.notification.create({ data: { key, registrationId: waitingRegistration, userId: waiter, tripId: trips[0], channel: "EMAIL", kind: "WAITLIST_PROMOTED" } });
    await deliverPromotions(); expect(state.send).toHaveBeenCalledTimes(1);
    expect(await prisma.notification.findUnique({ where: { key } })).toMatchObject({ status: "CANCELLED" });
  });
  it("exports only the current member's data and reviews deletion before anonymising", async () => {
    state.id = deletable;
    await prisma.familyMember.create({ data: { userId: deletable, name: "Private child", relationship: "Child", birthdayMonth: 2, birthdayDay: 3 } });
    await saveWhatsappPreference(true,"+919876543210");
    const response = await exportData(); const body = await response.json();
    expect(body.profile.familyMembers[0].name).toBe("Private child"); expect(body.registrations).toEqual([]); expect(body.profile).not.toHaveProperty("staffRole");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await requestDeletion("DELETE")).ok).toBe(true);
    const request = await prisma.dataRequest.findFirstOrThrow({ where: { userId: deletable, kind: "DELETE" } });
    expect((await reviewDataRequest(request.id,"COMPLETED","Reviewed all records.")).ok).toBe(false);
    state.id = admin;
    expect((await reviewDataRequest(request.id,"COMPLETED","Reviewed all records.")).ok).toBe(true);
    const removed = await prisma.user.findUniqueOrThrow({ where: { id: deletable } });
    expect(removed.name).toBe("Removed member"); expect(removed.deletedAt).not.toBeNull(); expect(removed.whatsappNumber).toBeNull();
    expect(await prisma.familyMember.count({ where: { userId: deletable } })).toBe(0);
    const logs = await prisma.activityLog.findMany({ where: { entity: "familyMember", actorId: admin } });
    expect(JSON.stringify(logs)).not.toContain("Private child");
    state.id = deletable; expect((await exportData()).status).toBe(401);
  });
  it("authenticates WhatsApp webhooks, preserves delivered status and honours STOP", async () => {
    await prisma.user.update({ where: { id: waiter }, data: { whatsappNumber: "919999999999", whatsappOptIn: true } });
    const notification = await prisma.notification.findFirstOrThrow({ where: { userId: waiter, channel: "WHATSAPP" } });
    await prisma.notification.update({ where: { id: notification.id }, data: { providerId: "wamid.test", status: "SENT" } });
    const send = async (status: string, valid=true) => { const raw = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: "wamid.test", status }], messages: [{ from: "919999999999", text: { body: "STOP" } }] } }] }] }); return webhook(new Request("https://example.test/api/webhooks/whatsapp", { method: "POST", body: raw, headers: { "x-hub-signature-256": valid ? "sha256="+createHmac("sha256","test-secret").update(raw).digest("hex") : "invalid" } })); };
    expect((await send("delivered",false)).status).toBe(403);
    expect((await send("delivered")).status).toBe(200); await send("sent");
    expect(await prisma.notification.findUnique({ where: { id: notification.id } })).toMatchObject({ status: "DELIVERED" });
    expect(await prisma.user.findUnique({ where: { id: waiter } })).toMatchObject({ whatsappOptIn: false });
  });
});
