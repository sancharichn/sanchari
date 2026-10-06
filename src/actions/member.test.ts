import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(), findTrip: vi.fn(), updateUser: vi.fn(), createRegistration: vi.fn(), findRoster: vi.fn(), transaction: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.currentUser }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  trip: { findUnique: mocks.findTrip }, user: { update: mocks.updateUser },
  tripRegistration: { create: mocks.createRegistration, findMany: mocks.findRoster },
  $transaction: mocks.transaction,
} }));
import { registerForTrip } from "./member";

const input = {
  phone: "9840012345", emergencyContact: "Sample contact 9840054321", bloodGroup: "", vehicleDetails: "", agreesToGuidelines: true,
  companions: [{ name: "Sample Child", age: "8", relationship: "Child", bloodGroup: "" }], familyConsent: true, parentalConsent: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.currentUser.mockResolvedValue({ id: "signed-in-parent" });
  mocks.findTrip.mockResolvedValue({ id: "trip", status: "OPEN", startDate: new Date("2099-01-01"), maxCapacity: 4 });
  mocks.updateUser.mockResolvedValue({});
  mocks.createRegistration.mockResolvedValue({ id: "registration" });
  mocks.transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations));
  mocks.findRoster.mockResolvedValue([{ id: "registration", partySize: 2, createdAt: new Date() }]);
});

describe("registerForTrip families", () => {
  it("requires sign-in before reading or storing any family details", async () => {
    mocks.currentUser.mockResolvedValue(null);
    expect((await registerForTrip("trip", input)).ok).toBe(false);
    expect(mocks.createRegistration).not.toHaveBeenCalled();
    expect(mocks.findTrip).not.toHaveBeenCalled();
  });
  it("validates parental consent on the server even if client validation is bypassed", async () => {
    expect((await registerForTrip("trip", { ...input, parentalConsent: false })).ok).toBe(false);
    expect(mocks.createRegistration).not.toHaveBeenCalled();
  });
  it("derives party size, stores validated family details and uses the signed-in adult", async () => {
    expect((await registerForTrip("trip", { ...input, partySize: 1, userId: "another-user" })).ok).toBe(true);
    expect(mocks.createRegistration).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: "signed-in-parent", partySize: 2,
      companions: [{ name: "Sample Child", age: 8, relationship: "Child", bloodGroup: null }],
      familyConsentAt: expect.any(Date), parentalConsentAt: expect.any(Date),
    }) });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
  it("does not create a family that can never fit this trip", async () => {
    mocks.findTrip.mockResolvedValue({ id: "trip", status: "OPEN", startDate: new Date("2099-01-01"), maxCapacity: 1 });
    expect((await registerForTrip("trip", input)).ok).toBe(false);
    expect(mocks.createRegistration).not.toHaveBeenCalled();
  });
  it("reports the whole family's waitlist position when remaining capacity is insufficient", async () => {
    mocks.findRoster.mockResolvedValue([
      { id: "earlier", partySize: 3, createdAt: new Date(1) },
      { id: "registration", partySize: 2, createdAt: new Date(2) },
    ]);
    expect(await registerForTrip("trip", input)).toMatchObject({ ok: true, message: expect.stringContaining("waitlist at number 1") });
  });
});
