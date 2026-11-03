# 02 — API, State, Types, and Entry Points

---

### src/vite-env.d.ts

```ts
/// <reference types="vite/client" />
```

---

### src/main.tsx

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

---

### src/App.tsx

```tsx
import { useState } from 'react';
import { useAppState } from '@/lib/useAppState';
import { AuthScreen } from '@/components/AuthScreen';
import { Layout, type ViewId } from '@/components/Layout';
import { Dashboard } from '@/views/Dashboard';
import { Roommates } from '@/views/Roommates';
import { ExpenseLog } from '@/views/ExpenseLog';
import { CartView } from '@/views/CartView';
import { Receipts } from '@/views/Receipts';
import { RefreshCw, AlertCircle } from 'lucide-react';

function App() {
  const app = useAppState();
  const [view, setView] = useState<ViewId>('dashboard');

  if (app.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading dorm data…</p>
        </div>
      </div>
    );
  }

  if (!app.session) {
    return <AuthScreen app={app} />;
  }

  return (
    <Layout app={app} currentView={view} onNavigate={setView}>
      {app.error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            Couldn't reach the live backend — showing locally cached data. Changes will sync when the
            connection is back.
          </p>
        </div>
      )}

      {view === 'dashboard' && <Dashboard app={app} />}
      {view === 'roommates' && <Roommates app={app} />}
      {view === 'expenses' && <ExpenseLog app={app} />}
      {view === 'cart' && <CartView app={app} />}
      {view === 'receipts' && <Receipts app={app} />}
    </Layout>
  );
}

export default App;
```

---

### src/lib/types.ts

```ts
export interface Roommate {
  slot: number; // 1..N
  name: string | null;
  room: string | null;
  registered: boolean;
  pin?: string | null;
  active?: boolean;
}

export type Category =
  | 'Groceries'
  | 'Utilities'
  | 'Rent'
  | 'Cleaning'
  | 'Supplies'
  | 'Food'
  | 'Transport'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  payer_slot: number;
  participants: number[]; // slots that share the cost
  created_at: string; // ISO
}

export interface Settlement {
  id: string;
  from_slot: number;
  to_slot: number;
  amount: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: number;
  created_at: string;
  checked: boolean;
}

export const CATEGORIES: Category[] = [
  'Groceries',
  'Utilities',
  'Rent',
  'Cleaning',
  'Supplies',
  'Food',
  'Transport',
  'Other',
];
```

---

### src/lib/format.ts

