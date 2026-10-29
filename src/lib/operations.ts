import { z } from "zod";
import { readCompanions } from "./family";
import { toPaise } from "./format";

const ymd = /^\d{4}-\d{2}-\d{2}$/;
const validYmd = (value: string) => {
  if (!ymd.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const paymentInput = z.object({
  registrationId: z.string().min(1),
  requestId: z.string().uuid(),
  amount: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/).refine((v) => toPaise(v) > 0, "Enter a positive amount."),
  kind: z.enum(["RECEIPT", "REFUND"]),
  method: z.enum(["UPI", "BANK", "CASH", "OTHER"]),
  reference: z.string().trim().max(120),
  note: z.string().trim().max(500),
  travellerKey: z.string().trim().max(80).optional().transform((value) => value || null),
  receivedDate: z.string().refine(validYmd, "Choose a valid date when funds were received.").optional(),
});

export type TripPrices = { adultBudgetEst: { toString(): string } | null; childBudgetEst: { toString(): string } | null; under5BudgetEst?: { toString(): string } | null; budgetEst: { toString(): string } | null };
export type TravellerCharge = { key: string; name: string; age: number | null; category: "ADULT" | "CHILD_5_12" | "UNDER_5"; expected: number };

export function travellerCharges(trip: TripPrices, leadName: string, companions: unknown, snapshot?: unknown): TravellerCharge[] {
  const saved = z.array(z.object({ key: z.string(), name: z.string(), age: z.number().int().nullable(), category: z.enum(["ADULT", "CHILD_5_12", "UNDER_5"]), expected: z.number().int().nonnegative() })).safeParse(snapshot);
  if (saved.success && saved.data.length) return saved.data;
  const adult = trip.adultBudgetEst ?? trip.budgetEst ?? null;
  if (adult === null) return [];
  const child = trip.childBudgetEst ?? adult;
  const under5 = trip.under5BudgetEst ?? 0;
  return [
    { key: "lead", name: leadName, age: null, category: "ADULT", expected: toPaise(adult) },
    ...readCompanions(companions).map((person, index): TravellerCharge => person.age < 5
      ? { key: `companion:${index}`, name: person.name, age: person.age, category: "UNDER_5", expected: toPaise(under5) }
      : person.age <= 12
        ? { key: `companion:${index}`, name: person.name, age: person.age, category: "CHILD_5_12", expected: toPaise(child) }
        : { key: `companion:${index}`, name: person.name, age: person.age, category: "ADULT", expected: toPaise(adult) }),
  ];
}

export function expectedPayment(trip: TripPrices, companions: unknown, snapshot?: unknown) {
  const charges = travellerCharges(trip, "Registering adult", companions, snapshot);
  return charges.length ? charges.reduce((sum, person) => sum + person.expected, 0) : null;
}

export function ledgerStatus(net: number, expected: number | null, refunded: boolean) {
  if (net === 0) return refunded ? "REFUNDED" : "PENDING";
  return expected !== null && net >= expected ? "PAID" : "PARTIAL";
}
