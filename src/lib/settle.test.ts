import { describe, expect, it } from "vitest";
import { computeBalances, settleUp } from "./settle";

describe("computeBalances", () => {
  it("splits the total equally and the shares add up exactly", () => {
    const result = computeBalances(["a", "b", "c"], [{ paidById: "a", amountPaise: 1000 }]);
    expect(result.total).toBe(1000);
    const shares = result.balances.map((b) => b.share);
    expect(shares.reduce((s, x) => s + x, 0)).toBe(1000);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });

  it("balances always sum to zero", () => {
    const result = computeBalances(
      ["a", "b", "c", "d"],
      [
        { paidById: "a", amountPaise: 123457 },
        { paidById: "c", amountPaise: 9999 },
        { paidById: "z", amountPaise: 50000 }, // the organiser, not travelling
      ],
    );
    expect(result.balances.reduce((s, b) => s + b.balance, 0)).toBe(0);
    expect(result.balances.find((b) => b.userId === "z")).toMatchObject({ share: 0, balance: 50000 });
  });

  it("has nothing to split with no travellers", () => {
    const result = computeBalances([], [{ paidById: "a", amountPaise: 500 }]);
    expect(result.perHead).toBe(0);
    expect(result.balances).toEqual([{ userId: "a", paid: 500, share: 0, balance: 500 }]);
  });
});

describe("settleUp", () => {
  it("pays everyone back exactly with at most n − 1 transfers", () => {
    const { balances } = computeBalances(
      ["a", "b", "c", "d"],
      [
        { paidById: "a", amountPaise: 400000 },
        { paidById: "b", amountPaise: 100000 },
      ],
    );
    const transfers = settleUp(balances);
    expect(transfers.length).toBeLessThanOrEqual(3);

    const net = new Map<string, number>();
    for (const t of transfers) {
      net.set(t.from, (net.get(t.from) ?? 0) + t.amount);
      net.set(t.to, (net.get(t.to) ?? 0) - t.amount);
    }
    for (const b of balances) expect((net.get(b.userId) ?? 0) + b.balance).toBe(0);
  });

  it("does nothing when everyone is square", () => {
    const { balances } = computeBalances(["a", "b"], [
      { paidById: "a", amountPaise: 500 },
      { paidById: "b", amountPaise: 500 },
    ]);
    expect(settleUp(balances)).toEqual([]);
  });
});
