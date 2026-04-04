import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import MatchTabs from './components/MatchTabs';
import MatchGrid from './components/MatchGrid';
import StandingsTable from './components/StandingsTable';
import ScorersTable from './components/ScorersTable';
import MatchDetail from './components/MatchDetail';
import TeamsPage from './components/TeamsPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { Match, MatchStatus } from './types';
import { apiService } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { DEFAULT_LEAGUE, DOMESTIC_LEAGUES, EUROPEAN_LEAGUES, LEAGUE_MAP, type LeagueCode } from './constants/leagues';
import { WS_URL } from './config';

const dedupeMatches = (items: Match[]) => {
  const map = new Map<number, Match>();
  items.forEach((match) => map.set(match.id, match));
  return Array.from(map.values());
};

const LeagueSection: React.FC<{
  title: string;
  leagues: typeof DOMESTIC_LEAGUES;
  selectedLeague: LeagueCode;
  onSelect: (league: LeagueCode) => void;
}> = ({ title, leagues, selectedLeague, onSelect }) => (
  <div className="flex flex-col items-center gap-2">
    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
      {title}
    </p>
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {leagues.map((league) => {
        const isActive = league.code === selectedLeague;
        return (
          <button
            key={league.code}
            onClick={() => onSelect(league.code)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide border transition-all ${
              isActive ? 'text-[#0d1117] shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
            style={{
              backgroundColor: isActive ? league.accent : 'rgba(255, 255, 255, 0.05)',
              borderColor: isActive ? league.accent : 'rgba(255, 255, 255, 0.12)',
              boxShadow: isActive ? `0 10px 30px ${league.accentSoft}` : 'none',
            }}
          >
            {league.name}
          </button>
        );
      })}
    </div>
  </div>
);

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MatchStatus>('live');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueCode>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LEAGUE;
    }
    const savedLeague = window.localStorage.getItem('footylive:selectedLeague');
    return (savedLeague && savedLeague in LEAGUE_MAP ? savedLeague as LeagueCode : DEFAULT_LEAGUE);
  });

  const leagueTheme = LEAGUE_MAP[selectedLeague];
  const showTeamsTab = selectedLeague !== 'CL';
  const showBracketTab = selectedLeague === 'CL';
  const isOnMatchDetail = location.pathname.startsWith('/match/');
  const currentScreen = isOnMatchDetail ? 'detail' : activeTab;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--league-accent', leagueTheme.accent);
    root.style.setProperty('--league-accent-soft', leagueTheme.accentSoft);
    root.style.setProperty('--league-accent-text', leagueTheme.accentText);
    root.style.setProperty('--league-page-background', leagueTheme.pageBackground);
    root.style.setProperty('--league-stripe-color', leagueTheme.stripeColor);
    root.style.setProperty('--league-line-color', leagueTheme.lineColor);
    root.style.setProperty('--league-ring-color', leagueTheme.ringColor);
    root.setAttribute('data-screen', currentScreen);
  }, [currentScreen, leagueTheme]);

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

  const fetchMatches = useCallback(async (tab: MatchStatus) => {
    if (tab === 'standings' || tab === 'bracket' || tab === 'scorers' || tab === 'teams') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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

      setMatches(fetched);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  const handleWsMessage = useCallback((data: unknown) => {
    const message = data as { type?: string; matches?: Match[] };
    if (message.type === 'live_update' && message.matches) {
      const leagueMatches = message.matches.filter(
        (match) => match.competition_code === selectedLeague,
      );
      setLastUpdated(new Date());
      if (activeTab === 'live') {
        setMatches(leagueMatches);
      }
      setAllMatches((prev) => dedupeMatches([
        ...leagueMatches,
        ...prev.filter((match) => match.status !== 'live' && match.status !== 'half_time'),
      ]));
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
      fetchMatches(activeTab);
      fetchAllMatches();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [activeTab, fetchAllMatches, fetchMatches]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchMatches(activeTab);
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

  const matchCounts = {
    live: allMatches.filter((match) => match.status === 'live' || match.status === 'half_time').length,
    today: allMatches.filter(
      (match) => new Date(match.match_date).toDateString() === new Date().toDateString(),
    ).length,
    upcoming: allMatches.filter((match) => match.status === 'scheduled').length,
    results: allMatches.filter((match) => match.status === 'full_time').length,
  };

  const mainContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => fetchMatches(activeTab)} />;
    if (activeTab === 'standings') return <StandingsTable competition={selectedLeague} />;
    if (activeTab === 'bracket') return <StandingsTable competition={selectedLeague} initialView="bracket" />;
    if (activeTab === 'scorers') return <ScorersTable competition={selectedLeague} />;
    if (activeTab === 'teams') return <TeamsPage competition={selectedLeague} />;
    return <MatchGrid matches={matches} activeTab={activeTab} competition={selectedLeague} />;
  };

  return (
    <div className="min-h-screen">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={() => {
          fetchAllMatches();
          fetchMatches(activeTab);
        }}
        loading={loading}
        wsConnected={wsConnected}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isOnMatchDetail && (
          <div className="text-center mb-8">
            <div className="mb-5 space-y-4">
              <LeagueSection
                title="Domestic Leagues"
                leagues={DOMESTIC_LEAGUES}
                selectedLeague={selectedLeague}
                onSelect={setSelectedLeague}
              />
              <LeagueSection
                title="Europe"
                leagues={EUROPEAN_LEAGUES}
                selectedLeague={selectedLeague}
                onSelect={setSelectedLeague}
              />
            </div>

            <h1
              className="text-5xl sm:text-7xl font-black mb-2 leading-none"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <span
                className="bg-clip-text text-transparent drop-shadow-lg"
                style={{ backgroundImage: leagueTheme.titleGradient }}
              >
                {leagueTheme.name}
              </span>
            </h1>
            <p className="text-slate-300/70 text-sm font-medium tracking-wide">
              Live scores · Fixtures · Results · Standings
            </p>
          </div>
        )}

        {!isOnMatchDetail && (
          <MatchTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            matchCounts={matchCounts}
            showTeamsTab={showTeamsTab}
            showBracketTab={showBracketTab}
          />
        )}

        <div className="mt-2">
          <Routes>
            <Route path="/" element={mainContent()} />
            <Route path="/match/:id" element={<MatchDetail />} />
          </Routes>
        </div>
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
