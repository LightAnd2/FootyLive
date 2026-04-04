import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="rounded-[24px] border border-white/10 bg-black/20 px-6 py-16">
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 rounded-full border border-white/10 bg-white/5 p-4">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--league-accent)' }} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Loading</p>
      <p className="mt-2 text-center text-sm text-slate-500">Pulling the latest fixtures, scores, and tables.</p>
    </div>
  </div>
);

export default LoadingSpinner;
