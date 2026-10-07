import { describe, expect, it } from "vitest";
import { expectedPayment, ledgerStatus, paymentInput } from "./operations";
import { profileSchema } from "./validation";
import { escapeHtml, indiaBirthdayDate } from "./email-content";

describe("operational calculations", () => {
  it("prices adults and children separately, including free children", () => {
    const companions = [{ name: "Child", age: 8, relationship: "Child" }, { name: "Partner", age: 30, relationship: "Spouse" }];
    expect(expectedPayment({ adultBudgetEst: "1200.25", childBudgetEst: "500", budgetEst: null }, companions)).toBe(290050);
    expect(expectedPayment({ adultBudgetEst: "1200", childBudgetEst: "0", budgetEst: null }, companions)).toBe(240000);
    expect(expectedPayment({ adultBudgetEst: null, childBudgetEst: null, budgetEst: null }, [])).toBeNull();
  });
  it("does not mark an unknown price paid and handles refund status", () => {
    expect(ledgerStatus(100, null, false)).toBe("PARTIAL");
    expect(ledgerStatus(100, 100, false)).toBe("PAID");
    expect(ledgerStatus(0, 100, true)).toBe("REFUNDED");
  });
  it("rejects negative, imprecise and zero payment input", () => {
    const base = { registrationId: "a", requestId: "123e4567-e89b-42d3-a456-426614174000", kind: "RECEIPT", method: "UPI", reference: "", note: "" };
    for (const amount of ["0", "-1", "1.001", "Infinity", "1e9"]) expect(paymentInput.safeParse({ ...base, amount }).success).toBe(false);
    expect(paymentInput.safeParse({ ...base, amount: "1200.50" }).success).toBe(true);
  });
});
describe("birthday privacy and validation", () => {
  const base = { phone: "9840012345", emergencyContact: "Ravi 9840012345", bloodGroup: "" };
  it("allows entirely blank optional dates and images", () => {
    expect(profileSchema.parse({ ...base, birthdayMonth: "", birthdayDay: "", image: "" })).toMatchObject({ birthdayMonth: null, birthdayDay: null, image: null });
  });
  it("accepts leap day without birth year but rejects impossible family dates", () => {
    expect(profileSchema.safeParse({ ...base, birthdayMonth: 2, birthdayDay: 29 }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, familyMembers: [{ name: "Child", relationship: "Child", birthdayMonth: 4, birthdayDay: 31 }] }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, birthdayMonth: 2, birthdayDay: "" }).success).toBe(false);
  });
  it("uses India calendar dates and escapes email markup", () => {
    expect(indiaBirthdayDate(new Date("2026-12-31T20:00:00Z"))).toEqual({ year: 2027, month: 1, day: 1 });
    expect(escapeHtml('<img src="x">')).toBe("&lt;img src=&quot;x&quot;&gt;");
  });
});
