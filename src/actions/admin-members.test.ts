import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  admin: vi.fn(), findUser: vi.fn(), countUsers: vi.fn(), updateUser: vi.fn(), findFamily: vi.fn(), deleteFamily: vi.fn(), updateFamily: vi.fn(), createFamily: vi.fn(), tripCount: vi.fn(), orderCount: vi.fn(),
}));
vi.mock("@/lib/action-audit", () => ({ withAudit: (action: () => unknown) => action() }));
vi.mock("@/lib/session", () => ({ getAdmin: mock.admin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: vi.fn(async (callback) => callback({ user: { update: mock.updateUser }, familyMember: { findMany: mock.findFamily, deleteMany: mock.deleteFamily, update: mock.updateFamily, create: mock.createFamily } })),
  user: { findUnique: mock.findUser, count: mock.countUsers, update: mock.updateUser }, familyMember: { deleteMany: mock.deleteFamily },
  tripRegistration: { count: mock.tripCount, updateMany: vi.fn() }, shopOrder: { count: mock.orderCount, updateMany: vi.fn() },
  feedbackResponse: { deleteMany: vi.fn() }, feedback: { deleteMany: vi.fn() }, tripInterest: { deleteMany: vi.fn() }, staffTrip: { deleteMany: vi.fn() }, notification: { updateMany: vi.fn() }, tripMessageDelivery: { updateMany: vi.fn() }, birthdayDelivery: { deleteMany: vi.fn() },
} }));
import { deleteMemberByAdmin, updateMemberByAdmin } from "./admin-members";

const input = { id: "member", name: "Member", email: "member@example.com", image: "", role: "MEMBER", staffRole: "", phone: "9876543210", bloodGroup: "O+", emergencyContact: "Friend 9876543211", birthdayMonth: "2", birthdayDay: "29", whatsappOptIn: false, whatsappNumber: "", preferredTripKinds: [], travelPace: "", homeArea: "", familyMembers: [] };

beforeEach(() => {
  vi.resetAllMocks(); mock.admin.mockResolvedValue({ id: "admin" }); mock.findUser.mockResolvedValue({ id: "member", role: "MEMBER", email: "member@example.com", deletedAt: null }); mock.findFamily.mockResolvedValue([]); mock.tripCount.mockResolvedValue(0); mock.orderCount.mockResolvedValue(0);
});

describe("admin member editing", () => {
  it("requires administrator access", async () => { mock.admin.mockResolvedValue(null); expect((await updateMemberByAdmin(input)).ok).toBe(false); expect(mock.updateUser).not.toHaveBeenCalled(); });
  it("updates profile fields and family through the member owner", async () => {
    const result = await updateMemberByAdmin({ ...input, familyMembers: [{ name: "Child", relationship: "Child", birthdayMonth: "3", birthdayDay: "12", image: "" }] });
    expect(result.ok).toBe(true); expect(mock.updateUser).toHaveBeenCalled(); expect(mock.createFamily).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "member", name: "Child", relationship: "Child" }) });
  });
  it("prevents an administrator from removing their own access", async () => { mock.admin.mockResolvedValue({ id: "member" }); mock.findUser.mockResolvedValue({ id: "member", role: "ADMIN", deletedAt: null }); expect((await updateMemberByAdmin(input)).ok).toBe(false); });
});

describe("admin member deletion", () => {
  it("blocks self deletion and unresolved travel", async () => { expect((await deleteMemberByAdmin("admin")).ok).toBe(false); mock.tripCount.mockResolvedValue(1); expect((await deleteMemberByAdmin("member")).ok).toBe(false); expect(mock.updateUser).not.toHaveBeenCalled(); });
  it("anonymises an eligible member", async () => { const result = await deleteMemberByAdmin("member"); expect(result.ok).toBe(true); expect(mock.updateUser).toHaveBeenCalledWith({ where: { id: "member" }, data: expect.objectContaining({ name: "Removed member", deletedAt: expect.any(Date), phone: null }) }); });
});
