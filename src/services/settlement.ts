import { Expense, Member, Payment } from '../types/trip';

/** One expense as it lands on one person: the sum, the heads, their slice. */
export interface ShareLine {
  expenseId: string;
  title: string;
  /** The whole bill, before it is cut up. */
  amount: number;
  /** How many people it was cut between. */
  sharers: number;
  /** What this person's slice came to — the rounding remainder included. */
  share: number;
}

/** An expense somebody fronted out of their own pocket. */
export interface PaidLine {
  expenseId: string;
  title: string;
  amount: number;
}

export interface Balance {
  memberId: string;
  paid: number;
  owes: number;
  net: number; // positive: is owed money, negative: still to pay
  /** Every bill this person is on, so the share can be shown as arithmetic. */
  shares: ShareLine[];
  /** Every bill this person paid for the group. */
  fronted: PaidLine[];
  /** Already handed over to someone else. */
  settledOut: number;
  /** Already received from someone else. */
  settledIn: number;
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
 *
 * Each balance carries the lines it was built from, not just the totals —
 * "you owe 6,667" is an instruction, "6,000 of the grill plus 667 of the
 * drinks" is something a person can check against their own memory.
 */
export function calculateBalances(
  expenses: Expense[],
  members: Member[],
  payments: Payment[] = []
): Balance[] {
  const participants = members.filter((m) => m.status !== 'declined');
  const fallback = members.filter((m) => m.status === 'confirmed');

  const paid = new Map<string, number>();
  const owes = new Map<string, number>();
  const shares = new Map<string, ShareLine[]>();
  const fronted = new Map<string, PaidLine[]>();
  participants.forEach((m) => {
    paid.set(m.id, 0);
    owes.set(m.id, 0);
    shares.set(m.id, []);
    fronted.set(m.id, []);
  });

  for (const expense of expenses) {
    paid.set(expense.payerId, (paid.get(expense.payerId) ?? 0) + expense.amount);
    fronted.get(expense.payerId)?.push({
      expenseId: expense.id,
      title: expense.title,
      amount: expense.amount,
    });

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
      const share = base + extra;
      owes.set(id, (owes.get(id) ?? 0) + share);
      shares.get(id)?.push({
        expenseId: expense.id,
        title: expense.title,
        amount: expense.amount,
        sharers: sharers.length,
        share,
      });
    }
  }

  // Settling up moves the debt, it does not change what the trip cost: paying
  // someone back counts the same as having chipped in that much yourself.
  const out = new Map<string, number>();
  const received = new Map<string, number>();
  for (const payment of payments) {
    if (out.has(payment.fromId) || paid.has(payment.fromId)) {
      out.set(payment.fromId, (out.get(payment.fromId) ?? 0) + payment.amount);
    }
    if (received.has(payment.toId) || paid.has(payment.toId)) {
      received.set(payment.toId, (received.get(payment.toId) ?? 0) + payment.amount);
    }
  }

  return participants.map((m) => {
    const p = paid.get(m.id) ?? 0;
    const o = owes.get(m.id) ?? 0;
    const settledOut = out.get(m.id) ?? 0;
    const settledIn = received.get(m.id) ?? 0;
    return {
      memberId: m.id,
      paid: p,
      owes: o,
      net: p - o + settledOut - settledIn,
      shares: shares.get(m.id) ?? [],
      fronted: fronted.get(m.id) ?? [],
      settledOut,
      settledIn,
    };
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
