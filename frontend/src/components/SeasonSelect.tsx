import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiService } from '../services/api';
import type { LeagueCode } from '../constants/leagues';

interface SeasonSelectProps {
  competition: LeagueCode;
  /** null/undefined means the live, current season. */
  value: string | null;
  onChange: (season: string | null) => void;
}

/** Dropdown for switching between the live season and any frozen past seasons.
 *  Renders nothing if no seasons have been archived for this competition yet. */
const SeasonSelect: React.FC<SeasonSelectProps> = ({ competition, value, onChange }) => {
  const [seasons, setSeasons] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiService.getSeasons(competition)
      .then((list) => { if (!cancelled) setSeasons(list); })
      .catch(() => { if (!cancelled) setSeasons([]); });
    return () => { cancelled = true; };
  }, [competition]);

  if (!seasons.length) return null;

  return (
    <div className="relative shrink-0">
      <select
        value={value ?? 'current'}
        onChange={(e) => onChange(e.target.value === 'current' ? null : e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{ ['--tw-ring-color' as string]: 'var(--league-accent)' }}
      >
        <option value="current">Current season</option>
        {seasons.map((season) => (
          <option key={season} value={season}>{season}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
};

export default SeasonSelect;
