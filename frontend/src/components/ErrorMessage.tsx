import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="rounded-[24px] border border-red-500/20 bg-[linear-gradient(180deg,rgba(84,11,21,0.34),rgba(15,23,42,0.42))] px-6 py-16 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10">
      <AlertCircle className="h-7 w-7 text-red-300" />
    </div>
    <h3 className="mb-2 text-base font-bold uppercase tracking-[0.14em] text-slate-100">Couldn&apos;t Load This Section</h3>
    <p className="mx-auto mb-6 max-w-md text-sm text-slate-300/80">{message}</p>
    <button onClick={onRetry} className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/12">
      <RefreshCw className="h-4 w-4" /> Try Again
    </button>
  </div>
);

export default ErrorMessage;
