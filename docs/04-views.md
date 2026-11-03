# 04 — Views

---

### src/views/Dashboard.tsx

```tsx
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
```

---

### src/views/Roommates.tsx

```tsx
import { useState } from 'react';
import { KeyRound, X, Check, ShieldCheck } from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { Avatar } from '@/components/Avatar';
import { PinPad } from '@/components/PinPad';
import { ROOM_NUMBER } from '@/lib/format';

interface RoommatesProps {
  app: AppContext;
}

export function Roommates({ app }: RoommatesProps) {
  const { session, roommates } = app;
  const [changePinOpen, setChangePinOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Roommate Profiles</h1>
        <p className="text-sm text-slate-400">Live-synced names, rooms, and status for all 12 slots.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roommates.map((rm) => {
          const isYou = session?.slot === rm.slot;
          const isSetup = !!rm.registered;
          return (
            <div
              key={rm.slot}
              className={`rounded-2xl border p-5 transition-all duration-200 ${
                isYou
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <Avatar slot={rm.slot} name={rm.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-white">
                      {rm.name ?? `Student ${rm.slot}`}
                    </h3>
                    {isYou && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {rm.registered ? `Room ${ROOM_NUMBER}` : 'Not set up'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        isSetup
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSetup ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      {isSetup ? 'Active' : 'Open slot'}
                    </span>
                    <span className="text-[11px] text-slate-500">Slot {rm.slot}</span>
                  </div>
                </div>
              </div>

              {isYou && (
                <button
                  onClick={() => setChangePinOpen(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-amber-500/50 hover:text-amber-400 active:scale-[0.98]"
                >
                  <KeyRound className="h-4 w-4" />
                  Change My PIN
                </button>
              )}
            </div>
          );
        })}
      </div>

      {changePinOpen && session && (
        <ChangePinModal
          app={app}
          slot={session.slot}
          onClose={() => setChangePinOpen(false)}
        />
      )}
    </div>
  );
}

