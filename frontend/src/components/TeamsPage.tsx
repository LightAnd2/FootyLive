import React, { useEffect, useState } from 'react';
import { Team } from '../types';
import { apiService } from '../services/api';
import TeamHistory from './TeamHistory';
import { LEAGUE_MAP, type LeagueCode } from '../constants/leagues';
import { useFavourites } from '../hooks/useFavourites';
import { Star } from 'lucide-react';

interface TeamsPageProps {
  competition: LeagueCode;
}

const TeamsPage: React.FC<TeamsPageProps> = ({ competition }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const league = LEAGUE_MAP[competition];
  const { isFavourite, toggle } = useFavourites();

  useEffect(() => {
    setSelectedTeam(null);
    setSearch('');
    setLoading(true);
    apiService.getTeams({ competition })
      .then(data => setTeams(data))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [competition]);

  if (selectedTeam !== null) {
    return <TeamHistory teamId={selectedTeam} competition={competition} onBack={() => setSelectedTeam(null)} />;
  }

  const filtered = search.trim()
    ? teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.short_name?.toLowerCase().includes(search.toLowerCase()))
    : teams;

  const sorted = [
    ...filtered.filter(t => isFavourite(t.id)),
    ...filtered.filter(t => !isFavourite(t.id)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Teams</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Click a {league.name} team to open its club profile, squad, fixtures, and form
          </p>
        </div>
        {teams.length > 0 && (
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-48"
          />
        )}
      </div>

      {loading ? (
        <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">Loading teams...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400">
            {search ? `No teams found for "${search}".` : 'No teams found.'}
          </p>
        </div>
      ) : (
        <div className="glass-effect rounded-2xl overflow-hidden">
          {sorted.map(team => {
            const fav = isFavourite(team.id);
            return (
              <div
                key={team.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTeam(team.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTeam(team.id); }}
                className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-500">{team.short_name?.slice(0, 3) ?? team.name.slice(0, 3)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{team.name}</p>
                  {team.short_name && (
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">{team.short_name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(team.id); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 shrink-0"
                  title={fav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Star
                    className="w-4 h-4 transition-colors"
                    style={fav ? { color: 'var(--league-accent)', fill: 'var(--league-accent)' } : { color: '#94a3b8' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
