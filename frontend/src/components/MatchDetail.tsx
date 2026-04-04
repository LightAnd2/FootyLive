import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match } from '../types';
import { apiService } from '../services/api';
import { ArrowLeft, CalendarDays, MapPin, Shield, RefreshCw, User } from 'lucide-react';
import { format } from 'date-fns';
import ErrorMessage from './ErrorMessage';

function EventIcon({ type }: { type: string }) {
  if (type === 'goal')         return <span className="text-base leading-none" title="Goal">⚽</span>;
  if (type === 'yellow_card')  return <span className="inline-block w-2.5 h-3.5 rounded-sm bg-yellow-400 shrink-0" title="Yellow card" />;
  if (type === 'red_card')     return <span className="inline-block w-2.5 h-3.5 rounded-sm bg-red-500 shrink-0" title="Red card" />;
  if (type === 'substitution') return <span className="text-base leading-none" title="Substitution">🔄</span>;
  return <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0 inline-block" />;
}

const MatchDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch]     = useState<Match | null>(null);
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

  const homeGoals = match.events.filter(e => e.is_home && e.type === 'goal').sort((a, b) => a.minute - b.minute);
  const awayGoals = match.events.filter(e => !e.is_home && e.type === 'goal').sort((a, b) => a.minute - b.minute);
  const allEvents = [...match.events].sort((a, b) => a.minute - b.minute);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to matches
        </button>
        {isLive && (
          <button
            onClick={() => fetchMatch(false)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Updated {format(lastRefresh, 'HH:mm:ss')}
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="glass-effect rounded-2xl p-6 mb-4">
        {(match.competition_name || match.matchday) && (
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {match.competition_name}
            {match.matchday != null && (
              <span>
                {' · '}
                {match.competition_code === 'CL' ? `Round ${match.matchday}` : `Matchweek ${match.matchday}`}
              </span>
            )}
          </p>
        )}

        {/* Status badge */}
        <div className="flex items-center justify-center mb-5">
          {isLive ? (
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {match.status === 'half_time' ? 'HALF TIME' : `LIVE ${match.minute ?? ''}'`}
            </span>
          ) : isFinished ? (
            <span className="px-4 py-1.5 rounded-lg bg-white/8 border border-white/10 text-slate-400 font-bold text-sm">
              FULL TIME
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold text-sm">
              {format(new Date(match.match_date), 'HH:mm · EEE d MMM')}
            </span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-center">
            {match.home_team.logo ? (
              <img src={match.home_team.logo} alt={match.home_team.name}
                className="w-16 h-16 object-contain mx-auto mb-3"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/8 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-black text-slate-400">{match.home_team.short_name?.charAt(0)}</span>
              </div>
            )}
            <h3 className="font-black text-white text-sm sm:text-base" style={{ fontFamily: 'Orbitron, monospace' }}>
              {match.home_team.name}
            </h3>
          </div>

          <div className="text-center">
            {showScore ? (
              <div className="text-5xl sm:text-6xl font-black text-white tabular-nums" style={{ fontFamily: 'Orbitron, monospace' }}>
                {match.home_score}<span className="text-slate-600 mx-1">–</span>{match.away_score}
              </div>
            ) : (
              <div className="text-2xl font-black text-slate-500">vs</div>
            )}
          </div>

          <div className="text-center">
            {match.away_team.logo ? (
              <img src={match.away_team.logo} alt={match.away_team.name}
                className="w-16 h-16 object-contain mx-auto mb-3"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/8 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-black text-slate-400">{match.away_team.short_name?.charAt(0)}</span>
              </div>
            )}
            <h3 className="font-black text-white text-sm sm:text-base" style={{ fontFamily: 'Orbitron, monospace' }}>
              {match.away_team.name}
            </h3>
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500">
            <MapPin className="w-3 h-3" />
            <span>{match.venue}</span>
          </div>
        )}
      </div>

      {/* Info row */}
      <div className={`grid gap-3 mb-4 ${match.referee ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Competition</p>
          <p className="text-sm text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500 shrink-0" />
            {match.competition_name || 'League Match'}
          </p>
          {match.matchday != null && (
            <p className="text-xs text-slate-500 mt-1">
              {match.competition_code === 'CL' ? `Round ${match.matchday}` : `Matchweek ${match.matchday}`}
            </p>
          )}
        </div>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Kickoff</p>
          <p className="text-sm text-slate-200 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
            {format(new Date(match.match_date), 'EEE d MMM · HH:mm')}
          </p>
        </div>
        <div className="glass-effect rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Status</p>
          <p className="text-sm text-slate-200">
            {isLive
              ? match.status === 'half_time' ? 'Half Time' : `Live — ${match.minute ?? '?'}'`
              : isFinished ? 'Full Time'
              : 'Scheduled'}
          </p>
        </div>
        {match.referee && (
          <div className="glass-effect rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Referee</p>
            <p className="text-sm text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              {match.referee}
            </p>
          </div>
        )}
      </div>

      {/* Goal scorers */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="glass-effect rounded-2xl p-5 mb-4">
          <h3 className="font-black text-white uppercase tracking-wider text-sm mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            Goals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">{match.home_team.short_name}</p>
              <div className="space-y-1.5">
                {homeGoals.map(e => (
                  <p key={e.id} className="text-sm text-slate-300 flex items-center gap-2">
                    <span>⚽</span>
                    <span>{e.player_name}</span>
                    <span className="text-slate-600 text-xs">{e.minute}'</span>
                  </p>
                ))}
                {homeGoals.length === 0 && <p className="text-xs text-slate-600">—</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">{match.away_team.short_name}</p>
              <div className="space-y-1.5">
                {awayGoals.map(e => (
                  <p key={e.id} className="text-sm text-slate-300 flex items-center justify-end gap-2">
                    <span className="text-slate-600 text-xs">{e.minute}'</span>
                    <span>{e.player_name}</span>
                    <span>⚽</span>
                  </p>
                ))}
                {awayGoals.length === 0 && <p className="text-xs text-slate-600">—</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full timeline */}
      {allEvents.length > 0 && (
        <div className="glass-effect rounded-2xl p-5">
          <h3 className="font-black text-white uppercase tracking-wider text-sm mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            Match Timeline
          </h3>
          <div className="space-y-0.5">
            {allEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors ${
                  event.is_home ? '' : 'flex-row-reverse text-right'
                }`}
              >
                <span className="text-xs font-bold text-slate-600 w-9 text-center shrink-0 tabular-nums">
                  {event.minute}'
                </span>
                <div className="shrink-0">
                  <EventIcon type={event.type} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 text-sm truncate">{event.player_name}</p>
                  {event.description && event.description !== event.player_name && (
                    <p className="text-xs text-slate-500 truncate">{event.description}</p>
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
