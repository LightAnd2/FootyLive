import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white px-6 py-16">
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 rounded-full border border-slate-200 bg-slate-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--league-accent)' }} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Loading</p>
      <p className="mt-2 text-center text-sm text-slate-400">Pulling the latest fixtures, scores, and tables.</p>
    </div>
  </div>
);

export default LoadingSpinner;
