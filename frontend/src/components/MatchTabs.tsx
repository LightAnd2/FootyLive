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
    <div className="mb-6 flex justify-center">
      <div className="glass-effect rounded-2xl px-2 py-1 inline-flex max-w-full overflow-x-auto scrollbar-hide">
        <nav className="flex items-center justify-center gap-1 min-w-max">
        {visibleTabs.map(({ id, label, liveOnly }) => {
          const isActive = activeTab === id;
          const count = counts[id] ?? 0;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 whitespace-nowrap leading-none ${
                isActive
                  ? 'text-[#0d1117] shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--league-accent)',
                      boxShadow: '0 10px 25px var(--league-accent-soft)',
                    }
                  : undefined
              }
            >
              {liveOnly && count > 0 && (
                <span className={`w-2 h-2 rounded-full animate-pulse ${isActive ? 'bg-[#0d1117]' : 'bg-red-500'}`} />
              )}
              <span className="leading-none">{label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold leading-none ${
                  isActive ? 'bg-[#0d1117]/20 text-[#0d1117]' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
        </nav>
      </div>
    </div>
  );
};

export default MatchTabs;
