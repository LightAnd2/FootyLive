import React, { useEffect, useState } from 'react';
import { Team } from '../types';
import { apiService } from '../services/api';
import TeamHistory from './TeamHistory';
import LoadingSpinner from './LoadingSpinner';
import { Search } from 'lucide-react';
import type { LeagueCode } from '../constants/leagues';

interface TeamsDirectoryProps {
  competition: LeagueCode;
}

const TeamsDirectory: React.FC<TeamsDirectoryProps> = ({ competition }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    apiService
      .getPremierLeagueTeams()
      .then(setTeams)
      .catch(() => setError('Could not load teams.'))
      .finally(() => setLoading(false));
  }, []);

  if (selectedId !== null) {
    return <TeamHistory teamId={selectedId} competition={competition} onBack={() => setSelectedId(null)} />;
  }

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="glass-effect rounded-2xl p-8 text-center max-w-lg mx-auto">
        <p className="text-slate-800 font-semibold">{error}</p>
      </div>
    );
  }

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.short_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="glass-effect rounded-2xl p-4 sm:p-5 mb-6">
        <h2
          className="text-lg font-black text-slate-900 uppercase tracking-wide mb-1"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          Clubs
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Select a team for season results, upcoming fixtures, and quick stats (includes European games from the API).
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/40 bg-white/50 text-slate-900 placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00ff85]/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {filtered.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => setSelectedId(team.id)}
            className="glass-effect rounded-xl p-4 text-left transition-all hover:ring-2 hover:ring-[#00ff85]/40 hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-[#00ff85]/60"
          >
            <div className="flex flex-col items-center text-center gap-2">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt=""
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-black text-slate-600">
                  {team.short_name.charAt(0)}
                </span>
              )}
              <span className="font-bold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2">
                {team.name}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {team.short_name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-600 py-12 text-sm">No clubs match that search.</p>
      )}
    </div>
  );
};

export default TeamsDirectory;
