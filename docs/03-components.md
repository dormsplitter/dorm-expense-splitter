# 03 — Components

---

### src/components/ErrorBoundary.tsx

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  stack: string[];
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, stack: [], componentStack: null };

  static getDerivedStateFromError(error: Error): State {
    const stackLines = (error.stack ?? '').split('\n').slice(0, 8);
    return { hasError: false, error, stack: stackLines, componentStack: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const stackLines = (error.stack ?? '').split('\n').slice(0, 8);
    // Extract the first meaningful component name from the component stack.
    const componentMatch = (info.componentStack ?? '').match(/at\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : null;
    this.setState({
      hasError: true,
      error,
      stack: stackLines,
      componentStack: componentName,
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900/80 p-6 shadow-2xl">
            <h1 className="mb-2 text-lg font-bold text-red-400">Something went wrong</h1>
            {this.state.componentStack && (
              <p className="mb-2 text-sm font-medium text-amber-400">
                Component: {this.state.componentStack}
              </p>
            )}
            <p className="mb-4 break-words text-sm text-slate-200">{this.state.error.message}</p>
            {this.state.stack.length > 0 && (
              <pre className="overflow-x-auto rounded-xl bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-400">
                {this.state.stack.join('\n')}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-semibold text-white transition hover:from-emerald-400 hover:to-teal-500"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### src/components/Avatar.tsx

```tsx
import { avatarColor, initials } from '@/lib/format';

interface AvatarProps {
  slot: number;
  name: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function Avatar({ slot, name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(
        slot
      )} font-bold text-white shadow-lg shadow-black/20 ring-2 ring-white/10`}
    >
      {initials(name, slot)}
    </div>
  );
}
```

---

### src/components/LockedBadge.tsx

```tsx
import { Lock } from 'lucide-react';

export function LockedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-400 ${className}`}
    >
      <Lock className="h-3 w-3" />
      Records locked for accountability. Admin edit only.
    </span>
  );
}
```

---

### src/components/PinPad.tsx

```tsx
import { useState } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  length?: number;
  label?: string;
}

export function PinPad({ onSubmit, length = 4, label = 'Enter PIN' }: PinPadProps) {
  const [pin, setPin] = useState('');

  const press = (digit: string) => {
    if (pin.length < length) {
      const next = pin + digit;
      setPin(next);
      if (next.length === length) {
        setTimeout(() => {
          onSubmit(next);
          setPin('');
        }, 150);
      }
    }
  };

  const del = () => setPin(pin.slice(0, -1));

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <div className="flex gap-2.5">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition-colors duration-200 ${
              i < pin.length ? 'bg-emerald-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="h-16 w-20 rounded-2xl bg-slate-800 text-2xl font-semibold text-white transition-all duration-150 hover:bg-slate-700 active:scale-95"
          >
            {d}
          </button>
        ))}
        <div className="h-16 w-20" />
        <button
          onClick={() => press('0')}
          className="h-16 w-20 rounded-2xl bg-slate-800 text-2xl font-semibold text-white transition-all duration-150 hover:bg-slate-700 active:scale-95"
        >
          0
        </button>
        <button
          onClick={del}
          className="flex h-16 w-20 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 transition-all duration-150 hover:bg-slate-700 active:scale-95"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

---

### src/components/Layout.tsx

```tsx
import { LayoutDashboard, Users, Receipt, ShoppingCart, FileText, LogOut, Home } from 'lucide-react';
import type { AppContext } from '@/lib/useAppState';
import { Avatar } from '@/components/Avatar';
import { ROOM_NUMBER } from '@/lib/format';

export type ViewId = 'dashboard' | 'roommates' | 'expenses' | 'cart' | 'receipts';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'roommates', label: 'Roommates', icon: Users },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'receipts', label: 'Receipts', icon: FileText },
];

interface LayoutProps {
  app: AppContext;
  currentView: ViewId;
  onNavigate: (v: ViewId) => void;
  children: React.ReactNode;
}

export function Layout({ app, currentView, onNavigate, children }: LayoutProps) {
  const { session } = app;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Logo + title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="hidden text-lg font-bold text-white sm:block">DormSplit</span>
          </div>

          {/* Active user banner */}
          {session && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 py-1.5 pl-1.5 pr-3">
                <Avatar slot={session.slot} name={session.name} size="sm" />
                <div className="text-right">
                  <p className="text-sm font-semibold leading-tight text-white">{session.name}</p>
                  <p className="text-[11px] leading-tight text-slate-400">
                    Room {ROOM_NUMBER} · Slot {session.slot}
                  </p>
                </div>
              </div>
              <button
                onClick={app.logout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-400 active:scale-95"
                title="Log Out / Switch User"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body: sidebar (desktop) + main + bottom nav (mobile) */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar — desktop */}
        <aside className="sticky top-[76px] hidden h-[calc(100vh-100px)] w-56 shrink-0 lg:block">
          <nav className="flex flex-col gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-all ${
                  active ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
```

---

### src/components/AuthScreen.tsx

```tsx
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
```
