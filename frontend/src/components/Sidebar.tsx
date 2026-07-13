import React from 'react';
import { Link } from 'react-router-dom';
import { DOMESTIC_LEAGUES, EUROPEAN_LEAGUES, INTERNATIONAL_LEAGUES, type LeagueCode, type LeagueTheme } from '../constants/leagues';

interface SidebarProps {
  selectedLeague: LeagueCode;
  onSelectLeague: (league: LeagueCode) => void;
}

const SECTIONS: { label: string; leagues: LeagueTheme[] }[] = [
  { label: 'Leagues', leagues: DOMESTIC_LEAGUES },
  { label: 'Cups', leagues: [...EUROPEAN_LEAGUES, ...INTERNATIONAL_LEAGUES] },
];

const Sidebar: React.FC<SidebarProps> = ({ selectedLeague, onSelectLeague }) => (
  <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col overflow-y-auto border-r border-slate-200 bg-white scrollbar-hide lg:w-60">
    {/* Brand */}
    <Link to="/" className="flex items-center gap-2.5 px-3 py-4 lg:px-5">
      <img src="/favicon.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
      <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 lg:inline">
        Footy<span className="text-blue-600">Live</span>
      </span>
    </Link>

    <nav className="flex-1 px-2 pb-6 lg:px-3">
      {SECTIONS.map(({ label, leagues }) => (
        <div key={label} className="mt-2">
          <p className="hidden px-2 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
            {label}
          </p>
          <div className="my-2 border-t border-slate-100 lg:hidden" />
          <ul className="space-y-0.5">
            {leagues.map((league) => {
              const isActive = league.code === selectedLeague;
              return (
                <li key={league.code}>
                  <button
                    onClick={() => onSelectLeague(league.code)}
                    aria-label={league.name}
                    title={league.name}
                    aria-pressed={isActive}
                    className={`relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors lg:px-2.5 ${
                      isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full lg:-left-3"
                        style={{ backgroundColor: league.accent }}
                        aria-hidden
                      />
                    )}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <img
                        src={league.emblem}
                        alt=""
                        className="h-6 w-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </span>
                    <span
                      className={`hidden min-w-0 flex-1 truncate text-sm lg:inline ${
                        isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'
                      }`}
                    >
                      {league.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
