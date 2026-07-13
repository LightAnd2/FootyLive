import React, { useEffect, useState } from 'react';
import { Scorers } from '../types';
import { apiService } from '../services/api';
import { LEAGUE_MAP, type LeagueCode } from '../constants/leagues';

interface ScorersTableProps {
  competition: LeagueCode;
  /** Archived season label (e.g. "2025-26"), or null/undefined for the live season. */
  season?: string | null;
}

const ScorersTable: React.FC<ScorersTableProps> = ({ competition, season = null }) => {
  const [scorers, setScorers]         = useState<Scorers | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const league = LEAGUE_MAP[competition];

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getScorers(competition, 20, season ?? undefined)
      .then((s) => {
        setScorers(s);
      })
      .catch(() => setError(`Failed to load ${league.name} stats`))
      .finally(() => setLoading(false));
  }, [competition, league.name, season]);

  if (loading) return <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">Loading {league.name} stats...</div>;
  if (error || !scorers) return <p className="text-center text-slate-400 py-12">{error}</p>;

  const seasonLabel = (() => {
    const start = scorers.season?.startDate?.slice(0, 4);
    const end = scorers.season?.endDate?.slice(0, 4);
    if (!start) return null;
    return start === end || !end ? start : `${start}/${end.slice(2)}`;
  })();

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="text-xs font-semibold text-slate-700">Top Scorers</p>
        {seasonLabel && <span className="text-xs font-medium text-slate-400">Season {seasonLabel}</span>}
      </div>

      <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Club</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Played</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Pens</th>
                <th className="px-4 py-3 text-center">Goals</th>
              </tr>
            </thead>
            <tbody>
              {scorers.scorers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No scorer data yet.
                  </td>
                </tr>
              ) : scorers.scorers.map((row, idx) => (
                <tr key={row.player.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-500 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.player.name}</p>
                    <p className="text-xs text-slate-400 sm:hidden">{row.team.tla}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <img src={row.team.crest} alt="" className="w-5 h-5 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span className="text-slate-700 font-medium">{row.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden md:table-cell">
                    {row.playedMatches ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden md:table-cell">
                    {row.penalties}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span
                      className="font-black text-lg"
                      style={{ color: 'var(--league-accent)' }}
                    >
                      {row.goals}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default ScorersTable;
