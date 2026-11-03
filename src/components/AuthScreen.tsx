import { useState } from 'react';
import { Home, ShieldCheck, KeyRound, UserPlus, LogIn } from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { PinPad } from '@/components/PinPad';
import { Avatar } from '@/components/Avatar';
import { NeedsSetupSignal, NeedsLoginSignal, ApiError } from '@/lib/api';
import { ROOM_NUMBER } from '@/lib/format';

interface AuthScreenProps {
  app: AppContext;
}

type Mode = 'select' | 'setup' | 'login';

export function AuthScreen({ app }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Setup form fields
  const [masterKey, setMasterKey] = useState('');
  const [name, setName] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupPinConfirm, setSetupPinConfirm] = useState('');

  const roommatesBySlot = (slot: number) => app.roommates.find((r) => r.slot === slot);

  const handleSlotSelect = async (slot: number) => {
    setSelectedSlot(slot);
    setError(null);
    setBusy(true);
    try {
      // Probe the slot by calling login with an empty PIN.
      await app.checkSlot(slot);
      // If checkSlot resolves without throwing, the slot is open for registration.
      setMode('setup');
    } catch (e) {
      if (e instanceof NeedsSetupSignal) {
        setMode('setup');
      } else if (e instanceof NeedsLoginSignal) {
        setMode('login');
      } else if (e instanceof Error) {
        setError(e.message);
        setMode('select');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLoginPin = async (pin: string) => {
    if (!selectedSlot) return;
    setBusy(true);
    setError(null);
    try {
      await app.login(selectedSlot, pin);
    } catch (e) {
      if (e instanceof NeedsSetupSignal) {
        setMode('setup');
        return;
      }
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSetupSubmit = async () => {
    if (!selectedSlot) return;
    if (masterKey !== '1234') {
      setError('Invalid Master Key.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }
    if (setupPin !== setupPinConfirm) {
      setError('PINs do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await app.setup({
        master_key: masterKey,
        slot: selectedSlot,
        name: name.trim(),
        pin: setupPin,
      });
    } catch (e) {
      // 409 means the slot is already registered — switch to PIN login.
      if (e instanceof ApiError && e.status === 409) {
        setMode('login');
        setError('This slot is already set up, enter your PIN.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Setup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/20">
            <Home className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">DormSplit</h1>
            <p className="text-sm text-slate-400">Shared Expense Splitter — {app.roommates.length} Students</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {mode === 'select' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold text-white">Pick your slot</h2>
              <p className="mb-5 text-sm text-slate-400">
                Tap your slot (1–{app.roommates.length}) to sign in or register.
              </p>
              {busy && (
                <p className="mb-4 text-sm text-sky-400">Checking slot…</p>
              )}
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {app.roommates.map((rm) => {
                  const slot = rm.slot;
                  const taken = !!rm?.registered;
                  const displayName = rm?.name || (taken ? `Student ${slot}` : `Slot ${slot}`);
                  return (
                    <button
                      key={slot}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={busy}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95 disabled:opacity-50 ${
                        taken
                          ? 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50'
                          : 'border-slate-700 bg-slate-800/30 hover:border-sky-500/50'
                      }`}
                    >
                      <Avatar slot={slot} name={rm?.name ?? null} size="sm" />
                      <span className="text-[11px] font-medium text-slate-300">
                        {displayName}
                      </span>
                      <span
                        className={`text-[10px] ${
                          taken ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {taken ? 'Login' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {error && (
                <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
              )}
            </div>
          )}

          {mode === 'login' && selectedSlot && (
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
                className="mb-4 self-start text-sm text-slate-400 hover:text-white"
              >
                ← Back to slots
              </button>
              <Avatar slot={selectedSlot} name={roommatesBySlot(selectedSlot)?.name ?? null} size="lg" />
              <h2 className="mt-3 text-lg font-semibold text-white">
                {roommatesBySlot(selectedSlot)?.name ?? `Student ${selectedSlot}`}
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Room {ROOM_NUMBER} · Slot {selectedSlot}
              </p>
              <PinPad label="Enter your 4-digit PIN" onSubmit={handleLoginPin} />
              {busy && <p className="mt-4 text-sm text-sky-400">Verifying…</p>}
              {error && <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}
            </div>
          )}

          {mode === 'setup' && selectedSlot && (
            <div>
              <button
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
                className="mb-4 text-sm text-slate-400 hover:text-white"
              >
                ← Back to slots
              </button>
              <div className="mb-5 flex items-center gap-3">
                <Avatar slot={selectedSlot} name={null} size="md" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Set up Slot {selectedSlot}</h2>
                  <p className="text-sm text-slate-400">First time here — let's register you.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Master Key
                  </label>
                  <input
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Enter Master Key"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                    <UserPlus className="h-4 w-4 text-sky-400" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                      <KeyRound className="h-4 w-4 text-amber-400" />
                      4-digit PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={setupPin}
                      onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-center text-lg tracking-widest text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 text-sm font-medium text-slate-300">Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={setupPinConfirm}
                      onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-center text-lg tracking-widest text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
                )}

                <button
                  onClick={handleSetupSubmit}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50"
                >
                  <LogIn className="h-5 w-5" />
                  {busy ? 'Setting up…' : 'Create Account & Log In'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Connected to live backend at group3member.pythonanywhere.com
        </p>
      </div>
    </div>
  );
}
