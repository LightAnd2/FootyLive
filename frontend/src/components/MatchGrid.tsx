import React, { useState, useMemo } from 'react';
import { Match, MatchStatus } from '../types';
import { format, parseISO } from 'date-fns';
import MatchCard from './MatchCard';
import TeamHistory from './TeamHistory';
import type { LeagueCode } from '../constants/leagues';
import { useFavourites } from '../hooks/useFavourites';

interface MatchGridProps {
  matches: Match[];
  activeTab: MatchStatus;
  competition: LeagueCode;
}

const EMPTY: Record<string, { title: string; subtitle: string }> = {
  live:     { title: 'No live matches',      subtitle: 'There are no matches in progress right now.' },
  today:    { title: 'No matches today',     subtitle: 'There are no fixtures scheduled for today.' },
  upcoming: { title: 'No upcoming fixtures', subtitle: 'There are no upcoming fixtures available right now.' },
  results:  { title: 'No recent results',    subtitle: 'There are no finished matches available right now.' },
  default:  { title: 'No matches found',     subtitle: '' },
};

function groupMatches(matches: Match[], tab: MatchStatus, competition: LeagueCode): { label: string; items: Match[] }[] {
  if (tab === 'live' || tab === 'today') return [{ label: '', items: matches }];

  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.matchday
      ? competition === 'CL'
        ? format(parseISO(m.match_date), 'EEEE, d MMMM yyyy')
        : `Matchweek ${m.matchday}`
      : format(parseISO(m.match_date), 'EEEE, d MMMM yyyy');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

const MatchGrid: React.FC<MatchGridProps> = ({ matches, activeTab, competition }) => {
  const [historyTeamId, setHistoryTeamId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const { favourites } = useFavourites();

  const isFavouriteMatch = (match: Match) =>
    favourites.has(match.home_team_id) || favourites.has(match.away_team_id);

  // Sort favourite matches to top within each group
  const sortWithFavourites = (items: Match[]) => [
    ...items.filter(isFavouriteMatch),
    ...items.filter(m => !isFavouriteMatch(m)),
  ];

  const groups = useMemo(() => groupMatches(matches, activeTab, competition), [matches, activeTab, competition]);
  const filterOptions = (activeTab === 'upcoming' || activeTab === 'results')
    ? groups.map(g => g.label).filter(Boolean)
    : [];
  const visibleGroups = selectedGroup
    ? groups.filter(g => g.label === selectedGroup)
    : groups;

  if (historyTeamId !== null) {
    return <TeamHistory teamId={historyTeamId} competition={competition} onBack={() => setHistoryTeamId(null)} />;
  }

  if (matches.length === 0) {
    const msg = EMPTY[activeTab] ?? EMPTY.default;
    return (
      <div className="text-center py-24">
        <div className="w-10 h-10 rounded-full bg-white/5 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-300 mb-1">{msg.title}</h3>
        <p className="text-slate-500 max-w-xs mx-auto text-sm">{msg.subtitle}</p>
      </div>
    );
  }

  return (
    <div>
      {filterOptions.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter</span>
            {selectedGroup && (
              <button onClick={() => setSelectedGroup('')} className="text-xs font-semibold" style={{ color: 'var(--league-accent)' }}>
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map(label => (
              <button
                key={label}
                onClick={() => setSelectedGroup(selectedGroup === label ? '' : label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedGroup === label
                    ? 'text-[#0d1117]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
                style={
                  selectedGroup === label
                    ? { backgroundColor: 'var(--league-accent)', borderColor: 'var(--league-accent)' }
                    : undefined
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {visibleGroups.map(({ label, items }) => {
          const sorted = sortWithFavourites(items);
          return (
            <div key={label || 'all'}>
              {label && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-slate-600">{items.length} match{items.length !== 1 ? 'es' : ''}</span>
                </div>
              )}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sorted.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isFavouriteMatch={isFavouriteMatch(match)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchGrid;
