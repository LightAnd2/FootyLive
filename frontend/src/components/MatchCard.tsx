import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Match } from '../types';
import { format, isToday } from 'date-fns';
import { Star } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  isFavouriteMatch?: boolean;
}

/** A single dense match row: status/time column, home team, score, away team. */
const MatchCard: React.FC<MatchCardProps> = ({ match, isFavouriteMatch = false }) => {
  const navigate  = useNavigate();
  const isLive    = match.status === 'live';
  const isHT      = match.status === 'half_time';
  const isLiveAny = isLive || isHT;
  const isFT      = match.status === 'full_time';

  const kickoff = new Date(match.match_date);

  const statusNode = () => {
    if (isHT)   return <span className="text-xs font-bold text-orange-600">HT</span>;
    if (isLive) return (
      <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        {match.minute ?? ''}'
      </span>
    );
    if (isFT) return (
      <span className="flex flex-col items-center leading-tight">
        <span className="text-xs font-semibold text-slate-500">FT</span>
        {!isToday(kickoff) && <span className="text-[10px] text-slate-400">{format(kickoff, 'dd MMM')}</span>}
      </span>
    );
    return (
      <span className="flex flex-col items-center leading-tight">
        <span className="text-xs font-medium text-slate-600">{format(kickoff, 'HH:mm')}</span>
        {!isToday(kickoff) && <span className="text-[10px] text-slate-400">{format(kickoff, 'dd MMM')}</span>}
      </span>
    );
  };

  const hasPens  = isFT && match.penalty_home != null && match.penalty_away != null;
  const homeWon  = isFT && (match.home_score > match.away_score || (hasPens && match.penalty_home! > match.penalty_away!));
  const awayWon  = isFT && (match.away_score > match.home_score || (hasPens && match.penalty_away! > match.penalty_home!));
  const showScore = isFT || isLiveAny;

  const Crest: React.FC<{ src?: string | null }> = ({ src }) => (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      {src ? (
        <img src={src} alt="" className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : null}
    </span>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/match/${match.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/match/${match.id}`); }}
      className="group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-4"
    >
      {/* Status / kickoff */}
      <div className="w-12 shrink-0 text-center">{statusNode()}</div>

      <div className="h-6 w-px shrink-0 bg-slate-100" />

      {/* Home */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className={`truncate text-sm ${homeWon ? 'font-bold text-slate-900' : isFT && !homeWon ? 'text-slate-500' : 'font-medium text-slate-800'}`}>
          {match.home_team.name}
        </span>
        <Crest src={match.home_team.logo} />
      </div>

      {/* Score / vs */}
      {showScore ? (
        <div className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-sm font-bold tabular-nums ${isLiveAny ? 'bg-red-50 text-red-600' : 'text-slate-900'}`}>
          <span>{match.home_score}</span>
          {hasPens && <span className="text-[10px] font-medium text-slate-400">({match.penalty_home})</span>}
          <span className="text-slate-300">–</span>
          <span>{match.away_score}</span>
          {hasPens && <span className="text-[10px] font-medium text-slate-400">({match.penalty_away})</span>}
        </div>
      ) : (
        <div className="shrink-0 px-1.5 text-xs text-slate-300">vs</div>
      )}

      {/* Away */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Crest src={match.away_team.logo} />
        <span className={`truncate text-sm ${awayWon ? 'font-bold text-slate-900' : isFT && !awayWon ? 'text-slate-500' : 'font-medium text-slate-800'}`}>
          {match.away_team.name}
        </span>
      </div>

      {/* Favourite */}
      <div className="w-5 shrink-0">
        {isFavouriteMatch && (
          <Star className="h-3.5 w-3.5" style={{ color: 'var(--league-accent)', fill: 'var(--league-accent)' }} />
        )}
      </div>
    </div>
  );
};

export default MatchCard;
