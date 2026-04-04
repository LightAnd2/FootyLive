import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Globe, MapPin, UserRound } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { apiService } from '../services/api';
import type { LeagueCode } from '../constants/leagues';

interface TeamMatch {
  id: number;
  competition: string;
  competition_emblem: string;
  date: string;
  status: string;
  home_team: { id: number; name: string; tla: string; crest: string };
  away_team: { id: number; name: string; tla: string; crest: string };
  score: { home: number | null; away: number | null; winner: string | null };
  is_home: boolean;
  events?: { id: number; type: string }[];
}

interface TeamHistoryData {
  team: { id: number; name: string; short_name: string; logo: string };
  stats: {
    played: number; wins: number; draws: number; losses: number;
    goals_for: number; goals_against: number; goal_difference: number; clean_sheets?: number;
  };
  results: TeamMatch[];
  upcoming: TeamMatch[];
}

interface SquadPlayer {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  nationality?: string;
  position?: string;
  shirt_number?: number | null;
}

interface TeamDetailData {
  club: {
    id: number;
    name: string;
    short_name: string;
    crest: string;
    founded?: number;
    venue?: string;
    website?: string;
    address?: string;
    club_colors?: string;
  };
  coach: {
    name?: string;
    nationality?: string;
    date_of_birth?: string;
  };
  squad: SquadPlayer[];
}

interface Props {
  teamId: number;
  competition: LeagueCode;
  onBack: () => void;
}

