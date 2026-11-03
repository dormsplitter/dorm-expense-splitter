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
