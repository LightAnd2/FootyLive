import React, { useEffect, useState, useCallback } from 'react';
import { Standings } from '../types';
import { apiService } from '../services/api';
import KnockoutBracket from './KnockoutBracket';
import { CUP_CODES, LEAGUE_MAP, type LeagueCode } from '../constants/leagues';

interface StandingsTableProps {
  competition: LeagueCode;
  initialView?: 'table' | 'bracket';
  /** Archived season label (e.g. "2025-26"), or null/undefined for the live season. */
  season?: string | null;
}

type Zone = 'ucl' | 'uel' | 'uecl' | 'copa' | 'sula' | 'promotion' | 'playoff' | 'relegation' | null;

const ZONES: Record<LeagueCode, (pos: number, total: number) => Zone> = {
  PL:  (p, t) => p <= 4 ? 'ucl' : p === 5 ? 'uel' : p === 6 ? 'uecl' : p > t - 3 ? 'relegation' : null,
  ELC: (p, t) => p <= 2 ? 'promotion' : p <= 6 ? 'playoff' : p > t - 3 ? 'relegation' : null,
  BL1: (p, t) => p <= 4 ? 'ucl' : p === 5 ? 'uel' : p === 6 ? 'uecl' : p === t - 2 ? 'playoff' : p > t - 2 ? 'relegation' : null,
  FL1: (p, t) => p <= 3 ? 'ucl' : p <= 5 ? 'uel' : p === 6 ? 'uecl' : p === t - 2 ? 'playoff' : p > t - 2 ? 'relegation' : null,
  SA:  (p, t) => p <= 4 ? 'ucl' : p <= 6 ? 'uel' : p === 7 ? 'uecl' : p > t - 3 ? 'relegation' : null,
  PD:  (p, t) => p <= 4 ? 'ucl' : p <= 6 ? 'uel' : p === 7 ? 'uecl' : p > t - 3 ? 'relegation' : null,
  DED: (p, t) => p <= 2 ? 'ucl' : p === 3 ? 'uel' : p <= 8 ? 'uecl' : p === t - 2 ? 'playoff' : p > t - 2 ? 'relegation' : null,
  PPL: (p, t) => p <= 3 ? 'ucl' : p === 4 ? 'uel' : p <= 6 ? 'uecl' : p === t - 2 ? 'playoff' : p > t - 2 ? 'relegation' : null,
  BSA: (p, t) => p <= 4 ? 'copa' : p <= 6 ? 'sula' : p > t - 4 ? 'relegation' : null,
  CL:  () => null,
  EC:  () => null,
  WC:  () => null,
};

const ZONE_STYLE: Record<NonNullable<Zone>, { border: string; label: string; dot: string }> = {
  ucl:       { border: 'border-l-2 border-l-blue-500',   dot: 'bg-blue-500',   label: 'Champions League' },
  uel:       { border: 'border-l-2 border-l-orange-500', dot: 'bg-orange-500', label: 'Europa League' },
  uecl:      { border: 'border-l-2 border-l-teal-400',   dot: 'bg-teal-400',   label: 'Conference League' },
  copa:      { border: 'border-l-2 border-l-blue-500',   dot: 'bg-blue-500',   label: 'Copa Libertadores' },
  sula:      { border: 'border-l-2 border-l-orange-500', dot: 'bg-orange-500', label: 'Copa Sudamericana' },
  promotion: { border: 'border-l-2 border-l-green-500',  dot: 'bg-green-500',  label: 'Promotion' },
  playoff:   { border: 'border-l-2 border-l-amber-400',  dot: 'bg-amber-400',  label: 'Playoff' },
  relegation:{ border: 'border-l-2 border-l-red-500',    dot: 'bg-red-500',    label: 'Relegation' },
};

