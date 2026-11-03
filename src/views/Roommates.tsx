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
