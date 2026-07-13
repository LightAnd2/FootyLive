import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeadToHead, Match } from '../types';
import { apiService } from '../services/api';
import { ArrowLeft, ArrowLeftRight, Goal, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import ErrorMessage from './ErrorMessage';

function EventIcon({ type }: { type: string }) {
  if (type === 'goal')         return <Goal className="w-4 h-4 text-slate-700 shrink-0" title="Goal" />;
  if (type === 'yellow_card')  return <span className="inline-block w-2.5 h-3.5 rounded-sm bg-yellow-400 shrink-0" title="Yellow card" />;
  if (type === 'red_card')     return <span className="inline-block w-2.5 h-3.5 rounded-sm bg-red-500 shrink-0" title="Red card" />;
  if (type === 'substitution') return <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" title="Substitution" />;
  return <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0 inline-block" />;
}

const MatchDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch]     = useState<Match | null>(null);
  const [h2h, setH2h]         = useState<HeadToHead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatch = (showLoader = false) => {
    if (!id) return;
    if (showLoader) setLoading(true);
    apiService.getMatchById(parseInt(id))
      .then((m) => { setMatch(m); setLastRefresh(new Date()); setError(null); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load match'))
      .finally(() => { if (showLoader) setLoading(false); });
  };

  useEffect(() => {
    fetchMatch(true);
    if (id) {
      apiService.getMatchH2H(parseInt(id)).then(setH2h).catch(() => setH2h(null));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-refresh every 30s while match is live
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const isLive = match?.status === 'live' || match?.status === 'half_time';
    if (isLive) {
      intervalRef.current = setInterval(() => fetchMatch(false), 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.status]);

  if (loading) return (
    <div className="glass-effect rounded-2xl px-5 py-8 text-center text-sm text-slate-400">
      Loading match details...
    </div>
  );
  if (error || !match) return (
    <ErrorMessage message={error || 'Match not found'} onRetry={() => fetchMatch(true)} />
  );

  const isLive     = match.status === 'live' || match.status === 'half_time';
  const isFinished = match.status === 'full_time';
  const showScore  = isLive || isFinished;
  const isCup      = ['CL', 'EC', 'WC'].includes(match.competition_code);

  const homeGoals = match.events.filter(e => e.is_home && e.type === 'goal').sort((a, b) => a.minute - b.minute);
  const awayGoals = match.events.filter(e => !e.is_home && e.type === 'goal').sort((a, b) => a.minute - b.minute);
  const allEvents = [...match.events].sort((a, b) => a.minute - b.minute);

  const metaParts = [
    match.venue,
    match.referee ? `Referee: ${match.referee}` : null,
  ].filter(Boolean);

  const ScorerList: React.FC<{ goals: typeof homeGoals; align: 'left' | 'right' }> = ({ goals, align }) => (
    <div className={`mt-2 space-y-0.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {goals.map(e => (
        <p key={e.id} className="text-xs text-slate-500">
          {e.player_name} <span className="text-slate-400">{e.minute}'</span>
        </p>
      ))}
    </div>
  );

  const TeamColumn: React.FC<{ side: 'home' | 'away' }> = ({ side }) => {
    const team = side === 'home' ? match.home_team : match.away_team;
    const goals = side === 'home' ? homeGoals : awayGoals;
    return (
      <div className="text-center">
        {team.logo ? (
          <img src={team.logo} alt={team.name}
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto mb-2.5"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2.5">
            <span className="text-xl font-black text-slate-500">{team.short_name?.charAt(0)}</span>
          </div>
        )}
        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
          {team.name}
        </h3>
        {showScore && goals.length > 0 && <ScorerList goals={goals} align="left" />}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to matches
        </button>
        {isLive && (
          <button
            onClick={() => fetchMatch(false)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Updated {format(lastRefresh, 'HH:mm:ss')}
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="card mb-3 px-6 py-6">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          {match.competition_name}
          {match.matchday != null && ` · ${isCup ? 'Round' : 'Matchweek'} ${match.matchday}`}
        </p>

        <div className="flex items-center justify-center mb-5">
          {isLive ? (
            <span className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {match.status === 'half_time' ? 'HALF TIME' : `LIVE ${match.minute ?? ''}'`}
            </span>
          ) : isFinished ? (
            <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
              FULL TIME
            </span>
          ) : (
            <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
              {format(new Date(match.match_date), 'HH:mm · EEE d MMM')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          <TeamColumn side="home" />

          <div className="pt-3 text-center">
            {showScore ? (
              <div>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tabular-nums">
                  {match.home_score}<span className="text-slate-300 mx-1.5">–</span>{match.away_score}
                </div>
                {match.penalty_home != null && match.penalty_away != null && (
                  <div className="text-xs text-slate-400 mt-2 tabular-nums">
                    {match.penalty_home}–{match.penalty_away} on penalties
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xl font-bold text-slate-300">vs</div>
            )}
          </div>

          <TeamColumn side="away" />
        </div>

        {metaParts.length > 0 && (
          <p className="mt-5 border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
            {metaParts.join(' · ')}
          </p>
        )}
      </div>

      {/* Head to head */}
      {h2h && h2h.total_matches > 0 && (
        <div className="card mb-3">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Head to Head</span>
            <span className="text-[11px] text-slate-400">Last {h2h.total_matches} meetings</span>
          </div>

          <div className="px-4 pt-4 pb-2">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{h2h.home.name} <span className="font-black text-slate-900">{h2h.home.wins}</span></span>
              <span className="text-slate-400">Draws {h2h.draws}</span>
              <span><span className="font-black text-slate-900">{h2h.away.wins}</span> {h2h.away.name}</span>
            </div>
            <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
              <div className="bg-slate-800" style={{ flexGrow: Math.max(h2h.home.wins, 0.01) }} />
              <div className="bg-slate-200" style={{ flexGrow: Math.max(h2h.draws, 0.01) }} />
              <div style={{ flexGrow: Math.max(h2h.away.wins, 0.01), backgroundColor: 'var(--league-accent)' }} />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {h2h.matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-16 shrink-0 text-[11px] text-slate-400">{format(new Date(m.date), 'dd MMM yy')}</span>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <span className="truncate text-sm text-slate-700">{m.home_team.name}</span>
                  <img src={m.home_team.crest} alt="" className="h-4 w-4 shrink-0 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-slate-900">
                  {m.score.home}–{m.score.away}
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <img src={m.away_team.crest} alt="" className="h-4 w-4 shrink-0 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span className="truncate text-sm text-slate-700">{m.away_team.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full timeline */}
      {allEvents.length > 0 && (
        <div className="card">
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Match Timeline</span>
          </div>
          <div className="divide-y divide-slate-100">
            {allEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  event.is_home ? '' : 'flex-row-reverse text-right'
                }`}
              >
                <span className="text-xs font-bold text-slate-400 w-9 text-center shrink-0 tabular-nums">
                  {event.minute}'
                </span>
                <div className="shrink-0">
                  <EventIcon type={event.type} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{event.player_name}</p>
                  {event.description && event.description !== event.player_name && (
                    <p className="text-xs text-slate-400 truncate">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
