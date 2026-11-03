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
