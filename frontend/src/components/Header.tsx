import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
  loading: boolean;
  wsConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, loading, wsConnected }) => {
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
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-black leading-none"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, var(--league-accent) 0%, #ffffff 50%, var(--league-accent) 100%)' }}
              >
                FootyLive
              </span>
            </h1>
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/15 px-2 py-0.5 rounded">
              Live Tracker
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* WS status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
              {wsConnected
                ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                : <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
              }
              <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'}`} />
              <span className={`text-xs font-semibold hidden sm:inline ${wsConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                {wsConnected ? 'Live' : 'Reconnecting'}
              </span>
            </div>

            {/* Last updated — desktop only */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
              <span className="text-xs text-slate-400 font-medium tabular-nums">
                {format(lastUpdated, 'HH:mm:ss')}
              </span>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-primary py-1.5 px-3 text-xs"
              style={{ backgroundColor: 'var(--league-accent)' }}
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