```ts
export function formatNaira(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Number(n) || 0);
  return `${sign}₦${abs.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const ROOM_NUMBER = '7';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initials(name: string | null, slot: number): string {
  if (!name) return `S${slot}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-blue-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-red-600',
  'from-violet-400 to-purple-600',
  'from-lime-400 to-green-600',
  'from-cyan-400 to-sky-600',
  'from-fuchsia-400 to-pink-600',
  'from-yellow-400 to-amber-600',
  'from-indigo-400 to-blue-700',
  'from-teal-400 to-emerald-600',
  'from-orange-400 to-rose-600',
];

export function avatarColor(slot: number): string {
  return AVATAR_COLORS[(slot - 1) % AVATAR_COLORS.length];
}
```

---

### src/lib/settlement.ts

```ts
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
```

---

### src/lib/api.ts

```ts
import type { Roommate, Expense, Settlement, CartItem, Category } from './types';
import { ROOM_NUMBER } from './format';

// Live backend base URL — all requests go here (HTTPS, no trailing slash).
export const API_BASE = 'https://group3member.pythonanywhere.com';

export const ALL_SLOTS: number[] = [];

export interface AuthSession {
  slot: number;
  name: string;
  room: string;
}

export class NeedsSetupSignal {
  slot: number;
  constructor(slot: number) {
    this.slot = slot;
  }
}

export class NeedsLoginSignal {
  slot: number;
  constructor(slot: number) {
    this.slot = slot;
  }
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function parseBody(res: Response): Promise<any> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(body: any, status: number): string {
  if (body && typeof body === 'object') {
    return body.message || body.error || body.detail || `Request failed (${status})`;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  return `${status}: <empty response body>`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(`${status}: ${message}`);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const method = (opts.method ?? 'GET').toUpperCase();
  const fullUrl = `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...opts,
      headers: { ...DEFAULT_HEADERS, ...opts.headers },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Request failed: ${method} ${fullUrl} - ${detail}`);
  }

  const body = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body, res.status));
  }

  if (body === null) return {} as T;
  return body as T;
}

// ---------------------------------------------------------------------------
// Clear old cached roommate data on startup — server is the only source of truth.
// ---------------------------------------------------------------------------

const OLD_LS_KEY = 'dorm_splitter_state_v1';
try {
  localStorage.removeItem(OLD_LS_KEY);
} catch {
  // ignore
}

// ---------------------------------------------------------------------------
// Session storage (session only, never roommate data)
// ---------------------------------------------------------------------------

const SESSION_KEY = 'dorm_splitter_session';
export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}
export function saveSession(s: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

interface BackendRoommate {
  id: number;
  name: string | null;
  room: string | null;
  registered: boolean;
}

export async function fetchRoommates(): Promise<Roommate[]> {
  const data = await apiFetch<{ roommates?: BackendRoommate[] } | BackendRoommate[]>(`/api/roommates`);
  const list = Array.isArray(data) ? data : (data.roommates ?? []);
  return list.map((r) => ({
    slot: r.id,
    name: r.name ?? null,
    room: r.room ?? null,
    registered: r.registered ?? false,
  }));
}

// Backend expense shape: { id, title, amount, paid_by, split_among, category, timestamp }
interface BackendExpense {
  id: string;
  title: string;
  amount: number;
  paid_by: number;
  split_among: number[];
  category: string;
  timestamp: string;
}

function normalizeExpense(e: Partial<BackendExpense>): Expense {
  return {
    id: String(e.id ?? ''),
    title: e.title ?? '',
    amount: Number(e.amount) || 0,
    category: (e.category as Category) ?? 'Other',
    payer_slot: Number(e.paid_by) || 0,
    participants: Array.isArray(e.split_among) ? e.split_among.map(Number) : [],
    created_at: e.timestamp ?? new Date().toISOString(),
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await apiFetch<{ expenses?: BackendExpense[] } | BackendExpense[]>(`/api/expenses`);
  const list = Array.isArray(data) ? data : (data.expenses ?? []);
  return (list ?? []).map(normalizeExpense);
}

// GET /api/settle returns { status, balances, balances_by_id }.
export async function fetchSettlements(): Promise<Settlement[]> {
  return [];
}

export async function fetchBalances(): Promise<Record<string, number>> {
  try {
    const data = await apiFetch<{ balances_by_id?: Record<string, number> }>(`/api/settle`);
    return data?.balances_by_id ?? {};
  } catch {
    return {};
  }
}

export interface SetupPayload {
  master_key: string;
  slot: number;
  name: string;
  pin: string;
}

export async function setupRoommate(payload: SetupPayload): Promise<AuthSession> {
  const data = await apiFetch<{ id?: number; name?: string; room?: string }>(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      student_id: payload.slot,
      master_key: payload.master_key,
      name: payload.name,
      pin: payload.pin,
    }),
  });
  const session: AuthSession = {
    slot: payload.slot,
    name: data.name ?? payload.name,
    room: ROOM_NUMBER,
  };
  saveSession(session);
  return session;
}

/**
 * Probe a slot by calling POST /api/auth/login with an empty PIN.
 * - If status is "needs_setup" → throw NeedsSetupSignal (show register form).
 * - If 401 → throw NeedsLoginSignal (show PIN login form).
 */
export async function checkSlot(slot: number): Promise<void> {
  try {
    const data = await apiFetch<{ status: string; name?: string; room?: string }>(`/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ student_id: slot, pin: '' }),
    });
    if (data.status === 'needs_setup') {
      throw new NeedsSetupSignal(slot);
    }
    throw new NeedsLoginSignal(slot);
  } catch (err) {
    if (err instanceof NeedsSetupSignal || err instanceof NeedsLoginSignal) throw err;
    if (err instanceof ApiError && (err.status === 401 || err.status === 409)) {
      throw new NeedsLoginSignal(slot);
    }
    throw err;
  }
}

export async function loginRoommate(slot: number, pin: string): Promise<AuthSession> {
  const data = await apiFetch<{ status: string; name?: string; room?: string; message?: string }>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ student_id: slot, pin }),
  });

  if (data.status === 'needs_setup') {
    throw new NeedsSetupSignal(slot);
  }

  const session: AuthSession = {
    slot,
    name: data.name ?? `Student ${slot}`,
    room: ROOM_NUMBER,
  };
  saveSession(session);
  return session;
}

