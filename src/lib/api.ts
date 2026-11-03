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
