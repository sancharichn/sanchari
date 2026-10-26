import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ user: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/action-audit", () => ({ withAudit: (action: () => unknown) => action() }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mock.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: mock.update } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { savePersonalization } from "./personalization";

beforeEach(() => { vi.resetAllMocks(); mock.user.mockResolvedValue({ id: "member" }); });

describe("member personalisation", () => {
  it("requires sign in and at least one preference", async () => {
    mock.user.mockResolvedValue(null);
    expect((await savePersonalization({ preferredTripKinds: ["TREK"], travelPace: "ACTIVE", homeArea: "Adyar" })).ok).toBe(false);
    mock.user.mockResolvedValue({ id: "member" });
    expect((await savePersonalization({ preferredTripKinds: [], travelPace: "", homeArea: "" })).ok).toBe(false);
    expect(mock.update).not.toHaveBeenCalled();
  });

  it("accepts only supported trip types and pace values", async () => {
    expect((await savePersonalization({ preferredTripKinds: ["UNKNOWN"], travelPace: "FAST", homeArea: "" })).ok).toBe(false);
    expect(mock.update).not.toHaveBeenCalled();
  });

  it("stores the signed-in member's choices", async () => {
    expect((await savePersonalization({ preferredTripKinds: ["TREK", "STAY_BACK"], travelPace: "ACTIVE", homeArea: "  Adyar  " })).ok).toBe(true);
    expect(mock.update).toHaveBeenCalledWith({ where: { id: "member" }, data: { preferredTripKinds: ["TREK", "STAY_BACK"], travelPace: "ACTIVE", homeArea: "Adyar", personalizationUpdatedAt: expect.any(Date) } });
  });
});
