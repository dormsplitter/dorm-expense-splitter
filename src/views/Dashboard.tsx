import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  ArrowRight,
  ArrowLeftRight,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { totalSpending, youOweSummary, type Balance } from '@/lib/settlement';
import { formatNaira, formatDate, ROOM_NUMBER } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { LockedBadge } from '@/components/LockedBadge';

interface DashboardProps {
  app: AppContext;
}

export function Dashboard({ app }: DashboardProps) {
  const { session, expenses, settlements, roommates, balances: balancesById } = app;

  const balances: Balance[] = useMemo(
    () => roommates.map((r) => ({ slot: r.slot, net: Number(balancesById?.[String(r.slot)] ?? 0) })),
    [balancesById, roommates]
  );

  const total = useMemo(() => totalSpending(expenses), [expenses]);

  const { owes, owed } = useMemo(() => youOweSummary(balances), [balances]);

  const myBalance = session
    ? balances.find((b) => b.slot === session.slot)?.net ?? 0
    : 0;

  const nameFor = (slot: number) => roommates.find((r) => r.slot === slot)?.name ?? `Student ${slot}`;

  // Activity log: merge expenses + settlements, sorted newest first
  const activity = useMemo(() => {
    const items: Array<
      | { type: 'expense'; date: string; slot: number; text: string; amount: number }
      | { type: 'settlement'; date: string; slot: number; text: string; amount: number }
    > = [
      ...(expenses ?? []).map((e) => ({
        type: 'expense' as const,
        date: e.created_at,
        slot: e.payer_slot,
        text: `logged "${e.title}" (${e.category})`,
        amount: e.amount,
      })),
      ...(settlements ?? []).map((s) => ({
        type: 'settlement' as const,
        date: s.created_at,
        slot: s.from_slot,
        text: `settled with ${nameFor(s.to_slot)}`,
        amount: s.amount,
      })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [expenses, settlements, roommates]);

  const settledCount = (settlements ?? []).length;

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total spending */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Dorm Spending</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{formatNaira(total)}</p>
          <p className="mt-1 text-xs text-slate-500">{(expenses ?? []).length} expenses logged</p>
        </div>

        {/* You are owed */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">You are owed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatNaira(Math.max(myBalance, 0))}</p>
          <p className="mt-1 text-xs text-slate-500">From roommates</p>
        </div>

        {/* You owe */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">You owe</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15">
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">{formatNaira(Math.abs(Math.min(myBalance, 0)))}</p>
          <p className="mt-1 text-xs text-slate-500">To roommates</p>
        </div>

        {/* Settlements */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Settlements</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
              <ArrowLeftRight className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{settledCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNaira(settledCount > 0 ? (settlements ?? []).reduce((s, x) => s + (Number(x.amount) || 0), 0) : 0)} settled
          </p>
        </div>
      </div>

      {/* Balance cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Individual Balances</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {balances.map((b) => {
            const rm = roommates.find((r) => r.slot === b.slot);
            const isYou = session?.slot === b.slot;
            const positive = b.net > 0.005;
            const negative = b.net < -0.005;
            return (
              <div
                key={b.slot}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  isYou
                    ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar slot={b.slot} name={rm?.name ?? null} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {rm?.name ?? `Slot ${b.slot}`}
                      {isYou && <span className="ml-1 text-[10px] text-emerald-400">(You)</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {rm?.registered ? `Room ${ROOM_NUMBER}` : 'Not set up'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {positive && (
                    <p className="text-lg font-bold text-emerald-400">{formatNaira(b.net)}</p>
                  )}
                  {negative && (
                    <p className="text-lg font-bold text-red-400">{formatNaira(b.net)}</p>
                  )}
                  {!positive && !negative && (
                    <p className="text-lg font-bold text-slate-400">{formatNaira(0)}</p>
                  )}
                  <p className={`text-[11px] ${positive ? 'text-emerald-400/70' : negative ? 'text-red-400/70' : 'text-slate-500'}`}>
                    {positive ? 'is owed' : negative ? 'owes' : 'all settled'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity log */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Activity className="h-5 w-5 text-emerald-400" />
            Activity Log
          </h2>
          <LockedBadge />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
              <ReceiptIcon className="h-8 w-8 opacity-40" />
              <p className="text-sm">No activity yet. Log an expense to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/70">
              {activity.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 px-4 py-3">
                  <Avatar slot={item.slot} name={nameFor(item.slot)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-white">{nameFor(item.slot)}</span>{' '}
                      <span className="text-slate-400">{item.text}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">{formatDate(item.date)}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      item.type === 'expense' ? 'text-sky-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatNaira(item.amount)}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Settlement summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">Dorm-wide Owed</h3>
          <p className="text-2xl font-bold text-emerald-400">{formatNaira(owed)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">Dorm-wide Owes</h3>
          <p className="text-2xl font-bold text-red-400">{formatNaira(owes)}</p>
        </div>
      </div>
    </div>
  );
}
