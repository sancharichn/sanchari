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
export function computeBalances(travellerIds: string[], expenses: ExpenseLine[]) {
  const travellers = [...new Set(travellerIds)].sort();
  const total = expenses.reduce((sum, e) => sum + e.amountPaise, 0);

  const shares = new Map<string, number>();
  if (travellers.length > 0) {
    const base = Math.floor(total / travellers.length);
    let leftover = total - base * travellers.length;
    for (const id of travellers) {
      shares.set(id, base + (leftover > 0 ? 1 : 0));
      if (leftover > 0) leftover -= 1;
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
    travellers: travellers.length,
    perHead: travellers.length > 0 ? Math.round(total / travellers.length) : 0,
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
