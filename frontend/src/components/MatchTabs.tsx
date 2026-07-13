import React from 'react';
import { MatchStatus } from '../types';

interface MatchTabsProps {
  activeTab: MatchStatus;
  onTabChange: (tab: MatchStatus) => void;
  matchCounts: { live: number; today: number; upcoming: number; results: number };
  showTeamsTab?: boolean;
  showBracketTab?: boolean;
  /** An archived season is selected — only the tabs that make sense for frozen historical data. */
  archivedMode?: boolean;
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
  archivedMode = false,
}) => {
  const counts: Record<string, number> = { ...matchCounts };
  let visibleTabs = tabs.filter((tab) => showBracketTab || tab.id !== 'bracket');
  if (showTeamsTab) visibleTabs.push({ id: 'teams' as MatchStatus, label: 'Teams' });
  // A frozen past season has no live/upcoming/results data. Cups tell their story
  // through the bracket (no group-stage table); leagues through the table — never both.
  if (archivedMode) {
    const archivedTabIds: MatchStatus[] = showBracketTab ? ['bracket', 'scorers'] : ['standings', 'scorers'];
    visibleTabs = visibleTabs.filter((tab) => archivedTabIds.includes(tab.id));
  }

  return (
    <div className="border-t border-slate-100">
      <nav className="flex items-center justify-start gap-1 overflow-x-auto scrollbar-hide px-2">
        {visibleTabs.map(({ id, label, liveOnly }) => {
          const isActive = activeTab === id;
          const count = id === 'results' ? 0 : counts[id] ?? 0;
          const isLiveActive = liveOnly && count > 0;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`group relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isLiveActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              <span>{label}</span>
              {count > 0 && (
                <span className="text-[11px] font-bold tabular-nums text-slate-400">
                  {count}
                </span>
              )}
              <span
                className={`absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full transition-all duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ backgroundColor: 'var(--league-accent)' }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MatchTabs;
