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