const StandingsTable: React.FC<StandingsTableProps> = ({ competition, initialView = 'table', season = null }) => {
  const [standings, setStandings] = useState<Standings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const league = LEAGUE_MAP[competition];
  const showBracket = initialView === 'bracket';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStandings(competition, season ?? undefined);
      setStandings(data);
    } catch {
      setStandings(null);
      setError(`Failed to load the ${league.name} table.`);
    } finally {
      setLoading(false);
    }
  }, [competition, league.name, season]);

  useEffect(() => {
    if (showBracket) return;
    load();
  }, [load, showBracket]);

  if (showBracket) {
    return <KnockoutBracket competition={competition} season={season} />;
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl overflow-hidden accent-frame">
        <div className="py-8 text-center text-sm text-slate-400">Loading {league.name} table...</div>
      </div>
    );
  }

  if (error || !standings) {
    return (
      <div className="glass-effect rounded-2xl overflow-hidden accent-frame">
        <p className="text-center text-slate-400 py-12 px-4">{error}</p>
      </div>
    );
  }

  const FormDots: React.FC<{ form: string | null | undefined }> = ({ form }) => (
    <div className="flex items-center justify-center gap-1">
      {(form || '')
        .split(',')
        .filter(Boolean)
        .slice(0, 5)
        .map((result, index) => {
          const tone =
            result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-slate-300' : 'bg-red-500';
          return <span key={index} className={`h-2 w-2 rounded-full shrink-0 ${tone}`} />;
        })}
    </div>
  );

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      {(standings.table?.length || standings.groups?.length) ? (
        standings.groups?.length ? (
          <div className="p-4 space-y-4">
            {standings.groups.map((group) => (
              <div key={group.name} className="overflow-x-auto rounded-xl border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{group.name}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Club</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">W</th>
                      <th className="px-4 py-3 text-center">D</th>
                      <th className="px-4 py-3 text-center">L</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">GA</th>
                      <th className="px-4 py-3 text-center">GD</th>
                      <th className="px-4 py-3 text-center text-slate-900">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.table.map((row) => (
                      <tr key={row.team.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><span className="font-bold text-slate-500">{row.position}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={row.team.crest} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <span className="font-semibold text-slate-900 hidden sm:inline truncate">{row.team.name}</span>
                            <span className="font-semibold text-slate-900 sm:hidden">{row.team.tla}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.playedGames}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.won}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.draw}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.lost}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="px-4 py-3 text-center text-slate-600 tabular-nums">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-base tabular-nums text-slate-900">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Club</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">D</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">GA</th>
                <th className="px-4 py-3 text-center">GD</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Form</th>
                <th className="px-4 py-3 text-center text-slate-900">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.table.map((row) => {
                const zone = ZONES[competition]?.(row.position, standings.table.length) ?? null;
                const zoneStyle = zone ? ZONE_STYLE[zone].border : '';
                return (
                <tr
                  key={row.team.id}
                  className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${zoneStyle}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-500">{row.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={row.team.crest}
                        alt=""
                        className="w-5 h-5 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-semibold text-slate-900 hidden sm:inline truncate">{row.team.name}</span>
                      <span className="font-semibold text-slate-900 sm:hidden">{row.team.tla}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.playedGames}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.won}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.draw}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">{row.lost}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                  <td className="px-4 py-3 text-center text-slate-600 tabular-nums">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <FormDots form={row.form} />
                  </td>
                  <td className="px-4 py-3 text-center font-black text-base tabular-nums text-slate-900">{row.points}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {/* Zone legend */}
          {!CUP_CODES.includes(competition) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 border-t border-slate-200">
              {(Object.entries(ZONE_STYLE) as [NonNullable<Zone>, typeof ZONE_STYLE[NonNullable<Zone>]][])
                .filter(([zone]) => standings.table.some(r => ZONES[competition]?.(r.position, standings.table.length) === zone))
                .map(([, style]) => (
                  <span key={style.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    {style.label}
                  </span>
                ))
              }
            </div>
          )}
        </div>
        )
      ) : (
        <p className="text-center text-slate-400 py-12 text-sm">No table data available.</p>
      )}
    </div>
  );
};

export default StandingsTable;
