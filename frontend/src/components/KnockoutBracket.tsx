import React, { useEffect, useState, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import api from '../services/api';
import { LEAGUE_MAP, type LeagueCode } from '../constants/leagues';

interface KnockoutBracketProps {
  competition: LeagueCode;
  /** Archived season label (e.g. "2025-26"), or null/undefined for the live season. */
  season?: string | null;
}

interface BracketMatch {
  id: number;
  date: string;
  status: string;
  stage: string;
  home_team: { id: number; name: string; short_name?: string; tla: string; crest: string };
  away_team: { id: number; name: string; short_name?: string; tla: string; crest: string };
  score: { home: number | null; away: number | null; winner: string | null; penalty_home?: number | null; penalty_away?: number | null };
}

interface BracketRound {
  stage: string;
  label: string;
  matches: BracketMatch[];
}

interface BracketTie {
  id: number;
  date: string;
  status: string;
  stage: string;
  home_team: { id: number; name: string; short_name?: string; tla: string; crest: string };
  away_team: { id: number; name: string; short_name?: string; tla: string; crest: string };
  score: { home: number | null; away: number | null; winner: string | null; penalty_home?: number | null; penalty_away?: number | null };
  legs: BracketMatch[];
}

/** Knockout stage order, earliest first, for each competition that has a bracket. */
export const BRACKET_ORDER: Partial<Record<LeagueCode, string[]>> = {
  CL: ['KNOCKOUT_ROUND_PLAY_OFFS', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
  EC: ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
  WC: ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'],
};

const STAGE_TITLES: Record<string, string> = {
  KNOCKOUT_ROUND_PLAY_OFFS: 'Play-offs',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final',
};

/** Per-cup presentation: backdrop, accents that read on the stage vs. on white cards. */
interface CupTheme {
  venue: string;
  /** Plain white panel instead of a dark backdrop. */
  light?: boolean;
  backgroundImage?: string;
  /** Tint layered over the photo, or the whole backdrop when there is no photo. */
  overlay?: string;
  /** Accent used on the dark backdrop (headings, trophy, dividers). */
  bright: string;
  /** Accent used inside white cards (winner bar, score chips). */
  deep: string;
  deepSoft: string;
  trophyImage?: string;
}

const CUP_THEMES: Partial<Record<LeagueCode, CupTheme>> = {
  CL: {
    venue: 'Budapest 26',
    backgroundImage: '/ucl_background.jpg',
    overlay: 'linear-gradient(165deg, rgba(2,6,23,0.92) 0%, rgba(8,18,52,0.86) 48%, rgba(2,6,23,0.94) 100%)',
    bright: '#7ab8ff',
    deep: '#1d4ed8',
    deepSoft: 'rgba(29, 78, 216, 0.10)',
    trophyImage: '/ucl-trophy.png',
  },
  EC: {
    venue: 'Berlin 24',
    light: true,
    bright: '#4338ca',
    deep: '#4338ca',
    deepSoft: 'rgba(67, 56, 202, 0.10)',
    trophyImage: 'https://crests.football-data.org/ec.png',
  },
  WC: {
    venue: 'New Jersey 26',
    backgroundImage: '/worldcup_background.jpg',
    overlay: 'linear-gradient(160deg, rgba(4,8,20,0.88) 0%, rgba(6,14,36,0.82) 45%, rgba(3,6,16,0.92) 100%)',
    bright: '#e8c766',
    deep: '#a3801a',
    deepSoft: 'rgba(201, 162, 39, 0.12)',
    trophyImage: '/worldcup_logo.png',
  },
};

const createPlaceholderTie = (id: number, stage: string): BracketTie => ({
  id,
  date: '',
  status: 'SCHEDULED',
  stage,
  home_team: { id: 0, name: 'TBD', tla: 'TBD', crest: '' },
  away_team: { id: 0, name: 'TBD', tla: 'TBD', crest: '' },
  score: { home: null, away: null, winner: null },
  legs: [],
});

const hasResolvedTeams = (tie?: BracketTie | null) =>
  Boolean(tie && (tie.home_team?.id || tie.away_team?.id));

const normaliseTie = (tie: BracketTie): BracketTie => ({
  ...tie,
  home_team: tie.home_team?.id ? tie.home_team : { id: 0, name: 'TBD', tla: 'TBD', crest: '' },
  away_team: tie.away_team?.id ? tie.away_team : { id: 0, name: 'TBD', tla: 'TBD', crest: '' },
});

const uniqueById = (matches: BracketTie[]) =>
  Array.from(new Map(matches.map((match) => [match.id, match])).values());

/**
 * Builds a left/right knockout tree from flat per-stage results.
 *
 * The API gives no bracket-slot data, so once a round's participants are
 * known we trace each tie back to whichever earlier-round tie shares a team
 * (same approach a human would use reading a fixture list). The one stage we
 * can't trace — the round two steps before the final, whose semi-final spot
 * isn't decided yet — is split left/right by kickoff order instead.
 */
const buildBracketTree = (rounds: BracketRound[], order: string[]) => {
  const byStage = new Map(rounds.map((round) => [round.stage, round.matches as unknown as BracketTie[]]));

  const finalStage = order[order.length - 1];
  const semiStage = order[order.length - 2];
  const finalRound = byStage.get(finalStage) ?? [];
  const semis = byStage.get(semiStage) ?? [];

  const leftSemiFinal = hasResolvedTeams(semis[0]) ? normaliseTie(semis[0]) : createPlaceholderTie(-101, semiStage);
  const rightSemiFinal = hasResolvedTeams(semis[1]) ? normaliseTie(semis[1]) : createPlaceholderTie(-102, semiStage);
  const finalTie = hasResolvedTeams(finalRound[0]) ? normaliseTie(finalRound[0]) : createPlaceholderTie(-103, finalStage);

  const columns: { stage: string; left: BracketTie[]; right: BracketTie[] }[] = [];

  const anchorIndex = order.length - 3;
  if (anchorIndex >= 0) {
    const anchorStage = order[anchorIndex];
    const anchorMatches = [...(byStage.get(anchorStage) ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const half = Math.ceil(anchorMatches.length / 2);
    let left = anchorMatches.slice(0, half);
    let right = anchorMatches.slice(half);
    columns.unshift({ stage: anchorStage, left, right });

    for (let i = anchorIndex - 1; i >= 0; i--) {
      const stage = order[i];
      const stageMatches = byStage.get(stage) ?? [];
      const traceFeeds = (parents: BracketTie[]) =>
        uniqueById(
          parents.flatMap((tie) =>
            stageMatches.filter(
              (candidate) =>
                [candidate.home_team.id, candidate.away_team.id].includes(tie.home_team.id)
                || [candidate.home_team.id, candidate.away_team.id].includes(tie.away_team.id),
            ),
          ),
        );
      left = traceFeeds(left);
      right = traceFeeds(right);
      columns.unshift({ stage, left, right });
    }
  }

  const thirdPlace = byStage.get('THIRD_PLACE')?.[0];

  return {
    columns,
    leftSemiFinal,
    rightSemiFinal,
    finalTie,
    thirdPlaceTie: thirdPlace
      ? (hasResolvedTeams(thirdPlace) ? normaliseTie(thirdPlace) : createPlaceholderTie(-104, 'THIRD_PLACE'))
      : null,
  };
};

/** Collapses two-legged rounds into single ties with aggregate scores. */
const aggregateBracket = (rounds: BracketRound[]): BracketRound[] =>
  rounds.map((round) => {
    const grouped = new Map<string, BracketMatch[]>();
    round.matches.forEach((match) => {
      const homeId = match.home_team?.id ?? 0;
      const awayId = match.away_team?.id ?? 0;
      // Unresolved TBD ties all share id 0 — key by match id so they don't collapse.
      const key = homeId && awayId
        ? [homeId, awayId].sort((a, b) => a - b).join(':')
        : `unresolved:${match.id}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(match);
    });

    const ties: BracketTie[] = Array.from(grouped.values()).map((matches) => {
      const orderedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const baseMatch = orderedMatches[0];
      const latestMatch = orderedMatches[orderedMatches.length - 1];

      const teamA = baseMatch.home_team;
      const teamB = baseMatch.away_team;

      let teamAScore = 0;
      let teamBScore = 0;

      orderedMatches.forEach((match) => {
        if (match.home_team.id === teamA.id) {
          teamAScore += match.score.home ?? 0;
          teamBScore += match.score.away ?? 0;
        } else {
          teamAScore += match.score.away ?? 0;
          teamBScore += match.score.home ?? 0;
        }
      });

      const hasBeenPlayed = orderedMatches.some(
        (m) => m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED',
      );

      let winner: string | null = null;
      if (hasBeenPlayed) {
        if (teamAScore > teamBScore) {
          winner = 'HOME_TEAM';
        } else if (teamBScore > teamAScore) {
          winner = 'AWAY_TEAM';
        } else if (latestMatch.score.winner) {
          winner = latestMatch.home_team.id === teamA.id
            ? latestMatch.score.winner
            : latestMatch.score.winner === 'HOME_TEAM'
              ? 'AWAY_TEAM'
              : latestMatch.score.winner === 'AWAY_TEAM'
                ? 'HOME_TEAM'
                : latestMatch.score.winner;
        }
      }

      const penHome = latestMatch.score.penalty_home;
      const penAway = latestMatch.score.penalty_away;
      const hasPens = penHome != null && penAway != null;
      const decidingLegIsSwapped = latestMatch.home_team.id !== teamA.id;

      return {
        id: latestMatch.id,
        date: latestMatch.date,
        status: latestMatch.status,
        stage: latestMatch.stage,
        home_team: teamA,
        away_team: teamB,
        score: {
          home: hasBeenPlayed ? teamAScore : null,
          away: hasBeenPlayed ? teamBScore : null,
          winner,
          penalty_home: hasPens ? (decidingLegIsSwapped ? penAway : penHome) : null,
          penalty_away: hasPens ? (decidingLegIsSwapped ? penHome : penAway) : null,
        },
        legs: orderedMatches,
      };
    });

    return {
      ...round,
      matches: ties as unknown as BracketMatch[],
    };
  });

const teamWon = (match: BracketTie, side: 'home' | 'away') =>
  (match.score.winner === 'HOME_TEAM' && side === 'home')
  || (match.score.winner === 'AWAY_TEAM' && side === 'away');

/** Shared layout scale (px) so connectors line up with the cards they point at. */
/** Vertical space per tie. Dense brackets (World Cup round of 32) pack tighter so the page stays a sane height. */
const slotHeightFor = (maxSlots: number) => (maxSlots >= 8 ? 96 : 132);
const COLUMN_WIDTH = 196;
const CONNECTOR_WIDTH = 36;
/** Height of the round-title pill row above every column and connector. */
const HEADER_HEIGHT = 36;

const formatShortDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const formatKickoff = (iso: string) => {
  if (!iso) return 'Date TBC';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date TBC';
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};

const TieStatusStrip: React.FC<{ match: BracketTie }> = ({ match }) => {
  if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
    return (
      <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-3 py-[3px]">
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {match.status === 'PAUSED' ? 'HT' : 'Live'}
        </span>
        <span className="text-[10px] font-medium text-red-400">{formatShortDate(match.date)}</span>
      </div>
    );
  }
  if (match.status === 'FINISHED') {
    return (
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-[3px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">FT</span>
        <span className="text-[10px] font-medium text-slate-400">{formatShortDate(match.date)}</span>
      </div>
    );
  }
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-3 py-[3px] text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      {formatKickoff(match.date)}
    </div>
  );
};

interface TieCardProps {
  match: BracketTie;
  theme: CupTheme;
  /** Gold treatment for the final. */
  featured?: boolean;
  /** Dense rounds drop the penalty footer (the score chips still show the shootout) to keep rows short. */
  compact?: boolean;
}

/** A single tie: scoreboard card with winner accent bar, penalty note, and leg-by-leg popover. */
const BracketTieCard: React.FC<TieCardProps> = ({ match, theme, featured = false, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const isPlaceholder = match.home_team.id === 0 && match.away_team.id === 0;
  const homeWon = teamWon(match, 'home');
  const awayWon = teamWon(match, 'away');
  const hasLegs = match.legs.length > 1;
  const hasPens = match.score.penalty_home != null && match.score.penalty_away != null;
  const pensWinner = hasPens
    ? (homeWon ? match.home_team : awayWon ? match.away_team : null)
    : null;

  const Row: React.FC<{ team: BracketTie['home_team']; score: number | null; pens?: number | null; won: boolean; decided: boolean }> = ({ team, score, pens, won, decided }) => {
    const isTbd = !team?.id;
    return (
      <div className="relative flex items-center gap-2 px-3 py-1.5">
        {won && <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: theme.deep }} />}
        {team?.crest ? (
          <img src={team.crest} alt="" className="h-5 w-5 shrink-0 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className="h-5 w-5 shrink-0 rounded-full border border-dashed border-slate-200 bg-slate-50" />
        )}
        <span
          className={`min-w-0 flex-1 truncate text-xs leading-tight ${
            isTbd ? 'italic text-slate-300'
              : won ? 'font-bold text-slate-900'
                : decided ? 'font-medium text-slate-400'
                  : 'font-semibold text-slate-700'
          }`}
          title={team?.name}
        >
          {isTbd ? 'To be decided' : (team.short_name || team.name)}
        </span>
        {score !== null && (
          <span
            className={`flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded px-1 text-xs font-bold tabular-nums ${won ? 'text-slate-900' : 'text-slate-400'}`}
            style={won ? { background: theme.deepSoft } : undefined}
          >
            {score}
            {pens != null && <span className="ml-px text-[10px] font-semibold text-slate-400">({pens})</span>}
          </span>
        )}
      </div>
    );
  };

  const decided = Boolean(match.score.winner);

  return (
    <div className="relative">
      <div
        role={hasLegs ? 'button' : undefined}
        tabIndex={hasLegs ? 0 : undefined}
        onClick={hasLegs ? () => setExpanded((e) => !e) : undefined}
        onKeyDown={hasLegs ? (e) => { if (e.key === 'Enter') setExpanded((v) => !v); } : undefined}
        className={`w-full overflow-hidden rounded-lg bg-white transition-shadow duration-150 ${
          isPlaceholder
            ? theme.light
              ? 'border border-dashed border-slate-300 bg-slate-50 shadow-none'
              : 'border border-dashed border-white/25 bg-white/[0.04] shadow-none'
            : featured
              ? theme.light
                ? 'shadow-lg ring-2 ring-amber-400/70'
                : 'shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-2 ring-amber-300/80'
              : theme.light
                ? 'shadow-sm ring-1 ring-slate-200'
                : 'shadow-[0_4px_16px_rgba(0,0,0,0.35)] ring-1 ring-black/5'
        } ${hasLegs ? 'cursor-pointer hover:shadow-lg' : ''}`}
        style={{ maxWidth: COLUMN_WIDTH }}
      >
        {isPlaceholder ? (
          <div className="px-3 py-2">
            <p className={`py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest ${theme.light ? 'text-slate-400' : 'text-white/40'}`}>
              Awaiting teams
            </p>
          </div>
        ) : (
          <>
            <TieStatusStrip match={match} />
            <Row team={match.home_team} score={match.score.home} pens={match.score.penalty_home} won={homeWon} decided={decided} />
            <div className="mx-3 h-px bg-slate-100" />
            <Row team={match.away_team} score={match.score.away} pens={match.score.penalty_away} won={awayWon} decided={decided} />
            {pensWinner && !compact && (
              <p className="border-t border-slate-100 bg-slate-50 px-2 py-[3px] text-center text-[10px] font-medium text-slate-500">
                {pensWinner.tla || pensWinner.name} win {Math.max(match.score.penalty_home!, match.score.penalty_away!)}–{Math.min(match.score.penalty_home!, match.score.penalty_away!)} on penalties
              </p>
            )}
            {hasLegs && !expanded && (
              <p className="border-t border-slate-100 px-2 py-[3px] text-center text-[9px] font-semibold uppercase tracking-widest text-slate-300">
                Tap for legs
              </p>
            )}
          </>
        )}
      </div>

      {expanded && hasLegs && (
        <div
          className="absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10"
          style={{ width: COLUMN_WIDTH * 1.4 }}
        >
          <p className="border-b border-slate-100 bg-slate-50 px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Leg by leg · Agg {match.score.home}–{match.score.away}
          </p>
          {match.legs.map((leg, i) => (
            <div key={leg.id} className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-1.5 text-xs last:border-b-0">
              <span className="w-9 shrink-0 text-[10px] font-bold uppercase text-slate-400">Leg {i + 1}</span>
              <span className="flex-1 truncate text-right text-slate-700">{leg.home_team.tla || leg.home_team.name}</span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-bold tabular-nums text-slate-900">{leg.score.home}–{leg.score.away}</span>
              <span className="flex-1 truncate text-slate-700">{leg.away_team.tla || leg.away_team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const slotCenter = (index: number, count: number, height: number) => ((index + 0.5) / count) * height;

const RoundPill: React.FC<{ title: string; theme: CupTheme }> = ({ title, theme }) => (
  <div className="flex items-start justify-center" style={{ height: HEADER_HEIGHT }}>
    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
      theme.light ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/15 bg-white/[0.07] text-white/75'
    }`}>
      {title}
    </span>
  </div>
);

/** A round's ties, positioned at fixed slots so a connector column can draw lines to them. */
const StageColumn: React.FC<{ title: string; matches: BracketTie[]; totalSlots: number; height: number; theme: CupTheme }> = ({ title, matches, totalSlots, height, theme }) => (
  <div className="flex shrink-0 flex-col" style={{ width: COLUMN_WIDTH }}>
    <RoundPill title={title} theme={theme} />
    <div className="relative" style={{ height }}>
      {matches.map((match, i) => (
        <div key={match.id} className="absolute left-0 right-0 -translate-y-1/2" style={{ top: slotCenter(i, totalSlots, height) }}>
          <BracketTieCard match={match} theme={theme} compact={totalSlots >= 8} />
        </div>
      ))}
    </div>
  </div>
);

/** Rounded-elbow lines joining `sourceCount` ties to the `targetCount` ties they feed. */
const BracketConnector: React.FC<{ sourceCount: number; targetCount: number; height: number; theme: CupTheme; flip?: boolean }> = ({ sourceCount, targetCount, height, theme, flip = false }) => {
  const width = CONNECTOR_WIDTH;
  const stroke = theme.light ? '#cbd5e1' : 'rgba(255,255,255,0.32)';
  const sourceCenters = Array.from({ length: sourceCount }, (_, i) => slotCenter(i, sourceCount, height));
  const targetCenters = Array.from({ length: targetCount }, (_, i) => slotCenter(i, targetCount, height));
  const near = flip ? width : 0;
  const far = flip ? 0 : width;
  const mid = width / 2;
  const hdir = flip ? -1 : 1;

  const paths: string[] = [];
  sourceCenters.forEach((sy, i) => {
    const ty = targetCenters[Math.floor(i / 2)];
    if (Math.abs(ty - sy) < 1) {
      paths.push(`M ${near} ${sy} L ${far} ${sy}`);
      return;
    }
    const vdir = ty > sy ? 1 : -1;
    const r = Math.min(7, Math.abs(ty - sy) / 2);
    paths.push(
      `M ${near} ${sy} L ${mid - hdir * r} ${sy} Q ${mid} ${sy} ${mid} ${sy + vdir * r} `
      + `L ${mid} ${ty - vdir * r} Q ${mid} ${ty} ${mid + hdir * r} ${ty} L ${far} ${ty}`,
    );
  });

  return (
    <svg width={width} height={height} className="shrink-0" style={{ marginTop: HEADER_HEIGHT }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={1.5} />
      ))}
    </svg>
  );
};

const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ competition, season = null }) => {
  const [bracket, setBracket] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const league = LEAGUE_MAP[competition];
  const theme = CUP_THEMES[competition];
  const order = BRACKET_ORDER[competition];

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ competition });
      if (season) params.set('season', season);
      const response = await api.get(`/standings/bracket?${params.toString()}`);
      setBracket(aggregateBracket(response.data.bracket ?? []));
    } catch {
      setError(`Failed to load the ${league.name} bracket.`);
    } finally {
      setLoading(false);
    }
  }, [competition, league.name, season]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Archived seasons are frozen — only poll for updates on the live bracket.
  useEffect(() => {
    if (season) return;
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load, season]);

  if (!theme || !order) return null;

  const panelClass = theme.light
    ? 'relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'
    : 'relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10';
  const panelStyle: React.CSSProperties | undefined = theme.light
    ? undefined
    : theme.backgroundImage
      ? {
        backgroundImage: `${theme.overlay}, url(${theme.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
      : { background: theme.overlay };

  if (loading) {
    return (
      <div className={panelClass} style={panelStyle}>
        <div className={`animate-pulse py-24 text-center text-sm ${theme.light ? 'text-slate-400' : 'text-white/50'}`}>
          Loading the {league.name} bracket…
        </div>
      </div>
    );
  }

  if (error || !bracket.length) {
    return (
      <div className={panelClass} style={panelStyle}>
        <p className={`px-4 py-24 text-center text-sm ${theme.light ? 'text-slate-400' : 'text-white/50'}`}>
          {error ?? 'No knockout bracket data available yet.'}
        </p>
      </div>
    );
  }

  // Ignore rounds the data doesn't have (e.g. CL play-offs in seasons without them)
  // so we don't render empty columns.
  const playedStages = new Set(bracket.filter((round) => round.matches.length).map((round) => round.stage));
  const effectiveOrder = order.filter((stage, i) => playedStages.has(stage) || i >= order.length - 2);
  const tree = buildBracketTree(bracket, effectiveOrder);
  const champion = tree.finalTie.score.winner
    ? (tree.finalTie.score.winner === 'HOME_TEAM' ? tree.finalTie.home_team : tree.finalTie.away_team)
    : null;

  const cols = tree.columns;
  const sideCount = (matches: BracketTie[]) => Math.max(matches.length, 1);
  const lastColSideCount = cols.length ? sideCount(cols[cols.length - 1].left) : 1;
  const maxSlots = Math.max(1, ...cols.flatMap((c) => [sideCount(c.left), sideCount(c.right)]), 2);
  const bracketHeight = maxSlots * slotHeightFor(maxSlots);

  return (
    <div className={panelClass} style={panelStyle}>
      <div className="px-4 pb-6 pt-6 sm:px-6">
        {/* Masthead */}
        <div className="mb-5 flex flex-col items-center text-center">
          <img
            src={league.emblem}
            alt=""
            className={`mb-2 h-10 w-10 object-contain ${theme.light ? '' : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]'}`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <p className={`text-[10px] font-semibold uppercase tracking-[0.45em] ${theme.light ? 'text-slate-400' : 'text-white/45'}`}>Road To</p>
          <h3 className={`mt-0.5 text-2xl font-black uppercase tracking-wide ${theme.light ? 'text-slate-900' : 'text-white'}`}>{theme.venue}</h3>
          <div className="mt-2 h-px w-40" style={{ background: `linear-gradient(90deg, transparent, ${theme.bright}, transparent)` }} />
        </div>

        {/* Full-size bracket; scrolls horizontally when wider than the page, like the real thing. */}
        <div className="overflow-x-auto pb-2">
          <div className="mx-auto flex w-max items-start">
            {/* Left half, earliest round outward */}
            {cols.map((col, i) => (
              <React.Fragment key={`${col.stage}-left`}>
                <StageColumn title={STAGE_TITLES[col.stage] ?? col.stage} matches={col.left} totalSlots={sideCount(col.left)} height={bracketHeight} theme={theme} />
                <BracketConnector
                  sourceCount={sideCount(col.left)}
                  targetCount={i < cols.length - 1 ? sideCount(cols[i + 1].left) : 1}
                  height={bracketHeight}
                  theme={theme}
                />
              </React.Fragment>
            ))}

            <StageColumn title="Semi-finals" matches={[tree.leftSemiFinal]} totalSlots={1} height={bracketHeight} theme={theme} />
            <BracketConnector sourceCount={1} targetCount={1} height={bracketHeight} theme={theme} />

            {/* Centre stage: trophy, the final, champions, third place */}
            <div className="flex shrink-0 flex-col" style={{ width: COLUMN_WIDTH + 16 }}>
              <RoundPill title="Final" theme={theme} />
              <div className="relative" style={{ height: bracketHeight }}>
                {/* Trophy + kickoff sit just above the final card */}
                <div className="absolute left-1/2 flex w-max -translate-x-1/2 flex-col items-center" style={{ bottom: 'calc(50% + 70px)' }}>
                  {theme.trophyImage ? (
                    <img src={theme.trophyImage} alt="" className="h-20 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]" />
                  ) : (
                    <Trophy
                      className={`h-12 w-12 ${theme.light ? '' : 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]'}`}
                      style={{ color: theme.light ? theme.deep : theme.bright }}
                      strokeWidth={1.5}
                    />
                  )}
                  {tree.finalTie.date && (
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.light ? 'text-slate-500' : 'text-white/60'}`}>
                      {formatKickoff(tree.finalTie.date)}
                    </p>
                  )}
                </div>

                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2">
                  <BracketTieCard match={tree.finalTie} theme={theme} featured />
                </div>

                <div className="absolute left-1/2 w-full -translate-x-1/2 px-2" style={{ top: 'calc(50% + 70px)' }}>
                  {champion && (
                    <div
                      className={`mb-4 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 ${theme.light ? 'bg-slate-50' : ''}`}
                      style={{ borderColor: `${theme.bright}55`, background: theme.light ? undefined : 'rgba(255,255,255,0.05)' }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: theme.light ? theme.deep : theme.bright }}>Champions</p>
                      {champion.crest && <img src={champion.crest} alt="" className="h-10 w-10 object-contain drop-shadow" />}
                      <p className={`text-center text-sm font-black uppercase tracking-wide ${theme.light ? 'text-slate-900' : 'text-white'}`}>
                        {champion.short_name || champion.name}
                      </p>
                    </div>
                  )}
                  {tree.thirdPlaceTie && (
                    <div>
                      <p className={`mb-2 text-center text-[10px] font-bold uppercase tracking-[0.25em] ${theme.light ? 'text-slate-400' : 'text-white/45'}`}>
                        Third place play-off
                      </p>
                      <div className="mx-auto" style={{ maxWidth: COLUMN_WIDTH }}>
                        <BracketTieCard match={tree.thirdPlaceTie} theme={theme} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <BracketConnector sourceCount={1} targetCount={1} height={bracketHeight} theme={theme} flip />
            <StageColumn title="Semi-finals" matches={[tree.rightSemiFinal]} totalSlots={1} height={bracketHeight} theme={theme} />
            <BracketConnector sourceCount={lastColSideCount} targetCount={1} height={bracketHeight} theme={theme} flip />

            {/* Right half, latest round inward */}
            {[...cols].reverse().map((col, i, arr) => (
              <React.Fragment key={`${col.stage}-right`}>
                <StageColumn title={STAGE_TITLES[col.stage] ?? col.stage} matches={col.right} totalSlots={sideCount(col.right)} height={bracketHeight} theme={theme} />
                {i < arr.length - 1 && (
                  <BracketConnector sourceCount={sideCount(arr[i + 1].right)} targetCount={sideCount(col.right)} height={bracketHeight} theme={theme} flip />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracket;
