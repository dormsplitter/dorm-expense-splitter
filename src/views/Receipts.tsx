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
                  <ArrowRight className="h-4 w-4 text-slate-600" />
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
