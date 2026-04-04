import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Match } from '../types';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  isFavouriteMatch?: boolean;
}

const COMP_SHORT: Record<string, string> = {
  PL: 'PL', CL: 'UCL', BL1: 'BUN', PD: 'LAL', SA: 'SA', FL1: 'L1',
};

const COMP_STYLES: Record<string, string> = {
  PL: 'bg-[rgba(0,255,133,0.12)] text-[#00ff85]',
  BL1: 'bg-[rgba(255,48,72,0.12)] text-[#ff6678]',
  FL1: 'bg-[rgba(22,217,255,0.12)] text-[#69e7ff]',
  SA: 'bg-[rgba(47,128,255,0.12)] text-[#77acff]',
  PD: 'bg-[rgba(255,138,0,0.12)] text-[#ffb45c]',
  CL: 'bg-[rgba(47,128,255,0.12)] text-[#77acff]',
};

const MatchCard: React.FC<MatchCardProps> = ({ match, isFavouriteMatch = false }) => {
  const navigate  = useNavigate();
  const isLive    = match.status === 'live';
  const isHT      = match.status === 'half_time';
  const isLiveAny = isLive || isHT;
  const isFT      = match.status === 'full_time';

  const compCode  = match.competition_code ?? 'PL';
  const compLabel = COMP_SHORT[compCode] ?? compCode;

  const statusNode = () => {
    if (isHT)   return <span className="text-orange-400 font-bold text-xs">HT</span>;
    if (isLive) return (
      <span className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        {match.minute ?? ''}'
      </span>
    );
    if (isFT)   return <span className="text-slate-500 font-semibold text-xs">FT</span>;
    return <span className="text-slate-400 font-medium text-xs">{format(new Date(match.match_date), 'HH:mm')}</span>;
  };

  const homeWon  = isFT && match.home_score > match.away_score;
  const awayWon  = isFT && match.away_score > match.home_score;
  const showScore = isFT || isLiveAny;

  const events      = match.events ?? [];
  const yellowCount = events.filter(e => e.type === 'yellow_card').length;
  const redCount    = events.filter(e => e.type === 'red_card').length;
  const showCards   = yellowCount + redCount > 0;

  return (
    <div
      className="card-hover group flex flex-col relative"
      style={isFavouriteMatch ? { boxShadow: '0 0 0 1px var(--league-accent)' } : undefined}
      onClick={() => navigate(`/match/${match.id}`)}
    >
      {/* Favourite indicator */}
      {isFavouriteMatch && (
        <div className="absolute top-2.5 right-2.5 pointer-events-none z-10">
          <Star className="w-3 h-3" style={{ color: 'var(--league-accent)', fill: 'var(--league-accent)' }} />
        </div>
      )}

      {/* Top strip */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/5">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          COMP_STYLES[compCode] ?? 'bg-white/10 text-slate-300'
        }`}>
          {compLabel}
        </span>
        <div>{statusNode()}</div>
      </div>

      {/* Teams */}
      <div className="px-4 py-3 space-y-3">
        {/* Home */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 shrink-0 flex items-center justify-center">
            {match.home_team.logo ? (
              <img src={match.home_team.logo} alt="" className="w-6 h-6 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : null}
          </div>
          <span className={`flex-1 text-sm truncate ${homeWon ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
            {match.home_team.name}
          </span>
          {showScore && (
            <span className={`text-lg font-black w-6 text-right tabular-nums ${homeWon ? 'text-white' : 'text-slate-400'}`}>
              {match.home_score}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 shrink-0 flex items-center justify-center">
            {match.away_team.logo ? (
              <img src={match.away_team.logo} alt="" className="w-6 h-6 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : null}
          </div>
          <span className={`flex-1 text-sm truncate ${awayWon ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
            {match.away_team.name}
          </span>
          {showScore && (
            <span className={`text-lg font-black w-6 text-right tabular-nums ${awayWon ? 'text-white' : 'text-slate-400'}`}>
              {match.away_score}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1 mt-auto">
        <span className="text-[11px] text-slate-600">
          {format(new Date(match.match_date), 'dd MMM')}
        </span>
        <div className="flex items-center gap-3">
          {match.matchday && match.competition_code !== 'CL' ? (
            <span className="text-[11px] text-slate-600">MW {match.matchday}</span>
          ) : null}

          {showCards ? (
            <span className="flex items-center gap-2 text-[11px] text-slate-600">
              {yellowCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" />
                  <span className="font-black tabular-nums">{yellowCount}</span>
                </span>
              )}
              {redCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-red-500" />
                  <span className="font-black tabular-nums">{redCount}</span>
                </span>
              )}
            </span>
          ) : !match.matchday && events.length > 0 ? (
            <span className="text-[11px] text-slate-600">{events.length} events</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
