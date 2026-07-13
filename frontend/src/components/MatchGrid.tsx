import React, { useMemo } from 'react';
import { Match, MatchStatus } from '../types';
import { format, parseISO } from 'date-fns';
import MatchCard from './MatchCard';
import { CUP_CODES, type LeagueCode } from '../constants/leagues';
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
    const key = m.matchday && !CUP_CODES.includes(competition)
      ? `Matchweek ${m.matchday}`
      : format(parseISO(m.match_date), 'EEEE, d MMMM yyyy');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

const MatchGrid: React.FC<MatchGridProps> = ({ matches, activeTab, competition }) => {
  const { favourites } = useFavourites();

  const isFavouriteMatch = (match: Match) =>
    favourites.has(match.home_team_id) || favourites.has(match.away_team_id);

  // Sort favourite matches to top within each group
  const sortWithFavourites = (items: Match[]) => [
    ...items.filter(isFavouriteMatch),
    ...items.filter(m => !isFavouriteMatch(m)),
  ];

  const groups = useMemo(() => groupMatches(matches, activeTab, competition), [matches, activeTab, competition]);

  if (matches.length === 0) {
    const msg = EMPTY[activeTab] ?? EMPTY.default;
    return (
      <div className="card px-6 py-14 text-center">
        <h3 className="text-sm font-bold text-slate-700">{msg.title}</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">{msg.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(({ label, items }) => {
        const sorted = sortWithFavourites(items);
        return (
          <div key={label || 'all'} className="card">
            {label && (
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                <span className="text-[11px] text-slate-400">{items.length} match{items.length !== 1 ? 'es' : ''}</span>
              </div>
            )}
            <div className="divide-y divide-slate-100">
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
  );
};

export default MatchGrid;
