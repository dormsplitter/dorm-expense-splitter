import type { Expense, Settlement } from './types';

export interface Balance {
  slot: number;
  net: number; // positive = owed money, negative = owes money
}

export interface SettlementPlan {
  from_slot: number;
  to_slot: number;
  amount: number;
}

export function computeBalances(
  expenses: Expense[],
  settlements: Settlement[],
  slots: number[]
): Balance[] {
  const net: Record<number, number> = {};
  slots.forEach((s) => (net[s] = 0));

  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    const participants = Array.isArray(e.participants) ? e.participants : [];
    if (participants.length === 0) continue;
    const share = amount / participants.length;
    const payer = Number(e.payer_slot) || 0;
    net[payer] = (net[payer] || 0) + amount;
    for (const p of participants) {
      net[p] = (net[p] || 0) - share;
    }
  }

  for (const s of settlements) {
    const amt = Number(s.amount) || 0;
    net[s.from_slot] = (net[s.from_slot] || 0) + amt;
    net[s.to_slot] = (net[s.to_slot] || 0) - amt;
  }

  return slots.map((slot) => ({ slot, net: net[slot] }));
}

// Greedy debt-minimization: pair biggest debtors with biggest creditors.
export function minimizeSettlements(balances: Balance[]): SettlementPlan[] {
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ slot: b.slot, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ slot: b.slot, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const plan: SettlementPlan[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.005) {
      plan.push({
        from_slot: debtors[i].slot,
        to_slot: creditors[j].slot,
        amount: Math.round(pay * 100) / 100,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount <= 0.005) i++;
    if (creditors[j].amount <= 0.005) j++;
  }
  return plan;
}

export function totalSpending(expenses: Expense[]): number {
  return (expenses ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

export function youOweSummary(balances: Balance[]): { owes: number; owed: number } {
  let owes = 0;
  let owed = 0;
  for (const b of balances) {
    if (b.net < -0.005) owes += -b.net;
    if (b.net > 0.005) owed += b.net;
  }
  return { owes, owed };
}