export async function changePin(slot: number, currentPin: string, newPin: string): Promise<void> {
  try {
    await apiFetch(`/api/auth/set-pin`, {
      method: 'POST',
      body: JSON.stringify({ student_id: slot, current_pin: currentPin, new_pin: newPin }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw new Error('Current PIN is incorrect');
    }
    if (err instanceof ApiError && err.status === 429) {
      // Re-throw with the server's message (already in the error from extractErrorMessage)
      throw new Error(err.message.replace(/^\d+:\s*/, ''));
    }
    throw err;
  }
}

export interface ExpensePayload {
  title: string;
  amount: number;
  category: Category;
  payer_slot: number;
  participants: number[];
}

export async function addExpense(payload: ExpensePayload): Promise<Expense> {
  const data = await apiFetch<Partial<BackendExpense>>(`/api/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      amount: payload.amount,
      category: payload.category,
      paid_by: payload.payer_slot,
      split_among: payload.participants,
    }),
  });
  return normalizeExpense(data);
}

export interface SettlementPayload {
  from_slot: number;
  to_slot: number;
  amount: number;
}

export async function addSettlement(payload: SettlementPayload): Promise<Settlement> {
  const data = await apiFetch<Settlement>(`/api/settle`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

interface BackendCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: number;
  checked: boolean;
  created_at: string;
}

function normalizeCartItem(c: Partial<BackendCartItem>): CartItem {
  return {
    id: String(c.id ?? ''),
    name: c.name ?? '',
    price: Number(c.price) || 0,
    quantity: Number(c.quantity) || 1,
    added_by: Number(c.added_by) || 0,
    checked: !!c.checked,
    created_at: c.created_at ?? new Date().toISOString(),
  };
}

export async function fetchCart(): Promise<CartItem[]> {
  const data = await apiFetch<{ items?: BackendCartItem[] }>(`/api/cart`);
  return (data?.items ?? []).map(normalizeCartItem);
}

export interface CartItemPayload {
  name: string;
  price: number;
  quantity: number;
  added_by: number;
}

export async function addCartItem(payload: CartItemPayload): Promise<void> {
  await apiFetch<{ status: string; item: BackendCartItem }>(`/api/cart`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleCartItem(id: string, checked: boolean): Promise<void> {
  await apiFetch(`/api/cart/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ checked }),
  });
}

export async function removeCartItem(id: string): Promise<void> {
  await apiFetch(`/api/cart/${id}`, {
    method: 'DELETE',
  });
}

export async function removeCheckedCartItems(): Promise<void> {
  await apiFetch(`/api/cart/checked`, {
    method: 'DELETE',
  });
}
```

---

### src/lib/useAppState.ts

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Roommate, Expense, Settlement, CartItem } from './types';
import type { Balance } from './settlement';
import * as api from './api';
import { AuthSession } from './api';

export function useAppState() {
  const [session, setSession] = useState<AuthSession | null>(api.loadSession());
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const results = await Promise.allSettled([
        api.fetchRoommates(),
        api.fetchExpenses(),
        api.fetchSettlements(),
        api.fetchBalances(),
        api.fetchCart(),
      ]);
      if (results[0].status === 'fulfilled') setRoommates(results[0].value);
      if (results[1].status === 'fulfilled') setExpenses(results[1].value);
      if (results[2].status === 'fulfilled') setSettlements(results[2].value);
      if (results[3].status === 'fulfilled') setBalances(results[3].value);
      if (results[4].status === 'fulfilled') setCart(results[4].value);

      const roommateError = results[0].status === 'rejected' ? results[0].reason : null;
      if (roommateError instanceof Error) {
        setError(roommateError.message);
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll every 10 seconds, always — so other phones see new names without reloading.
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Refetch when the page becomes visible (switching tabs / returning to the app).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const checkSlot = useCallback(
    async (slot: number) => {
      await api.checkSlot(slot);
    },
    []
  );

  const login = useCallback(
    async (slot: number, pin: string) => {
      const s = await api.loginRoommate(slot, pin);
      setSession(s);
      await refresh();
      return s;
    },
    [refresh]
  );

  const setup = useCallback(
    async (payload: api.SetupPayload) => {
      // setupRoommate now returns an AuthSession directly (no separate login call).
      const s = await api.setupRoommate(payload);
      setSession(s);
      await refresh();
      return s;
    },
    [refresh]
  );

  const logout = useCallback(() => {
    api.clearSession();
    setSession(null);
    refresh();
  }, [refresh]);

  const addExpense = useCallback(
    async (payload: api.ExpensePayload) => {
      await api.addExpense(payload);
      await refresh();
    },
    [refresh]
  );

  const addSettlement = useCallback(
    async (payload: api.SettlementPayload) => {
      await api.addSettlement(payload);
      await refresh();
    },
    [refresh]
  );

  const changePin = useCallback(
    async (slot: number, currentPin: string, newPin: string) => {
      await api.changePin(slot, currentPin, newPin);
      await refresh();
    },
    [refresh]
  );

  const addCartItem = useCallback(
    async (payload: api.CartItemPayload) => {
      await api.addCartItem(payload);
      await refresh();
    },
    [refresh]
  );

  const toggleCartItem = useCallback(
    async (id: string, checked: boolean) => {
      await api.toggleCartItem(id, checked);
      await refresh();
    },
    [refresh]
  );

  const removeCartItem = useCallback(
    async (id: string) => {
      await api.removeCartItem(id);
      await refresh();
    },
    [refresh]
  );

  const removeCheckedCartItems = useCallback(async () => {
    await api.removeCheckedCartItems();
    await refresh();
  }, [refresh]);

  return {
    session,
    roommates,
    expenses,
    settlements,
    balances,
    cart,
    loading,
    error,
    refresh,
    login,
    checkSlot,
    setup,
    logout,
    addExpense,
    addSettlement,
    changePin,
    addCartItem,
    toggleCartItem,
    removeCartItem,
    removeCheckedCartItems,
  };
}

export type AppContext = ReturnType<typeof useAppState>;
```
