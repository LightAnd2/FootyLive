import React, { useEffect, useState } from 'react';
import { Scorers } from '../types';
import { apiService } from '../services/api';
import { LEAGUE_MAP, type LeagueCode } from '../constants/leagues';

interface ScorersTableProps {
  competition: LeagueCode;
}

const ScorersTable: React.FC<ScorersTableProps> = ({ competition }) => {
  const [scorers, setScorers]         = useState<Scorers | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [view, setView]               = useState<'goals' | 'assists'>('goals');

  const league = LEAGUE_MAP[competition];

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getScorers(competition, 20)
      .then((s) => {
        setScorers(s);
      })
      .catch(() => setError(`Failed to load ${league.name} stats`))
      .finally(() => setLoading(false));
  }, [competition, league.name]);

  if (loading) return <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">Loading {league.name} stats...</div>;
  if (error || !scorers) return <p className="text-center text-slate-400 py-12">{error}</p>;

  const sortedScorers = [...scorers.scorers].sort((a, b) =>
    view === 'assists' ? b.assists - a.assists : b.goals - a.goals
  );

  const tabs = [
    { key: 'goals',        label: 'Top Scorers' },
    { key: 'assists',      label: 'Most Assists' },
  ] as const;

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
          Player &amp; Team Stats
        </h2>
        <span className="text-xs text-slate-500">{league.name}</span>
        <div className="flex rounded-xl overflow-hidden border border-white/15">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                view === key ? 'text-[#0d1117]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
              style={view === key ? { backgroundColor: 'var(--league-accent)' } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/8 bg-white/5">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Club</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Played</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Pens</th>
                <th className="px-4 py-3 text-center">Goals</th>
                <th className="px-4 py-3 text-center">Assists</th>
              </tr>
            </thead>
            <tbody>
              {sortedScorers.map((row, idx) => (
                <tr key={row.player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-500 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-200">{row.player.name}</p>
                    <p className="text-xs text-slate-500 sm:hidden">{row.team.tla}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <img src={row.team.crest} alt="" className="w-5 h-5 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span className="text-slate-400 font-medium">{row.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden md:table-cell">
                    {row.playedMatches ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden md:table-cell">
                    {row.penalties}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span
                      className={`font-black text-lg ${view === 'goals' ? '' : 'text-slate-400'}`}
                      style={view === 'goals' ? { color: 'var(--league-accent)' } : undefined}
                    >
                      {row.goals}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className={`font-black text-lg ${view === 'assists' ? 'text-blue-400' : 'text-slate-400'}`}>
                      {row.assists}
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
