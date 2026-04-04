import React, { useMemo } from 'react';
import { Match } from '../types';
import { X, ExternalLink } from 'lucide-react';

interface TeamFilterProps {
  matches: Match[];
  selectedTeam: number | null;
  onSelect: (teamId: number | null) => void;
  onViewHistory: (teamId: number) => void;
}

const TeamFilter: React.FC<TeamFilterProps> = ({ matches, selectedTeam, onSelect, onViewHistory }) => {
  const teams = useMemo(() => {
    const seen = new Map<number, { id: number; name: string; short: string; logo: string }>();
    for (const m of matches) {
      if (!seen.has(m.home_team.id))
        seen.set(m.home_team.id, { id: m.home_team.id, name: m.home_team.name, short: m.home_team.short_name, logo: m.home_team.logo });
      if (!seen.has(m.away_team.id))
        seen.set(m.away_team.id, { id: m.away_team.id, name: m.away_team.name, short: m.away_team.short_name, logo: m.away_team.logo });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  if (teams.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter by team</span>
        {selectedTeam && (
          <>
            <button
              onClick={() => onSelect(null)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
            <button
              onClick={() => onViewHistory(selectedTeam)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> View all matches
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {teams.map((team) => {
          const active = selectedTeam === team.id;
          return (
            <button
              key={team.id}
              onClick={() => onSelect(active ? null : team.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white/60 text-slate-700 hover:bg-white/90 border border-white/40'
              }`}
            >
              {team.logo && (
                <img src={team.logo} alt={team.name} className="w-4 h-4 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <span className="hidden sm:inline">{team.name}</span>
              <span className="sm:hidden">{team.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamFilter;