function ChangePinModal({
  app,
  slot,
  onClose,
}: {
  app: AppContext;
  slot: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'current' | 'new' | 'done'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCurrent = (pin: string) => {
    setError(null);
    setCurrentPin(pin);
    setStep('new');
  };

  const handleNew = async (pin: string) => {
    setBusy(true);
    setError(null);
    try {
      await app.changePin(slot, currentPin, pin);
      setNewPin(pin);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change PIN');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <KeyRound className="h-5 w-5 text-amber-400" />
            Change PIN
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'current' && (
          <div className="flex flex-col items-center">
            <p className="mb-5 text-sm text-slate-400">Enter your current PIN</p>
            <PinPad label="Current PIN" onSubmit={handleCurrent} />
            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {step === 'new' && (
          <div className="flex flex-col items-center">
            <p className="mb-5 text-sm text-slate-400">Enter your new 4-digit PIN</p>
            <PinPad label="New PIN" onSubmit={handleNew} />
            {busy && <p className="mt-4 text-sm text-sky-400">Saving…</p>}
            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-center text-sm text-slate-300">
              Your PIN has been updated successfully.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secured with 4-digit PIN
            </div>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-semibold text-white transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### src/views/ExpenseLog.tsx

```tsx
import { useState } from 'react';
import { Plus, Check, Receipt as ReceiptIcon, Users } from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { CATEGORIES, type Category } from '@/lib/types';
import { formatNaira, formatDate } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { LockedBadge } from '@/components/LockedBadge';

interface ExpenseLogProps {
  app: AppContext;
}

export function ExpenseLog({ app }: ExpenseLogProps) {
  const { session, roommates, expenses } = app;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Groceries');
  const [payerSlot, setPayerSlot] = useState<number>(session?.slot ?? 1);
  const [participants, setParticipants] = useState<number[]>(session ? [session.slot] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nameFor = (slot: number) => roommates.find((r) => r.slot === slot)?.name ?? `Student ${slot}`;
  const isSetup = (slot: number) => !!roommates.find((r) => r.slot === slot)?.name;

  const toggleParticipant = (slot: number) => {
    setParticipants((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const slots = roommates.map((r) => r.slot);

  const selectAll = () => {
    const all = roommates.filter((r) => r.name).map((r) => r.slot);
    setParticipants(all.length > 0 ? all : slots);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (participants.length === 0) {
      setError('Select at least one participant to split with.');
      return;
    }
    setBusy(true);
    try {
      await app.addExpense({
        title: title.trim(),
        amount: Math.round(amt * 100) / 100,
        category,
        payer_slot: payerSlot,
        participants,
      });
      setTitle('');
      setAmount('');
      setSuccess('Expense logged and synced successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log expense');
    } finally {
      setBusy(false);
    }
  };

  const recent = [...(expenses ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Expense Log</h1>
        <p className="text-sm text-slate-400">Log a new shared expense — synced to the backend instantly.</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        <div className="space-y-5">
          {/* Title + Amount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Costco grocery run"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Amount (₦)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95 ${
                    category === cat
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payer */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Paid by</label>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setPayerSlot(slot)}
                  disabled={!isSetup(slot)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                    payerSlot === slot
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20'
                      : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-white disabled:opacity-30'
                  }`}
                >
                  <Avatar slot={slot} name={nameFor(slot)} size="sm" />
                  {nameFor(slot)}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <Users className="h-4 w-4 text-emerald-400" />
                Split between ({participants.length})
              </label>
              <button
                onClick={selectAll}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                Select all active
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const selected = participants.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleParticipant(slot)}
                    disabled={!isSetup(slot)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                      selected
                        ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
                        : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-white disabled:opacity-30'
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {nameFor(slot)}
                  </button>
                );
              })}
            </div>
            {participants.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Each pays {formatNaira(parseFloat(amount || '0') / participants.length)}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {busy ? 'Logging…' : 'Log Expense'}
          </button>
        </div>
      </div>

      {/* Recent expenses */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ReceiptIcon className="h-5 w-5 text-sky-400" />
            Recent Expenses
          </h2>
          <LockedBadge />
        </div>
        <div className="space-y-2.5">
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-center text-slate-500">
              <p className="text-sm">No expenses logged yet.</p>
            </div>
          ) : (
            recent.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3.5"
              >
                <Avatar slot={e.payer_slot} name={nameFor(e.payer_slot)} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{e.title}</p>
                  <p className="text-xs text-slate-400">
                    {nameFor(e.payer_slot)} paid · {e.category} · {(e.participants ?? []).length} split ·{' '}
                    {formatDate(e.created_at)}
                  </p>
                </div>
                <span className="shrink-0 text-base font-bold text-white">{formatNaira(e.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### src/views/CartView.tsx

```tsx
import { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Check, ArrowLeftRight, ShoppingBag } from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { formatNaira, formatDate } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { CATEGORIES, type Category } from '@/lib/types';

interface CartViewProps {
  app: AppContext;
}

export function CartView({ app }: CartViewProps) {
  const { session, roommates, cart } = app;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  // Convert-to-expense state
  const [convertOpen, setConvertOpen] = useState(false);
  const [convCategory, setConvCategory] = useState<Category>('Groceries');
  const [convPayer, setConvPayer] = useState<number>(session?.slot ?? 1);
  const [convParticipants, setConvParticipants] = useState<number[]>(session ? [session.slot] : []);
  const [convBusy, setConvBusy] = useState(false);
  const [convSuccess, setConvSuccess] = useState<string | null>(null);

  const slots = roommates.map((r) => r.slot);
  const nameFor = (slot: number) => roommates.find((r) => r.slot === slot)?.name ?? `Student ${slot}`;
  const isSetup = (slot: number) => !!roommates.find((r) => r.slot === slot)?.name;

  const cartTotal = (cart ?? []).reduce((sum, c) => sum + (Number(c.price) || 0) * (Number(c.quantity) || 0), 0);
  const checkedItems = (cart ?? []).filter((c) => c.checked);
  const checkedTotal = checkedItems.reduce((sum, c) => sum + (Number(c.price) || 0) * (Number(c.quantity) || 0), 0);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Enter an item name.');
      return;
    }
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) {
      setError('Enter a valid price.');
      return;
    }
    const q = parseInt(quantity) || 1;
    if (q < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (!session) return;
    try {
      await app.addCartItem({
        name: name.trim(),
        price: Math.round(p * 100) / 100,
        quantity: q,
        added_by: session.slot,
      });
      setName('');
      setPrice('');
      setQuantity('1');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item');
    }
  };

  const toggleParticipant = (slot: number) => {
    setConvParticipants((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const selectAll = () => {
    const all = roommates.filter((r) => r.name).map((r) => r.slot);
    setConvParticipants(all.length > 0 ? all : slots);
  };

  const handleConvert = async () => {
    if (checkedItems.length === 0) return;
    if (convParticipants.length === 0) return;
    setConvBusy(true);
    setError(null);
    try {
      const title = checkedItems.map((c) => c.name).join(', ');
      await app.addExpense({
        title,
        amount: Math.round(checkedTotal * 100) / 100,
        category: convCategory,
        payer_slot: convPayer,
        participants: convParticipants,
      });
      await app.removeCheckedCartItems();
      setConvSuccess('Cart converted to a split expense successfully!');
      setConvertOpen(false);
      setConvParticipants(session ? [session.slot] : []);
      setTimeout(() => setConvSuccess(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed');
    } finally {
      setConvBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <ShoppingCart className="h-6 w-6 text-emerald-400" />
          Collaborative Shopping Cart
        </h1>
        <p className="text-sm text-slate-400">
          Anyone can add items. Check them off, then convert into a split expense with one tap.
        </p>
      </div>

      {convSuccess && (
        <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          {convSuccess}
        </p>
      )}

      {/* Add item form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Paper towels)"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="₦ Price"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-28"
          />
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-20"
          />
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}
        <button
          onClick={handleAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Add to Cart
        </button>
      </div>

      {/* Cart items */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShoppingBag className="h-5 w-5 text-sky-400" />
            Cart Items ({(cart ?? []).length})
          </h2>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{formatNaira(cartTotal)}</p>
            <p className="text-[11px] text-slate-500">
              {checkedItems.length} checked · {formatNaira(checkedTotal)}
            </p>
          </div>
        </div>

        {(cart ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-slate-500">
            <ShoppingCart className="h-8 w-8 opacity-40" />
            <p className="text-sm">Cart is empty. Add items above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(cart ?? []).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                  item.checked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <button
                  onClick={() => app.toggleCartItem(item.id, !item.checked)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90 ${
                    item.checked
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-600 bg-slate-800 text-transparent hover:border-emerald-500/50'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>
                <Avatar slot={item.added_by} name={nameFor(item.added_by)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${item.checked ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Added by {nameFor(item.added_by)} · {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-white">
                    {formatNaira(item.price * item.quantity)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.quantity}× {formatNaira(item.price)}
                  </p>
                </div>
                <button
                  onClick={() => app.removeCartItem(item.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convert to expense */}
      {checkedItems.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Convert {checkedItems.length} checked item{checkedItems.length > 1 ? 's' : ''} to a split expense
              </p>
              <p className="text-xs text-slate-400">Total: {formatNaira(checkedTotal)}</p>
            </div>
            <button
              onClick={() => setConvertOpen(!convertOpen)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-95"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Convert
            </button>
          </div>

          {convertOpen && (
            <div className="mt-5 space-y-4 border-t border-slate-700/50 pt-5">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setConvCategory(cat)}
                      className={`rounded-xl px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                        convCategory === cat
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                          : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payer */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Paid by</label>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setConvPayer(slot)}
                      disabled={!isSetup(slot)}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition active:scale-95 ${
                        convPayer === slot
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                          : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      <Avatar slot={slot} name={nameFor(slot)} size="sm" />
                      {nameFor(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Split between ({convParticipants.length})
                  </label>
                  <button
                    onClick={selectAll}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Select all active
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const selected = convParticipants.includes(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => toggleParticipant(slot)}
                        disabled={!isSetup(slot)}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition active:scale-95 ${
                          selected
                            ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                            : 'border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {nameFor(slot)}
                      </button>
                    );
                  })}
                </div>
                {convParticipants.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Each pays {formatNaira(checkedTotal / convParticipants.length)}
                  </p>
                )}
              </div>

              <button
                onClick={handleConvert}
                disabled={convBusy || convParticipants.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowLeftRight className="h-5 w-5" />
                {convBusy ? 'Converting…' : `Confirm & Log ${formatNaira(checkedTotal)} Expense`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### src/views/Receipts.tsx

```tsx
import { useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Lock,
} from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { minimizeSettlements, type Balance } from '@/lib/settlement';
import { formatNaira, formatDate, ROOM_NUMBER } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { LockedBadge } from '@/components/LockedBadge';

interface ReceiptsProps {
  app: AppContext;
}

export function Receipts({ app }: ReceiptsProps) {
  const { session, roommates, expenses, settlements, balances: balancesById } = app;

  const nameFor = (slot: number) => roommates.find((r) => r.slot === slot)?.name ?? `Student ${slot}`;

  const balances: Balance[] = useMemo(
    () => roommates.map((r) => ({ slot: r.slot, net: Number(balancesById?.[String(r.slot)] ?? 0) })),
    [balancesById, roommates]
  );

  const settlementPlan = useMemo(() => minimizeSettlements(balances), [balances]);

  const sorted = [...(expenses ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const [settling, setSettling] = useState<string | null>(null);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  const handleSettle = async (from: number, to: number, amount: number) => {
    if (!session || session.slot !== from) return;
    const key = `${from}-${to}-${amount}`;
    setSettling(key);
    try {
      await app.addSettlement({ from_slot: from, to_slot: to, amount });
      setSettledIds((prev) => new Set([...prev, key]));
    } catch {
      // ignore for now
    } finally {
      setSettling(null);
    }
  };

  const printReceipt = (expenseId: string) => {
    const el = document.getElementById(`receipt-${expenseId}`);
    if (!el) return;
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${expenseId}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
            .receipt { max-width: 380px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            .sub { color: #94a3b8; font-size: 12px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
            .row span:first-child { color: #94a3b8; }
            .row span:last-child { font-weight: 600; }
            .total { display: flex; justify-content: space-between; padding-top: 16px; margin-top: 8px; font-size: 18px; font-weight: 700; }
            .share { margin-top: 16px; padding: 12px; background: #0f172a; border-radius: 12px; font-size: 13px; }
            .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #64748b; }
            .badge { display: inline-block; margin-top: 12px; padding: 4px 10px; background: #334155; border-radius: 99px; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>${el.innerHTML}
          <div class="footer">
            <div class="badge">Records locked for accountability. Admin edit only.</div>
            <p style="margin-top:12px;">DormSplit - Digital Receipt</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <FileText className="h-6 w-6 text-sky-400" />
          Receipts & Ledger
        </h1>
        <p className="text-sm text-slate-400">
          Printable digital receipts and automated debt-minimization settlement plan.
        </p>
      </div>

      {/* Settlement preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
          <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
          Settlement Preview
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Debt-minimized plan — the fewest transactions to settle all balances.
        </p>

        {settlementPlan.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-800/40 py-10 text-slate-500">
            <Check className="h-8 w-8 text-emerald-400" />
            <p className="text-sm">Everyone is settled up. No payments needed.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {settlementPlan.map((plan, idx) => {
              const key = `${plan.from_slot}-${plan.to_slot}-${plan.amount}`;
              const canSettle = session?.slot === plan.from_slot;
              const settled = settledIds.has(key);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3"
                >
                  <Avatar slot={plan.from_slot} name={nameFor(plan.from_slot)} size="sm" />
                  <span className="text-sm text-slate-300">{nameFor(plan.from_slot)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                  <Avatar slot={plan.to_slot} name={nameFor(plan.to_slot)} size="sm" />
                  <span className="text-sm text-slate-300">{nameFor(plan.to_slot)}</span>
                  <span className="ml-auto text-sm font-bold text-emerald-400">
                    {formatNaira(plan.amount)}
                  </span>
                  {settled ? (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <Check className="h-3 w-3" /> Settled
                    </span>
                  ) : canSettle ? (
                    <button
                      onClick={() => handleSettle(plan.from_slot, plan.to_slot, plan.amount)}
                      disabled={settling === key}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-emerald-400 hover:to-teal-500 active:scale-95 disabled:opacity-50"
                    >
                      {settling === key ? '…' : 'Settle'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-600">Awaiting</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past settlements */}
      {(settlements ?? []).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Settlement History</h2>
          <div className="space-y-2.5">
            {[...(settlements ?? [])]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3"
                >
                  <Avatar slot={s.from_slot} name={nameFor(s.from_slot)} size="sm" />
                  <span className="text-sm text-slate-300">{nameFor(s.from_slot)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                  <Avatar slot={s.to_slot} name={nameFor(s.to_slot)} size="sm" />
                  <span className="text-sm text-slate-300">{nameFor(s.to_slot)}</span>
                  <div className="ml-auto text-right">
                    <span className="text-sm font-bold text-emerald-400">{formatNaira(s.amount)}</span>
                    <p className="text-[11px] text-slate-500">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Receipt cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Digital Receipts</h2>
          <LockedBadge />
        </div>
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-center text-slate-500">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">No receipts yet. Log an expense to generate one.</p>
            </div>
          ) : (
            sorted.map((e) => {
              const share = e.amount / (e.participants?.length || 1);
              return (
                <div
                  key={e.id}
                  id={`receipt-${e.id}`}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
                >
                  {/* Receipt header */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/30 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-400" />
                      <span className="text-sm font-semibold text-white">Receipt #{e.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(e.created_at)}</span>
                  </div>

                  {/* Receipt body */}
                  <div className="px-5 py-4">
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-white">{e.title}</h3>
                      <span className="inline-block mt-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-medium text-sky-400">
                        {e.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Paid by</span>
                        <span className="font-medium text-white">{nameFor(e.payer_slot)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total amount</span>
                        <span className="font-bold text-white">{formatNaira(e.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Split between</span>
                        <span className="font-medium text-white">{(e.participants ?? []).length} people</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Per person</span>
                        <span className="font-medium text-emerald-400">{formatNaira(share)}</span>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="mt-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Lock className="h-3 w-3" />
                        Split participants
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(e.participants ?? []).map((slot) => (
                          <div
                            key={slot}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2 py-1"
                          >
                            <Avatar slot={slot} name={nameFor(slot)} size="sm" />
                            <span className="text-xs text-slate-300">{nameFor(slot)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Print button */}
                  <div className="border-t border-slate-800 px-5 py-3">
                    <button
                      onClick={() => printReceipt(e.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-400 transition hover:bg-sky-500/20 active:scale-[0.98]"
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt / Export PDF
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```
