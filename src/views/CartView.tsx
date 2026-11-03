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
