import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Globe, MapPin, Shield, UserRound } from 'lucide-react';
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

interface PlayerProfile {
  position?: string;
  nationality?: string;
  date_of_birth?: string;
  shirt_number?: number | null;
  current_team?: { name: string; crest: string; contract_until?: string | null };
}

const ageFrom = (dob?: string) => {
  if (!dob) return null;
  const birth = parseISO(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

/** Squad row that expands into a player profile card on click. */
const PlayerRow: React.FC<{ player: SquadPlayer }> = ({ player }) => {
  const [expanded, setExpanded] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !profile) {
      apiService.getPlayerProfile(player.id).then(setProfile).catch(() => setProfile(null));
    }
  };

  const age = ageFrom(profile?.date_of_birth ?? player.date_of_birth);
  const shirt = profile?.shirt_number ?? player.shirt_number;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter') toggle(); }}
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-slate-400">
            {shirt ?? ''}
          </span>
          <p className="truncate text-sm font-semibold text-slate-800">{player.name}</p>
        </div>
        <p className="shrink-0 text-xs text-slate-400">{player.nationality}</p>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              { label: 'Position', value: profile?.position ?? player.position },
              { label: 'Age', value: age != null ? `${age}` : null },
              { label: 'Born', value: (profile?.date_of_birth ?? player.date_of_birth) ? format(parseISO((profile?.date_of_birth ?? player.date_of_birth)!), 'd MMM yyyy') : null },
              { label: 'Nationality', value: profile?.nationality ?? player.nationality },
              { label: 'Contract until', value: profile?.current_team?.contract_until },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label}>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{f.label}</p>
                <p className="text-sm text-slate-700">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const resultLabel = (m: TeamMatch) => {
  if (!m.score.winner) return null;
  if (m.score.winner === 'DRAW') return { text: 'D', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
  const won = (m.score.winner === 'HOME_TEAM' && m.is_home) || (m.score.winner === 'AWAY_TEAM' && !m.is_home);
  return won
    ? { text: 'W', cls: 'bg-green-50 text-green-700 border border-green-200' }
    : { text: 'L', cls: 'bg-red-50 text-red-700 border border-red-200' };
};

const MatchRow: React.FC<{ m: TeamMatch; isResult: boolean }> = ({ m, isResult }) => {
  const result = isResult ? resultLabel(m) : null;
  const events = m.events ?? [];
  const yellowCount = events.filter((e) => e.type === 'yellow_card').length;
  const redCount = events.filter((e) => e.type === 'red_card').length;
  const showCards = yellowCount + redCount > 0;

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        {m.competition_emblem && (
          <img
            src={m.competition_emblem}
            alt=""
            className="w-4 h-4 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="text-[11px] text-slate-400 truncate hidden sm:inline">{m.competition}</span>
      </div>

      <span className="text-xs text-slate-400 w-16 shrink-0 tabular-nums">
        {format(parseISO(m.date), 'dd MMM')}
      </span>

      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className={`text-sm truncate ${m.is_home ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
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
            <span className="font-black text-slate-900 text-sm tabular-nums">
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
          <span className="text-xs text-slate-500 tabular-nums">{format(parseISO(m.date), 'HH:mm')}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <img
          src={m.away_team.crest}
          alt=""
          className="w-5 h-5 object-contain shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span className={`text-sm truncate ${!m.is_home ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
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
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-4 mx-auto text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-slate-400">Failed to load team history.</p>
      </div>
    );
  }

  const { team, stats } = data;
  const club = details?.club;
  const coach = details?.coach;

  const statCards: { label: string; value: React.ReactNode; cls: string }[] = [
    { label: 'Played', value: stats.played, cls: 'text-slate-900' },
    { label: 'Wins', value: stats.wins, cls: 'text-green-600' },
    { label: 'Draws', value: stats.draws, cls: 'text-amber-600' },
    { label: 'Losses', value: stats.losses, cls: 'text-red-600' },
    { label: 'GF', value: stats.goals_for, cls: 'text-slate-900' },
    { label: 'GA', value: stats.goals_against, cls: 'text-slate-900' },
    {
      label: 'GD',
      value: stats.goal_difference > 0 ? `+${stats.goal_difference}` : stats.goal_difference,
      cls: stats.goal_difference >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-5 font-medium text-sm transition-colors">
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
            <h2 className="text-xl font-black text-slate-900">
              {team.name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Club profile, recent form, fixtures, and squad</p>
          </div>
        </div>

        <div className="flex flex-wrap divide-x divide-slate-200 border-y border-slate-200 mb-4">
          {statCards.map(({ label, value, cls }) => (
            <div key={label} className="flex-1 min-w-[11%] text-center py-3">
              <p className={`text-xl font-black ${cls}`}>{value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {club && (
          <div className="divide-y divide-slate-100">
            {club.venue && (
              <div className="flex items-center gap-3 py-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 w-20 shrink-0">Venue</p>
                <p className="text-sm text-slate-700">{club.venue}</p>
              </div>
            )}
            {coach?.name && (
              <div className="flex items-center gap-3 py-3">
                <UserRound className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 w-20 shrink-0">Coach</p>
                <p className="text-sm text-slate-700">
                  {coach.name}
                  {coach.nationality && <span className="text-slate-400"> · {coach.nationality}</span>}
                </p>
              </div>
            )}
            {(club.founded || club.club_colors) && (
              <div className="flex items-center gap-3 py-3">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 w-20 shrink-0">Club Info</p>
                <p className="text-sm text-slate-700">
                  {club.founded && `Founded ${club.founded}`}
                  {club.founded && club.club_colors && <span className="text-slate-400"> · </span>}
                  {club.club_colors}
                </p>
              </div>
            )}
            {club.website && (
              <div className="flex items-center gap-3 py-3">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 w-20 shrink-0">Website</p>
                <a href={club.website} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-slate-900 hover:underline">
                  Visit club site
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          {(['results', 'upcoming', 'squad'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${
                view === v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {v === 'results' ? 'Recent Results' : v === 'upcoming' ? 'Upcoming Fixtures' : 'Squad'}
            </button>
          ))}
        </div>

        <div>
          {view === 'results' && (
            data.results.length === 0
              ? <p className="text-center text-slate-400 py-10 text-sm">No recent results found.</p>
              : [...data.results].reverse().map((m) => <MatchRow key={m.id} m={m} isResult />)
          )}

          {view === 'upcoming' && (
            data.upcoming.length === 0
              ? <p className="text-center text-slate-400 py-10 text-sm">No upcoming fixtures found.</p>
              : data.upcoming.map((m) => <MatchRow key={m.id} m={m} isResult={false} />)
          )}

          {view === 'squad' && (
            squadGroups.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">Squad data is unavailable for this club right now.</p>
            ) : (
              <div>
                {squadGroups.map((group) => (
                  <div key={group.position}>
                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{group.position}</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {group.players.map((player) => (
                        <PlayerRow key={player.id} player={player} />
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