const resultLabel = (m: TeamMatch) => {
  if (!m.score.winner) return null;
  if (m.score.winner === 'DRAW') return { text: 'D', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' };
  const won = (m.score.winner === 'HOME_TEAM' && m.is_home) || (m.score.winner === 'AWAY_TEAM' && !m.is_home);
  return won
    ? { text: 'W', cls: 'bg-green-500/20 text-green-400 border border-green-500/30' }
    : { text: 'L', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' };
};

const MatchRow: React.FC<{ m: TeamMatch; isResult: boolean }> = ({ m, isResult }) => {
  const result = isResult ? resultLabel(m) : null;
  const events = m.events ?? [];
  const yellowCount = events.filter((e) => e.type === 'yellow_card').length;
  const redCount = events.filter((e) => e.type === 'red_card').length;
  const showCards = yellowCount + redCount > 0;

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        {m.competition_emblem && (
          <img
            src={m.competition_emblem}
            alt=""
            className="w-4 h-4 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="text-[11px] text-slate-500 truncate hidden sm:inline">{m.competition}</span>
      </div>

      <span className="text-xs text-slate-500 w-16 shrink-0 tabular-nums">
        {format(parseISO(m.date), 'dd MMM')}
      </span>

      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className={`text-sm truncate ${m.is_home ? 'text-white font-semibold' : 'text-slate-400'}`}>
          {m.home_team.name}
        </span>
        <img
          src={m.home_team.crest}
          alt=""
          className="w-5 h-5 object-contain shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      <div className="text-center w-14 shrink-0">
        {isResult && m.score.home !== null ? (
          <div className="flex flex-col items-center">
            <span className="font-black text-white text-sm tabular-nums">
              {m.score.home} - {m.score.away}
            </span>
            {showCards && (
              <span className="flex items-center gap-2 mt-1">
                {yellowCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-sm bg-yellow-400" />
                    <span className="text-[10px] font-black tabular-nums">{yellowCount}</span>
                  </span>
                )}
                {redCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-sm bg-red-500" />
                    <span className="text-[10px] font-black tabular-nums">{redCount}</span>
                  </span>
                )}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 tabular-nums">{format(parseISO(m.date), 'HH:mm')}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <img
          src={m.away_team.crest}
          alt=""
          className="w-5 h-5 object-contain shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span className={`text-sm truncate ${!m.is_home ? 'text-white font-semibold' : 'text-slate-400'}`}>
          {m.away_team.name}
        </span>
      </div>

      {result && (
        <div className={`w-7 h-7 rounded-lg ${result.cls} flex items-center justify-center text-xs font-black shrink-0`}>
          {result.text}
        </div>
      )}
    </div>
  );
};

const TeamHistory: React.FC<Props> = ({ teamId, competition, onBack }) => {
  const [data, setData] = useState<TeamHistoryData | null>(null);
  const [details, setDetails] = useState<TeamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'results' | 'upcoming' | 'squad'>('results');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiService.getTeamHistory(teamId),
      apiService.getTeamDetails(teamId, competition).catch(() => null),
    ])
      .then(([history, teamDetails]) => {
        setData(history);
        setDetails(teamDetails);
      })
      .catch(() => {
        setData(null);
        setDetails(null);
      })
      .finally(() => setLoading(false));
  }, [teamId, competition]);

  const squadGroups = useMemo(() => {
    const players = details?.squad ?? [];
    const groups = new Map<string, SquadPlayer[]>();
    players.forEach((player) => {
      const key = player.position || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(player);
    });
    return Array.from(groups.entries()).map(([position, playersForPosition]) => ({
      position,
      players: playersForPosition.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [details]);

  if (loading) return <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">Loading club profile...</div>;
  if (!data) {
    return (
      <div className="text-center py-12">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 mx-auto text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-slate-500">Failed to load team history.</p>
      </div>
    );
  }

  const { team, stats } = data;
  const club = details?.club;
  const coach = details?.coach;

  const statCards: { label: string; value: React.ReactNode; cls: string }[] = [
    { label: 'Played', value: stats.played, cls: 'text-slate-100' },
    { label: 'Wins', value: stats.wins, cls: 'text-green-400' },
    { label: 'Draws', value: stats.draws, cls: 'text-yellow-400' },
    { label: 'Losses', value: stats.losses, cls: 'text-red-400' },
    { label: 'GF', value: stats.goals_for, cls: 'text-slate-100' },
    { label: 'GA', value: stats.goals_against, cls: 'text-slate-100' },
    {
      label: 'GD',
      value: stats.goal_difference > 0 ? `+${stats.goal_difference}` : stats.goal_difference,
      cls: stats.goal_difference >= 0 ? 'text-green-400' : 'text-red-400',
    },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 font-medium text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="glass-effect rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-5">
          {team.logo && (
            <img
              src={team.logo}
              alt={team.name}
              className="w-14 h-14 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {team.name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Club profile, recent form, fixtures, and squad</p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
          {statCards.map(({ label, value, cls }) => (
            <div key={label} className="text-center bg-white/5 rounded-xl py-3 border border-white/8">
              <p className={`text-xl font-black ${cls}`}>{value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {club && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {club.venue && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Venue</p>
                <p className="text-sm text-slate-200 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" />{club.venue}</p>
              </div>
            )}
            {coach?.name && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Coach</p>
                <p className="text-sm text-slate-200 flex items-center gap-2"><UserRound className="w-4 h-4 text-slate-500" />{coach.name}</p>
                {coach.nationality && <p className="text-xs text-slate-500 mt-1">{coach.nationality}</p>}
              </div>
            )}
            {(club.founded || club.club_colors) && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Club Info</p>
                {club.founded && <p className="text-sm text-slate-200">Founded {club.founded}</p>}
                {club.club_colors && <p className="text-xs text-slate-500 mt-1">{club.club_colors}</p>}
              </div>
            )}
            {club.website && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Website</p>
                <a href={club.website} target="_blank" rel="noreferrer" className="text-sm text-slate-200 inline-flex items-center gap-2 hover:text-white">
                  <Globe className="w-4 h-4 text-slate-500" />
                  Visit club site
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {(['results', 'upcoming', 'squad'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${
                view === v ? 'text-[#0d1117]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={view === v ? { backgroundColor: 'var(--league-accent)' } : undefined}
            >
              {v === 'results' ? 'Recent Results' : v === 'upcoming' ? 'Upcoming Fixtures' : 'Squad'}
            </button>
          ))}
        </div>

        <div>
          {view === 'results' && (
            data.results.length === 0
              ? <p className="text-center text-slate-500 py-10 text-sm">No recent results found.</p>
              : [...data.results].reverse().map((m) => <MatchRow key={m.id} m={m} isResult />)
          )}

          {view === 'upcoming' && (
            data.upcoming.length === 0
              ? <p className="text-center text-slate-500 py-10 text-sm">No upcoming fixtures found.</p>
              : data.upcoming.map((m) => <MatchRow key={m.id} m={m} isResult={false} />)
          )}

          {view === 'squad' && (
            squadGroups.length === 0 ? (
              <p className="text-center text-slate-500 py-10 text-sm">Squad data is unavailable for this club right now.</p>
            ) : (
              <div className="p-4 space-y-4">
                {squadGroups.map((group) => (
                  <div key={group.position} className="bg-white/3 rounded-xl border border-white/8 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8 bg-white/5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{group.position}</p>
                    </div>
                    <div className="divide-y divide-white/5">
                      {group.players.map((player) => (
                        <div key={player.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{player.name}</p>
                            <p className="text-xs text-slate-500">
                              {[player.nationality, player.date_of_birth ? format(parseISO(player.date_of_birth), 'd MMM yyyy') : null].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamHistory;
