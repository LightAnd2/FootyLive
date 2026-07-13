import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MatchTabs from './components/MatchTabs';
import MatchGrid from './components/MatchGrid';
import StandingsTable from './components/StandingsTable';
import ScorersTable from './components/ScorersTable';
import SeasonSelect from './components/SeasonSelect';
import MatchDetail from './components/MatchDetail';
import TeamsPage from './components/TeamsPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { Match, MatchStatus } from './types';
import { apiService } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { CUP_CODES, DEFAULT_LEAGUE, LEAGUE_MAP, type LeagueCode } from './constants/leagues';
import { WS_URL } from './config';

const dedupeMatches = (items: Match[]) => {
  const map = new Map<number, Match>();
  items.forEach((match) => map.set(match.id, match));
  return Array.from(map.values());
};

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MatchStatus>('live');
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const fetchSeq = useRef(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueCode>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LEAGUE;
    }
    const savedLeague = window.localStorage.getItem('footylive:selectedLeague');
    return (savedLeague && savedLeague in LEAGUE_MAP ? savedLeague as LeagueCode : DEFAULT_LEAGUE);
  });

  const leagueTheme = LEAGUE_MAP[selectedLeague];
  const isCup = CUP_CODES.includes(selectedLeague);
  const showTeamsTab = !isCup;
  const showBracketTab = isCup;
  const isOnMatchDetail = location.pathname.startsWith('/match/');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--league-accent', leagueTheme.accent);
    root.style.setProperty('--league-accent-soft', leagueTheme.accentSoft);
    root.style.setProperty('--league-accent-text', leagueTheme.accentText);
    root.style.setProperty('--league-accent-bright', leagueTheme.accentBright);
    root.style.setProperty('--league-accent-bright-soft', leagueTheme.accentBrightSoft);
  }, [leagueTheme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('footylive:selectedLeague', selectedLeague);
    }
  }, [selectedLeague]);

  const fetchAllMatches = useCallback(async () => {
    const settled = await Promise.allSettled([
      apiService.getLiveMatches(selectedLeague),
      apiService.getTodayMatches(selectedLeague),
      apiService.getUpcomingMatches(selectedLeague),
      apiService
        .getMatches({ status: 'full_time', competition: selectedLeague, per_page: 40 })
        .then((response) => response.matches ?? []),
    ]);

    const merged = settled.flatMap((result) => (
      result.status === 'fulfilled' ? result.value : []
    ));

    setAllMatches(dedupeMatches(merged));
  }, [selectedLeague]);

  const fetchMatches = useCallback(async (tab: MatchStatus, background = false) => {
    if (tab === 'standings' || tab === 'bracket' || tab === 'scorers' || tab === 'teams') {
      setLoading(false);
      setError(null);
      return;
    }

    // Guard against a slow earlier request (e.g. the initial Live fetch)
    // resolving after a tab switch and clobbering the newer tab's list.
    const seq = ++fetchSeq.current;

    try {
      // Background refreshes (intervals, window focus) update in place without
      // unmounting the list behind a spinner.
      if (!background) setLoading(true);
      setError(null);
      let fetched: Match[] = [];

      switch (tab) {
        case 'live':
          fetched = await apiService.getLiveMatches(selectedLeague);
          break;
        case 'today':
          fetched = await apiService.getTodayMatches(selectedLeague);
          break;
        case 'upcoming':
          fetched = await apiService.getUpcomingMatches(selectedLeague);
          break;
        case 'results': {
          const response = await apiService.getMatches({
            status: 'full_time',
            competition: selectedLeague,
            per_page: 40,
          });
          fetched = response.matches ?? [];
          break;
        }
      }

      if (seq !== fetchSeq.current) return;
      setMatches(fetched);
      setLastUpdated(new Date());
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [selectedLeague]);

  const handleWsMessage = useCallback((data: unknown) => {
    const message = data as { type?: string; matches?: Match[] };
    if (message.type === 'live_update' && message.matches) {
      const leagueMatches = message.matches.filter(
        (match) => match.competition_code === selectedLeague,
      );
      const liveIds = new Set(leagueMatches.map((match) => match.id));
      setLastUpdated(new Date());
      if (activeTab === 'live') {
        setMatches(leagueMatches);
      }
      // Matches that dropped out of the live feed just finished — keep them as
      // full_time so tab counts don't dip until the next poll refreshes results.
      setAllMatches((prev) => {
        const justFinished = prev
          .filter((match) =>
            (match.status === 'live' || match.status === 'half_time')
            && match.competition_code === selectedLeague
            && !liveIds.has(match.id),
          )
          .map((match) => ({ ...match, status: 'full_time' as const }));

        return dedupeMatches([
          ...leagueMatches,
          ...justFinished,
          ...prev.filter((match) => match.status !== 'live' && match.status !== 'half_time'),
        ]);
      });
    } else if (message.type === 'connected') {
      setWsConnected(true);
    }
  }, [activeTab, selectedLeague]);

  const wsRef = useWebSocket(WS_URL, handleWsMessage);

  useEffect(() => {
    const check = setInterval(
      () => setWsConnected(wsRef.current?.readyState === WebSocket.OPEN),
      2000,
    );
    return () => clearInterval(check);
  }, [wsRef]);

  useEffect(() => {
    fetchAllMatches();
  }, [fetchAllMatches]);

  useEffect(() => {
    fetchMatches(activeTab);
  }, [activeTab, fetchMatches]);

  useEffect(() => {
    if (!showTeamsTab && activeTab === 'teams') {
      setActiveTab('live');
    }
  }, [activeTab, showTeamsTab]);

  useEffect(() => {
    const refreshableTabs: MatchStatus[] = ['live', 'today', 'upcoming', 'results'];
    if (!refreshableTabs.includes(activeTab)) {
      return undefined;
    }

    const intervalMs = activeTab === 'live' ? 30000 : 60000;
    const intervalId = setInterval(() => {
      fetchMatches(activeTab, true);
      fetchAllMatches();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [activeTab, fetchAllMatches, fetchMatches]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchMatches(activeTab, true);
        fetchAllMatches();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [activeTab, fetchAllMatches, fetchMatches]);

  const handleTabChange = (tab: MatchStatus) => {
    setActiveTab(tab);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleLeagueChange = (league: LeagueCode) => {
    setSelectedLeague(league);
    setActiveTab('live');
    setSelectedSeason(null);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleSeasonChange = (season: string | null) => {
    setSelectedSeason(season);
    // A frozen past season only has the tab(s) it was archived with — cups tell their
    // story through the bracket (no group-stage table); leagues through the table.
    if (season) {
      const validTabs: MatchStatus[] = showBracketTab ? ['bracket', 'scorers'] : ['standings', 'scorers'];
      if (!validTabs.includes(activeTab)) {
        setActiveTab(validTabs[0]);
      }
    }
  };

  const matchCounts = {
    live: allMatches.filter((match) => match.status === 'live' || match.status === 'half_time').length,
    today: allMatches.filter(
      (match) => new Date(match.match_date).toDateString() === new Date().toDateString(),
    ).length,
    upcoming: allMatches.filter((match) => match.status === 'scheduled').length,
    results: allMatches.filter((match) => match.status === 'full_time').length,
  };

  const mainContent = () => {
    // Non-match tabs own their own loading/error — don't let a Live/Today
    // fetch failure block Table, Teams, Stats, or Bracket.
    if (activeTab === 'standings') return <StandingsTable competition={selectedLeague} season={selectedSeason} />;
    if (activeTab === 'bracket') return <StandingsTable competition={selectedLeague} initialView="bracket" season={selectedSeason} />;
    if (activeTab === 'scorers') return <ScorersTable competition={selectedLeague} season={selectedSeason} />;
    if (activeTab === 'teams') return <TeamsPage competition={selectedLeague} />;
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => fetchMatches(activeTab)} />;
    return <MatchGrid matches={matches} activeTab={activeTab} competition={selectedLeague} />;
  };

  return (
    <div className="min-h-screen pl-16 lg:pl-60">
      <Sidebar selectedLeague={selectedLeague} onSelectLeague={handleLeagueChange} />

      <main className={`mx-auto px-4 sm:px-6 py-5 sm:py-6 ${activeTab === 'bracket' && !isOnMatchDetail ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
        {!isOnMatchDetail && (
          <div className="card mb-4">
            <div className="flex items-center gap-4 px-5 pt-4 pb-3">
              <img
                src={leagueTheme.emblem}
                alt=""
                className="h-12 w-12 object-contain"
              />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold leading-tight text-slate-900">{leagueTheme.name}</h1>
                <p className="text-xs text-slate-400">{leagueTheme.country}</p>
              </div>
              <SeasonSelect competition={selectedLeague} value={selectedSeason} onChange={handleSeasonChange} />
            </div>
            <MatchTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              matchCounts={matchCounts}
              showTeamsTab={showTeamsTab}
              showBracketTab={showBracketTab}
              archivedMode={Boolean(selectedSeason)}
            />
          </div>
        )}

        <Routes>
          <Route path="/" element={mainContent()} />
          <Route path="/match/:id" element={<MatchDetail />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <AppInner />
  </Router>
);

export default App;
