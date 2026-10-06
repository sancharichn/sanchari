/**
 * Splitting shared trip expenses. Everything is in integer paise so rupee
 * amounts never pick up floating-point drift.
 */

export type ExpenseLine = { paidById: string; amountPaise: number };

export type Balance = {
  userId: string;
  /** What this person paid for the group. */
  paid: number;
  /** Their equal share of everything spent. Zero for people who aren't travelling. */
  share: number;
  /** paid − share: positive means the group owes them, negative means they owe the group. */
  balance: number;
};

export type Transfer = { from: string; to: string; amount: number };

/**
 * Splits the total equally across the travellers. Leftover paise (when the
 * total doesn't divide evenly) go one each to the first travellers in a
 * stable order, so the shares always add up to the total exactly.
 */
export function computeBalances(travellerIds: string[], expenses: ExpenseLine[], partySizes: Record<string, number> = {}) {
  const travellers = [...new Set(travellerIds)].sort();
  const total = expenses.reduce((sum, e) => sum + e.amountPaise, 0);

  // Aggregate each family's equal per-person shares onto its registering adult.
  const sizes = new Map(travellers.map((id) => {
    const size = partySizes[id];
    return [id, Number.isInteger(size) && size > 0 ? size : 1] as const;
  }));
  const headCount = [...sizes.values()].reduce((sum, size) => sum + size, 0);
  const shares = new Map<string, number>();
  if (headCount > 0) {
    const base = Math.floor(total / headCount);
    let leftover = total - base * headCount;
    for (const id of travellers) {
      const size = sizes.get(id)!;
      const extra = Math.min(leftover, size);
      shares.set(id, base * size + extra);
      leftover -= extra;
    }
  }

  const paid = new Map<string, number>();
  for (const e of expenses) paid.set(e.paidById, (paid.get(e.paidById) ?? 0) + e.amountPaise);

  const everyone = [...new Set([...travellers, ...paid.keys()])].sort();
  const balances: Balance[] = everyone.map((userId) => {
    const p = paid.get(userId) ?? 0;
    const s = shares.get(userId) ?? 0;
    return { userId, paid: p, share: s, balance: p - s };
  });

  return {
    total,
    travellers: headCount,
    perHead: headCount > 0 ? Math.round(total / headCount) : 0,
    balances,
  };
}

/**
 * Who pays whom to even things out. Greedy: the biggest debtor pays the
 * biggest creditor until one of them is square. Needs at most n − 1 transfers.
 */
export function settleUp(balances: Balance[]): Transfer[] {
  const byAmount = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || a.id.localeCompare(b.id);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ id: b.userId, amount: -b.balance }))
    .sort(byAmount);
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ id: b.userId, amount: b.balance }))
    .sort(byAmount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0) transfers.push({ from: debtors[i].id, to: creditors[j].id, amount });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i += 1;
    if (creditors[j].amount === 0) j += 1;
  }
  return transfers;
}
