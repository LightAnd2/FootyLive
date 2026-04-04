import React, { useEffect, useState, useCallback } from 'react';
import { Standings } from '../types';
import { apiService } from '../services/api';
import api from '../services/api';
import { LEAGUE_MAP, type LeagueCode } from '../constants/leagues';

interface StandingsTableProps {
  competition: LeagueCode;
  initialView?: 'table' | 'bracket';
}

interface BracketMatch {
  id: number;
  date: string;
  status: string;
  stage: string;
  home_team: { id: number; name: string; tla: string; crest: string };
  away_team: { id: number; name: string; tla: string; crest: string };
  score: { home: number | null; away: number | null; winner: string | null };
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
  home_team: { id: number; name: string; tla: string; crest: string };
  away_team: { id: number; name: string; tla: string; crest: string };
  score: { home: number | null; away: number | null; winner: string | null };
  legs: BracketMatch[];
}

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
  Boolean(
    tie
    && tie.home_team?.id
    && tie.away_team?.id
    && tie.home_team.name !== 'TBD'
    && tie.away_team.name !== 'TBD',
  );

const bracketColumns = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'] as const;

const splitBracket = (rounds: BracketRound[]) => {
  const findRound = (stage: typeof bracketColumns[number]) =>
    rounds.find((round) => round.stage === stage)?.matches ?? [];

  const last16 = findRound('LAST_16');
  const quarterFinals = findRound('QUARTER_FINALS');
  const semiFinals = findRound('SEMI_FINALS');
  const final = findRound('FINAL');

  const qfOrder = [
    [524, 64],
    [86, 5],
    [81, 78],
    [498, 57],
  ];

  const sortByPreferredPair = (matches: BracketTie[]) =>
    [...matches].sort((a, b) => {
      const pairIndex = (match: BracketTie) => {
        const ids = [match.home_team.id, match.away_team.id].sort((x, y) => x - y).join(':');
        const found = qfOrder.findIndex((pair) => pair.slice().sort((x, y) => x - y).join(':') === ids);
        return found === -1 ? 999 : found;
      };
      return pairIndex(a) - pairIndex(b);
    });

  const sortedQuarterFinals = sortByPreferredPair(quarterFinals);
  const leftQuarterFinals = sortedQuarterFinals.slice(0, 2);
  const rightQuarterFinals = sortedQuarterFinals.slice(2);

  const getLast16Feeds = (ties: BracketTie[]) =>
    ties.flatMap((tie) =>
      last16.filter(
        (candidate) =>
          [candidate.home_team.id, candidate.away_team.id].includes(tie.home_team.id)
          || [candidate.home_team.id, candidate.away_team.id].includes(tie.away_team.id),
      ),
    );

  const uniqueById = (matches: BracketTie[]) =>
    Array.from(new Map(matches.map((match) => [match.id, match])).values());

  const leftLast16 = uniqueById(getLast16Feeds(leftQuarterFinals));
  const rightLast16 = uniqueById(getLast16Feeds(rightQuarterFinals));

  return {
    leftLast16,
    rightLast16,
    leftQuarterFinals,
    rightQuarterFinals,
    leftSemiFinal: [hasResolvedTeams(semiFinals[0]) ? semiFinals[0] : createPlaceholderTie(-101, 'SEMI_FINALS')],
    rightSemiFinal: [hasResolvedTeams(semiFinals[1]) ? semiFinals[1] : createPlaceholderTie(-102, 'SEMI_FINALS')],
    finalTie: hasResolvedTeams(final[0]) ? final[0] : createPlaceholderTie(-103, 'FINAL'),
  };
};

const aggregateBracket = (rounds: BracketRound[]): BracketRound[] =>
  rounds.map((round) => {
    if (round.stage === 'FINAL') {
      return round;
    }

    const grouped = new Map<string, BracketMatch[]>();
    round.matches.forEach((match) => {
      const ids = [match.home_team.id, match.away_team.id].sort((a, b) => a - b);
      const key = ids.join(':');
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
        },
        legs: orderedMatches,
      };
    });

    return {
      ...round,
      matches: ties,
    };
  });

const teamWon = (match: BracketTie, side: 'home' | 'away') =>
  (match.score.winner === 'HOME_TEAM' && side === 'home')
  || (match.score.winner === 'AWAY_TEAM' && side === 'away');

const getBracketRowStarts = (count: number) => {
  if (count >= 4) {
    return [1, 5, 9, 13];
  }
  if (count === 2) {
    return [3, 11];
  }
  return [7];
};

const getBracketSlotTop = (startRow: number) => `${((startRow - 1) / 16) * 100}%`;

