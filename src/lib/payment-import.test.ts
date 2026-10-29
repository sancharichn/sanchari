import { describe, expect, it } from "vitest";
import { importedPaymentSchema, normalizePaymentRows, parseCsv } from "./payment-import";

describe("fund spreadsheet import", () => {
  it("parses quoted CSV and maps friendly Excel headers", () => {
    const rows = parseCsv('Registration ID,Email,Traveller,Amount INR,Entry type,Method,Reference,Received date,Note\r\nreg-1,member@example.com,"Child, One",500,receipt,UPI,UTR-1,2026-10-29,"Deposit, first"');
    expect(normalizePaymentRows(rows[0], rows.slice(1))[0]).toMatchObject({ registrationId: "reg-1", traveller: "Child, One", amount: "500", kind: "receipt", receivedDate: "2026-10-29" });
  });
  it("requires a booking identity, traveller, valid method and ISO date", () => {
    expect(importedPaymentSchema.safeParse({ email: "member@example.com", traveller: "Member", amount: "1200.50", kind: "RECEIPT", method: "BANK", receivedDate: "2026-10-29" }).success).toBe(true);
    expect(importedPaymentSchema.safeParse({ traveller: "Member", amount: "1200", kind: "RECEIPT", method: "CARD", receivedDate: "29/10/2026" }).success).toBe(false);
    expect(importedPaymentSchema.safeParse({ email: "member@example.com", traveller: "Member", amount: "1200", kind: "RECEIPT", method: "UPI", receivedDate: "2026-02-31" }).success).toBe(false);
  });
});
