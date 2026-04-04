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
          <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Teams</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Click a {league.name} team to open its club profile, squad, fixtures, and form
          </p>
        </div>
        {teams.length > 0 && (
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none w-48"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          />
        )}
      </div>

      {loading ? (
        <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">Loading teams...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500">
            {search ? `No teams found for "${search}".` : 'No teams found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sorted.map(team => {
            const fav = isFavourite(team.id);
            return (
              <div key={team.id} className="relative group/card">
                <button
                  onClick={() => setSelectedTeam(team.id)}
                  className={`card-hover w-full flex flex-col items-center gap-3 p-5 text-center group ${
                    fav ? 'ring-1' : ''
                  }`}
                  style={fav ? { ringColor: 'var(--league-accent)', boxShadow: `0 0 0 1px var(--league-accent)` } : undefined}
                >
                  <div className="w-14 h-14 flex items-center justify-center">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-200"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center">
                        <span className="text-sm font-black text-slate-400">{team.short_name?.slice(0, 3) ?? team.name.slice(0, 3)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 leading-snug">{team.name}</p>
                    {team.short_name && (
                      <p className="text-[11px] text-slate-600 mt-0.5 uppercase tracking-wider">{team.short_name}</p>
                    )}
                  </div>
                </button>

                {/* Star button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(team.id); }}
                  className="absolute top-2 right-2 p-1 rounded-lg transition-all opacity-0 group-hover/card:opacity-100 hover:bg-white/10"
                  title={fav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Star
                    className="w-3.5 h-3.5 transition-colors"
                    style={fav ? { color: 'var(--league-accent)', fill: 'var(--league-accent)' } : { color: '#64748b' }}
                  />
                </button>

                {/* Persistent star indicator for already-favourited teams */}
                {fav && (
                  <div className="absolute top-2 right-2 p-1 pointer-events-none group-hover/card:opacity-0">
                    <Star
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--league-accent)', fill: 'var(--league-accent)' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