const BracketTeamRow: React.FC<{
  team: BracketTie['home_team'];
  score: number | null;
  active?: boolean;
  compact?: boolean;
}> = ({ team, score, active = false, compact = false }) => (
  <div
    className={`flex items-center ${compact ? 'gap-2 px-3 py-2.5' : 'gap-3 px-4 py-3.5'} ${
      team?.id === 0
        ? 'bg-transparent text-slate-400'
        : active
        ? 'bg-[linear-gradient(135deg,rgba(33,78,255,0.95),rgba(47,101,255,0.88))] text-white'
        : 'bg-[#17185f] text-slate-200'
    }`}
  >
    {team?.crest ? (
      <img
        src={team.crest}
        alt=""
        className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} shrink-0 object-contain`}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    ) : (
      <div className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} shrink-0 rounded-full bg-white/20`} />
    )}
    <span className={`flex-1 truncate ${compact ? 'text-xs font-semibold' : 'text-base font-medium'} ${active ? 'font-bold' : ''}`}>
      {compact ? (team?.tla || team?.name || 'TBD') : (team?.name || 'TBD')}
    </span>
    {!compact && (
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          team?.id === 0
            ? 'border-white/10 text-transparent'
            : active
              ? 'border-white/80 text-white'
              : 'border-white/35 text-transparent'
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </span>
    )}
    {score !== null && (
      <span className={`${compact ? 'text-sm' : 'text-base'} font-black tabular-nums text-white`}>
        {score}
      </span>
    )}
  </div>
);

const BracketTieCard: React.FC<{
  match: BracketTie;
  compact?: boolean;
  showFooter?: boolean;
  expanded?: boolean;
  onToggleDetails?: (match: BracketTie) => void;
}> = ({
  match,
  compact = false,
  showFooter = false,
  expanded = false,
  onToggleDetails,
}) => {
  const isPlaceholderTie = match.home_team.id === 0 && match.away_team.id === 0;
  const showDetailsToggle = showFooter && !isPlaceholderTie && match.legs.length > 0;

  return (
    <div className={`overflow-hidden rounded-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.32)] ${
      isPlaceholderTie
        ? 'border border-dashed border-white/14 bg-[#11145a]/35'
        : 'border border-white/10 bg-[#11145a]'
    }`}>
      <BracketTeamRow
        team={match.home_team}
        score={match.score.home}
        active={teamWon(match, 'home')}
        compact={compact}
      />
      <div className={`h-px ${isPlaceholderTie ? 'bg-white/6' : 'bg-white/10'}`} />
      <BracketTeamRow
        team={match.away_team}
        score={match.score.away}
        active={teamWon(match, 'away')}
        compact={compact}
      />
      {showDetailsToggle && (
        <>
          <div className="h-px bg-white/10" />
          <button
            type="button"
            onClick={() => onToggleDetails?.(match)}
            className="w-full px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:bg-white/5"
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
        </>
      )}
    </div>
  );
};

const StageColumn: React.FC<{
  title: string;
  matches: BracketTie[];
  compact?: boolean;
  selectedTieId?: number | null;
  onToggleDetails?: (match: BracketTie) => void;
  cardWidthClass?: string;
}> = ({
  title,
  matches,
  compact = false,
  selectedTieId = null,
  onToggleDetails,
  cardWidthClass = 'max-w-[188px]',
}) => (
  <div className="min-w-0">
    <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
      {title}
    </p>
    <div className="mb-4 h-px bg-white/10" />
    <div className="relative min-h-[720px]">
      {matches.length ? matches.map((match) => (
        <div
          key={match.id}
          className={`absolute left-1/2 w-full ${cardWidthClass} -translate-x-1/2`}
          style={{ top: getBracketSlotTop(getBracketRowStarts(matches.length)[Math.min(matches.indexOf(match), 3)]) }}
        >
          <BracketTieCard
            match={match}
            compact={compact}
            showFooter={Boolean(onToggleDetails)}
            expanded={selectedTieId === match.id}
            onToggleDetails={onToggleDetails}
          />
        </div>
      )) : (
        <div
          className={`absolute left-1/2 w-full ${cardWidthClass} -translate-x-1/2 rounded-[18px] border border-dashed border-white/10 bg-[#11145a]/35 p-6`}
          style={{ top: getBracketSlotTop(7) }}
        >
          <div className="h-[72px]" />
        </div>
      )}
    </div>
  </div>
);

