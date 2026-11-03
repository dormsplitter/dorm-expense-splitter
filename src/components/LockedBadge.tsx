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
