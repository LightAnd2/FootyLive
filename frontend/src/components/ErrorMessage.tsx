import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
    <p className="text-sm font-bold text-slate-900">Couldn&apos;t load this</p>
    <p className="mt-1 text-sm text-slate-400">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 text-sm font-bold underline decoration-slate-300 underline-offset-4 hover:decoration-current"
      style={{ color: 'var(--league-accent)' }}
    >
      Try again
    </button>
  </div>
);

export default ErrorMessage;