const BracketConnectorLane: React.FC<{
  kind: 'r16' | 'qf' | 'semi' | 'semi-right' | 'qf-right' | 'r16-right';
}> = ({ kind }) => {
  const common = 'pointer-events-none absolute bg-white/24';

  if (kind === 'semi' || kind === 'semi-right') {
    return (
      <div className="relative min-h-[720px]">
        <div className={`${common} left-0 right-0 top-1/2 h-px -translate-y-1/2`} />
      </div>
    );
  }

  const isRight = kind.includes('right');
  const sourceCenters = kind.includes('r16') ? [2, 6, 10, 14] : [4, 12];
  const targetCenters = kind.includes('r16') ? [4, 12] : [8];
  const pairCount = targetCenters.length;

  return (
    <div className="relative min-h-[720px]">
      {sourceCenters.map((center, index) => {
        const pairIndex = pairCount === 1 ? 0 : Math.floor(index / 2);
        const top = `${((center - 0.5) / 16) * 100}%`;
        const target = `${((targetCenters[pairIndex] - 0.5) / 16) * 100}%`;
        const verticalTop = Math.min(Number.parseFloat(top), Number.parseFloat(target));
        const verticalBottom = Math.max(Number.parseFloat(top), Number.parseFloat(target));

        return (
          <React.Fragment key={`${kind}-${center}`}>
            <div
              className={`${common} top-0 h-px ${isRight ? 'left-1/2 right-0' : 'left-0 right-1/2'}`}
              style={{ top }}
            />
            <div
              className={`${common} top-0 w-px ${isRight ? 'left-1/2' : 'right-1/2'}`}
              style={{ top: `${verticalTop}%`, height: `${verticalBottom - verticalTop}%` }}
            />
          </React.Fragment>
        );
      })}
      {targetCenters.map((center) => (
        <div
          key={`${kind}-target-${center}`}
          className={`${common} top-0 h-px ${isRight ? 'left-0 right-1/2' : 'left-1/2 right-0'}`}
          style={{ top: `${((center - 0.5) / 16) * 100}%` }}
        />
      ))}
    </div>
  );
};

