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
