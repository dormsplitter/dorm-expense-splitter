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
