import { Expense, Member } from '../types/trip';

export interface Balance {
  memberId: string;
  paid: number;
  owes: number;
  net: number; // positive: is owed money, negative: still to pay
}

export interface Transfer {
  fromId: string;
  toId: string;
  amount: number;
}

/**
 * What each person put in and what their share came to.
 *
 * An expense is shared by the people named on it. When nobody is named it
 * falls back to everyone who has confirmed they are coming, which is what
 * shared costs like the villa mean in practice.
 */
export function calculateBalances(
  expenses: Expense[],
  members: Member[]
): Balance[] {
  const participants = members.filter((m) => m.status !== 'declined');
  const fallback = members.filter((m) => m.status === 'confirmed');

  const paid = new Map<string, number>();
  const owes = new Map<string, number>();
  participants.forEach((m) => {
    paid.set(m.id, 0);
    owes.set(m.id, 0);
  });

  for (const expense of expenses) {
    paid.set(expense.payerId, (paid.get(expense.payerId) ?? 0) + expense.amount);

    const named = expense.splitBetween?.length
      ? expense.splitBetween
      : fallback.map((m) => m.id);
    const sharers = named.filter((id) => owes.has(id));
    if (sharers.length === 0) continue;

    // Give the rounding remainder to the first sharers so the shares add up
    // to the exact amount rather than drifting a baht at a time.
    const base = Math.floor(expense.amount / sharers.length);
    let remainder = expense.amount - base * sharers.length;
    for (const id of sharers) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      owes.set(id, (owes.get(id) ?? 0) + base + extra);
    }
  }

  return participants.map((m) => {
    const p = paid.get(m.id) ?? 0;
    const o = owes.get(m.id) ?? 0;
    return { memberId: m.id, paid: p, owes: o, net: p - o };
  });
}

/**
 * Turn the balances into the shortest list of transfers that clears them:
 * repeatedly send money from whoever owes most to whoever is owed most.
 *
 * That is a greedy answer rather than a provably minimal one, but for a group
 * this size it lands on the same handful of transfers and is easy to check by
 * eye — which matters more than optimality when everyone is settling up in a
 * car park.
 */
export function settleUp(balances: Balance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ id: b.memberId, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ id: b.memberId, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0) {
      transfers.push({ fromId: debtors[i].id, toId: creditors[j].id, amount });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i += 1;
    if (creditors[j].amount === 0) j += 1;
  }

  return transfers;
}
