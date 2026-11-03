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
