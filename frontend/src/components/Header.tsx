import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, loading }) => {
  return (
    <header className="sticky top-0 z-50 glass-effect shadow-lg shadow-black/30">
      {/* Green accent line */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--league-accent) 50%, transparent 100%)' }}
      />

      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-black leading-none"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <span style={{ color: 'var(--league-accent)' }}>
                FootyLive
              </span>
            </h1>
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/15 px-2 py-0.5 rounded">
              Live Tracker
            </span>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center rounded-lg py-1.5 px-3 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 disabled:pointer-events-none"
              style={{
                color: 'var(--league-accent)',
                backgroundColor: 'var(--league-accent-soft)',
                border: '1px solid var(--league-accent-soft)',
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1.5">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
