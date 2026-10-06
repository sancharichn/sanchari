import { describe, expect, it } from "vitest";
import { countTravellers, readCompanions } from "./family";
import { registrationSchema } from "./validation";
import { rosterPosition, seatSummary, splitRoster } from "./trips";
import { computeBalances } from "./settle";
import { FAMILY_ROSTER_HEADERS, registrationCsvRows } from "./family-roster";
import { toCsv } from "./csv";

const solo = { phone: "9840012345", emergencyContact: "Emergency contact 9840054321", bloodGroup: "", vehicleDetails: "", agreesToGuidelines: true };
const person = { name: "Sample Child", age: "7", relationship: "Child", bloodGroup: "" };
const family = { ...solo, companions: [person], familyConsent: true, parentalConsent: true };
const reg = (id: string, size: number, order: number) => ({ id, partySize: size, createdAt: new Date(order) });

describe("family input and privacy", () => {
  it("retains legacy solo registration and accepts babies without a birth date", () => {
    expect(registrationSchema.parse(solo).companions).toEqual([]);
    expect(registrationSchema.parse({ ...family, companions: [{ ...person, age: "0" }] }).companions[0].age).toBe(0);
  });
  it("rejects blank, fractional, negative and implausible ages", () => {
    for (const age of ["", " ", null, undefined, true, "seven", "-1", "7.5", "121"]) {
      expect(registrationSchema.safeParse({ ...family, companions: [{ ...person, age }] }).success, String(age)).toBe(false);
    }
  });
  it("requires family permission and parental supervision for minors", () => {
    expect(registrationSchema.safeParse({ ...family, familyConsent: false }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...family, parentalConsent: false }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...family, companions: [{ ...person, age: "18" }], parentalConsent: false }).success).toBe(true);
  });
  it("limits family size and strips forged party size and unknown personal fields", () => {
    expect(registrationSchema.safeParse({ ...family, companions: Array(20).fill(person) }).success).toBe(false);
    const parsed = registrationSchema.parse({ ...family, partySize: 1, companions: [{ ...person, passport: "should not be saved" }] });
    expect(parsed).not.toHaveProperty("partySize");
    expect(parsed.companions[0]).not.toHaveProperty("passport");
  });
  it("reads stored null blood groups and does not expose malformed entries", () => {
    expect(readCompanions([{ ...person, age: 7, bloodGroup: null }])).toHaveLength(1);
    expect(readCompanions([{ name: "incomplete" }])).toEqual([]);
  });
});

describe("family seats", () => {
  const roster = [reg("solo", 1, 1), reg("family", 3, 2), reg("later", 1, 3)];
  it("keeps a family together and preserves FIFO even when a spare seat exists", () => {
    const result = splitRoster(roster, 3);
    expect(result.confirmed.map((r) => r.id)).toEqual(["solo"]);
    expect(result.waitlisted.map((r) => r.id)).toEqual(["family", "later"]);
    expect(countTravellers(result.waitlisted)).toBe(4);
    expect(seatSummary(5, 3, 1)).toMatchObject({ taken: 1, waitlist: 4, left: 2 });
  });
  it("promotes a whole family when enough seats become available", () => {
    expect(rosterPosition(roster, 3, "family")).toEqual({ kind: "waitlist", place: 1 });
    expect(rosterPosition(roster.slice(1), 3, "family")).toEqual({ kind: "confirmed" });
    expect(rosterPosition(roster.slice(1), 3, "later")).toEqual({ kind: "waitlist", place: 1 });
  });
  it("counts all members when the family exactly fills the remaining capacity", () => {
    const result = splitRoster(roster, 4);
    expect(countTravellers(result.confirmed)).toBe(4);
    expect(result.waitlisted.map((r) => r.id)).toEqual(["later"]);
  });
});

describe("family accounts and roster export", () => {
  it("splits by person and aggregates the family's share onto its adult without losing paise", () => {
    const result = computeBalances(["family", "solo"], [{ paidById: "solo", amountPaise: 1001 }], { family: 3, solo: 1 });
    expect(result.travellers).toBe(4);
    expect(result.balances.find((b) => b.userId === "family")?.share).toBe(751);
    expect(result.balances.reduce((sum, b) => sum + b.share, 0)).toBe(1001);
    expect(result.balances.reduce((sum, b) => sum + b.balance, 0)).toBe(0);
  });
  it("exports every child with their adult's contact and protects spreadsheet cells", () => {
    const now = new Date("2026-10-06T00:00:00Z");
    const rows = registrationCsvRows({ id: "family", partySize: 2, companions: [{ ...person, name: "=FORMULA()", age: 7 }], paymentStatus: "PENDING", gearChecked: false, vehicleDetails: null, carpoolChoice: "NONE", carpoolLocation: null, carpoolSeats: null, createdAt: now, agreedToGuidelinesAt: now, familyConsentAt: now, parentalConsentAt: now, user: { name: "Sample Parent", email: "parent@example.test", phone: "9840012345", emergencyContact: "Sample Contact", bloodGroup: null } }, "Seat");
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === FAMILY_ROSTER_HEADERS.length)).toBe(true);
    expect(rows[1]).toContain("Child");
    expect(rows[1]).toContain("parent@example.test");
    expect(toCsv(rows)).toContain("'=FORMULA()");
  });
});