const StandingsTable: React.FC<StandingsTableProps> = ({ competition, initialView = 'table' }) => {
  const [standings, setStandings] = useState<Standings | null>(null);
  const [bracket, setBracket] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'bracket'>(initialView);
  const [selectedTie, setSelectedTie] = useState<BracketTie | null>(null);

  const league = LEAGUE_MAP[competition];
  const isChampionsLeague = competition === 'CL';
  const bracketSides = splitBracket(bracket);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, bracketResponse] = await Promise.all([
        apiService.getStandings(competition),
        isChampionsLeague ? api.get('/standings/cl-bracket').then((response) => response.data).catch(() => ({ bracket: [] })) : Promise.resolve({ bracket: [] }),
      ]);
      setStandings(data);
      setBracket(aggregateBracket(bracketResponse.bracket ?? []));
    } catch {
      setStandings(null);
      setError(`Failed to load the ${league.name} table.`);
    } finally {
      setLoading(false);
    }
  }, [competition, isChampionsLeague, league.name]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setView(initialView);
  }, [competition, initialView]);

  useEffect(() => {
    setSelectedTie(null);
  }, [competition, initialView]);

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="py-8 text-center text-sm text-slate-400">Loading {league.name} table...</div>
      </div>
    );
  }

  if (error || !standings) {
    return (
      <div className="glass-effect rounded-2xl overflow-hidden">
        <p className="text-center text-slate-400 py-12 px-4">{error}</p>
      </div>
    );
  }

  if (isChampionsLeague && view === 'bracket') {
    return bracket.length ? (
      <div className="space-y-5">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="mx-auto w-full max-w-[1180px] min-w-[1080px] px-2 py-2 md:px-4">
            <div className="mb-7 text-center">
              <p className="text-xs uppercase tracking-[0.55em] text-slate-300">Road To</p>
              <h3 className="mt-2 text-[2.15rem] font-black uppercase tracking-[0.14em] text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                Budapest 26
              </h3>
            </div>

            <div className="-ml-10 mr-auto grid w-fit grid-cols-[190px_42px_138px_42px_122px_42px_182px_42px_122px_42px_138px_42px_190px] items-start">
              <StageColumn
                title="Round Of 16"
                matches={bracketSides.leftLast16}
                cardWidthClass="max-w-[190px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
              <BracketConnectorLane kind="r16" />
              <StageColumn
                title="Quarter-finals"
                matches={bracketSides.leftQuarterFinals}
                compact
                cardWidthClass="max-w-[138px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
              <BracketConnectorLane kind="qf" />
              <StageColumn
                title="Semi-finals"
                matches={bracketSides.leftSemiFinal}
                compact
                cardWidthClass="max-w-[122px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
              <BracketConnectorLane kind="semi" />

              <div className="min-w-0">
                <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Final</p>
                <div className="mb-4 h-px bg-white/10" />
                <div className="relative min-h-[720px]">
                  <div className="absolute left-1/2 w-full max-w-[182px] -translate-x-1/2" style={{ top: getBracketSlotTop(7) }}>
                    <BracketTieCard
                      match={bracketSides.finalTie}
                      compact
                      showFooter={false}
                    />
                  </div>
                </div>
              </div>
              <BracketConnectorLane kind="semi-right" />
              <StageColumn
                title="Semi-finals"
                matches={bracketSides.rightSemiFinal}
                compact
                cardWidthClass="max-w-[122px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
              <BracketConnectorLane kind="qf-right" />
              <StageColumn
                title="Quarter-finals"
                matches={bracketSides.rightQuarterFinals}
                compact
                cardWidthClass="max-w-[138px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
              <BracketConnectorLane kind="r16-right" />
              <StageColumn
                title="Round Of 16"
                matches={bracketSides.rightLast16}
                cardWidthClass="max-w-[190px]"
                selectedTieId={selectedTie?.id ?? null}
                onToggleDetails={(match) => setSelectedTie((current) => current?.id === match.id ? null : match)}
              />
            </div>
          </div>
        </div>
        {selectedTie && (
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tie details</p>
                <p className="mt-1 text-sm text-slate-200">
                  {selectedTie.home_team.name} vs {selectedTie.away_team.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTie(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {selectedTie.legs.map((leg) => (
                <div key={leg.id} className="rounded-xl border border-white/8 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                    <span>{new Date(leg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span className="uppercase">{leg.status.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span className="truncate">{leg.home_team.name}</span>
                    <span className="font-black tabular-nums text-white">
                      {leg.score.home ?? '-'} - {leg.score.away ?? '-'}
                    </span>
                    <span className="truncate text-right">{leg.away_team.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : (
      <p className="text-center text-slate-500 py-12 text-sm">No knockout bracket data available yet.</p>
    );
  }

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
            {isChampionsLeague && view === 'bracket' ? 'Bracket' : 'Table'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{league.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isChampionsLeague && initialView === 'table' && (
            <div className="flex rounded-xl overflow-hidden border border-white/15">
              {(['table', 'bracket'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setView(option)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                    view === option ? 'text-[#0d1117]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  style={view === option ? { backgroundColor: 'var(--league-accent)' } : undefined}
                >
                  {option === 'table' ? 'League Table' : 'Knockout Bracket'}
                </button>
              ))}
            </div>
          )}
          {standings.season?.currentMatchday != null && (
            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/5 border border-white/10 text-slate-300">
              {competition === 'CL' ? `Round ${standings.season.currentMatchday}` : `Matchday ${standings.season.currentMatchday}`}
            </span>
          )}
        </div>
      </div>

      {(standings.table?.length || standings.groups?.length) ? (
        standings.groups?.length ? (
          <div className="p-4 space-y-4">
            {standings.groups.map((group) => (
              <div key={group.name} className="overflow-x-auto rounded-xl border border-white/8 bg-black/20">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{group.name}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/8 bg-white/5">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Club</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">W</th>
                      <th className="px-4 py-3 text-center">D</th>
                      <th className="px-4 py-3 text-center">L</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
                      <th className="px-4 py-3 text-center hidden sm:table-cell">GA</th>
                      <th className="px-4 py-3 text-center">GD</th>
                      <th className="px-4 py-3 text-center font-black text-slate-200">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.table.map((row) => (
                      <tr key={row.team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3"><span className="font-bold text-slate-400">{row.position}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={row.team.crest} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <span className="font-semibold text-slate-200 hidden sm:inline truncate">{row.team.name}</span>
                            <span className="font-semibold text-slate-200 sm:hidden">{row.team.tla}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.playedGames}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.won}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.draw}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.lost}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-white text-base tabular-nums">{row.points}</td>
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
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/8 bg-white/5">
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
                <th className="px-4 py-3 text-center font-black text-slate-200">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.table.map((row) => (
                <tr
                  key={row.team.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-400">{row.position}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={row.team.crest}
                        alt=""
                        className="w-5 h-5 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-semibold text-slate-200 hidden sm:inline truncate">{row.team.name}</span>
                      <span className="font-semibold text-slate-200 sm:hidden">{row.team.tla}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.playedGames}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.won}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.draw}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{row.lost}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {(row.form || '')
                        .split(',')
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((result, index) => {
                          const tone =
                            result === 'W'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : result === 'D'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30';
                          return (
                            <span key={`${row.team.id}-${index}`} className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${tone}`}>
                              {result}
                            </span>
                          );
                        })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-black text-white text-base tabular-nums">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      ) : (
        <p className="text-center text-slate-500 py-12 text-sm">No table data available.</p>
      )}
    </div>
  );
};

export default StandingsTable;
