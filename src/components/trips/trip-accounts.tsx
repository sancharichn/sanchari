import { formatINR, paiseToRupees, toPaise } from "@/lib/format";
import { computeBalances } from "@/lib/settle";

type Props = {
  expenses: Array<{ amount: { toString(): string }; paidById: string }>;
  travellerIds: string[];
  travellerSizes?: Record<string, number>;
  viewerId: string;
  budgetEst: { toString(): string } | null;
  adultBudgetEst?: { toString(): string } | null;
  childBudgetEst?: { toString(): string } | null;
};

/** What the trip has cost so far, for the people on it. */
export function TripAccounts({ expenses, travellerIds, travellerSizes, viewerId, budgetEst, adultBudgetEst, childBudgetEst }: Props) {
  if (expenses.length === 0) return null;

  const accounts = computeBalances(
    travellerIds,
    expenses.map((e) => ({ paidById: e.paidById, amountPaise: toPaise(e.amount) })),
    travellerSizes,
  );
  const mine = accounts.balances.find((b) => b.userId === viewerId);

  return (
    <section aria-labelledby="accounts-heading">
      <h2 id="accounts-heading" className="stretch-semiwide text-2xl font-bold">
        Trip spending
      </h2>
      <p className="measure mt-3 text-lichen">Shared costs the organiser has logged so far, split across everyone with a seat.</p>
      <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-3">
        <Figure label="Spent so far" value={formatINR(paiseToRupees(accounts.total))} />
        <Figure
          label={`Per person, ${accounts.travellers} ${accounts.travellers === 1 ? "traveller" : "travellers"}`}
          value={accounts.travellers > 0 ? formatINR(paiseToRupees(accounts.perHead)) : "—"}
        />
        {(adultBudgetEst ?? budgetEst) ? <Figure label="Adult estimate" value={formatINR(adultBudgetEst ?? budgetEst!)} /> : null}
        {(childBudgetEst ?? adultBudgetEst ?? budgetEst) ? <Figure label="Child estimate" value={formatINR(childBudgetEst ?? adultBudgetEst ?? budgetEst!)} /> : null}
        {mine && mine.paid > 0 ? <Figure label="You paid for the group" value={formatINR(paiseToRupees(mine.paid))} /> : null}
      </dl>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="stretch-narrow mt-1 text-3xl font-bold tabular-nums text-mist">{value}</dd>
    </div>
  );
}
