import React from 'react';
import { MatchStatus } from '../types';

interface MatchTabsProps {
  activeTab: MatchStatus;
  onTabChange: (tab: MatchStatus) => void;
  matchCounts: { live: number; today: number; upcoming: number; results: number };
  showTeamsTab?: boolean;
  showBracketTab?: boolean;
}

const tabs: { id: MatchStatus; label: string; liveOnly?: boolean }[] = [
  { id: 'live',      label: 'Live',     liveOnly: true },
  { id: 'today',     label: 'Today' },
  { id: 'bracket',   label: 'Bracket' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'results',   label: 'Results' },
  { id: 'standings', label: 'Table' },
  { id: 'scorers',   label: 'Stats' },
];

const MatchTabs: React.FC<MatchTabsProps> = ({
  activeTab,
  onTabChange,
  matchCounts,
  showTeamsTab = false,
  showBracketTab = false,
}) => {
  const counts: Record<string, number> = { ...matchCounts };
  const visibleTabs = tabs.filter((tab) => showBracketTab || tab.id !== 'bracket');
  if (showTeamsTab) visibleTabs.push({ id: 'teams' as MatchStatus, label: 'Teams' });

  return (
    <div className="mb-6 border-b border-white/10">
      <nav className="flex items-center justify-start sm:justify-center gap-4 sm:gap-7 overflow-x-auto scrollbar-hide -mb-px px-1">
        {visibleTabs.map(({ id, label, liveOnly }) => {
          const isActive = activeTab === id;
          const count = id === 'results' ? 0 : counts[id] ?? 0;
          const isLiveActive = liveOnly && count > 0;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`group relative flex items-center gap-1.5 pt-1 pb-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-150 ${
                isActive ? '' : 'text-slate-500 hover:text-slate-200'
              }`}
              style={isActive ? { color: 'var(--league-accent)' } : undefined}
            >
              {isLiveActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              <span>{label}</span>
              {count > 0 && (
                <span
                  className="text-[11px] font-extrabold tabular-nums transition-colors"
                  style={{ color: isActive ? 'var(--league-accent)' : undefined }}
                >
                  {count}
                </span>
              )}
              <span
                className={`absolute left-0 right-0 -bottom-px h-[2px] rounded-full transition-all duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                }`}
                style={{
                  backgroundColor: 'var(--league-accent)',
                  boxShadow: isActive ? '0 0 12px var(--league-accent-soft)' : 'none',
                }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MatchTabs;
