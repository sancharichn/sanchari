import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ user: vi.fn(), upsert: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mock.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { tripInterest: { upsert: mock.upsert, deleteMany: mock.remove } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveTripInterest, withdrawTripInterest } from "./trip-interest";
beforeEach(() => { vi.resetAllMocks(); mock.user.mockResolvedValue({ id: "member" }); });
describe("planning interest", () => {
  it("requires sign-in for changes", async () => {
    mock.user.mockResolvedValue(null);
    expect((await saveTripInterest({})).ok).toBe(false);
    expect((await withdrawTripInterest()).ok).toBe(false);
    expect(mock.upsert).not.toHaveBeenCalled(); expect(mock.remove).not.toHaveBeenCalled();
  });
  it("rejects invalid group sizes and missing consent", async () => {
    for (const partySize of [0, 21, 1.5, "invalid"]) expect((await saveTripInterest({ partySize, note: "", consent: "on" })).ok).toBe(false);
    expect((await saveTripInterest({ partySize: 2, note: "" })).ok).toBe(false);
    expect(mock.upsert).not.toHaveBeenCalled();
  });
  it("upserts only the signed-in member and fixed journey", async () => {
    expect((await saveTripInterest({ partySize: "3", note: " May ", consent: "on", userId: "other", journey: "other" })).ok).toBe(true);
    expect(mock.upsert).toHaveBeenCalledWith({ where: { journey_userId: { journey: "sri-lanka-2027", userId: "member" } }, create: { journey: "sri-lanka-2027", userId: "member", partySize: 3, note: "May" }, update: { partySize: 3, note: "May" } });
  });
  it("withdraws only the member's own interest", async () => {
    expect((await withdrawTripInterest()).ok).toBe(true);
    expect(mock.remove).toHaveBeenCalledWith({ where: { journey: "sri-lanka-2027", userId: "member" } });
  });
});
