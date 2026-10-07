import { z } from "zod";
import { readCompanions } from "./family";
import { toPaise } from "./format";

export const paymentInput = z.object({
  registrationId: z.string().min(1),
  requestId: z.string().uuid(),
  amount: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/).refine((v) => toPaise(v) > 0, "Enter a positive amount."),
  kind: z.enum(["RECEIPT", "REFUND"]),
  method: z.enum(["UPI", "BANK", "CASH"]),
  reference: z.string().trim().max(120),
  note: z.string().trim().max(500),
});

export function expectedPayment(trip: { adultBudgetEst: { toString(): string } | null; childBudgetEst: { toString(): string } | null; budgetEst: { toString(): string } | null }, companions: unknown) {
  const adult = trip.adultBudgetEst ?? trip.budgetEst;
  if (adult === null) return null;
  const child = trip.childBudgetEst ?? adult;
  return readCompanions(companions).reduce((sum, person) => sum + toPaise(person.age < 18 ? child : adult), toPaise(adult));
}

export function ledgerStatus(net: number, expected: number | null, refunded: boolean) {
  if (net === 0) return refunded ? "REFUNDED" : "PENDING";
  return expected !== null && net >= expected ? "PAID" : "PARTIAL";
}
