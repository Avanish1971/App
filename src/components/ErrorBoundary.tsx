import { Component, ErrorInfo, ReactNode } from 'react';

interface State {
  error: Error | null;
}

// Koi screen crash ho jaye to safed khali page ki jagah saaf message aur "Wapas jao" button
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crash:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4 text-center">
          <div className="text-3xl">⚠️</div>
          <h2 className="font-extrabold text-slate-900 text-base">Kuch gadbad ho gayi</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ye screen khul nahi paayi. Aapka data surakshit hai. "Wapas jao" dabaiye, ya page dobara kholiye.
          </p>
          <pre className="text-[10px] text-left text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 overflow-x-auto whitespace-pre-wrap">
            {String(this.state.error.message || this.state.error).slice(0, 300)}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => {
                this.setState({ error: null }); // app naye sire se khulta hai (login bana rehta hai)
              }}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
            >
              Wapas jao
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
            >
              Page reload karo
            </button>
          </div>
        </div>
      </div>
    );
  }
}
