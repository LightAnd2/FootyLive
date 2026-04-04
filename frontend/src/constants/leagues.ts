export type LeagueCode = 'PL' | 'BL1' | 'FL1' | 'SA' | 'PD' | 'CL';

export interface LeagueTheme {
  code: LeagueCode;
  name: string;
  shortName: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  titleGradient: string;
  pageBackground: string;
  stripeColor: string;
  lineColor: string;
  ringColor: string;
}

export const LEAGUES: LeagueTheme[] = [
  {
    code: 'PL',
    name: 'Premier League',
    shortName: 'PL',
    accent: '#00ff85',
    accentSoft: 'rgba(0, 255, 133, 0.16)',
    accentText: '#00ff85',
    titleGradient: 'linear-gradient(90deg, #ffffff 0%, #00ff85 50%, #ffffff 100%)',
    pageBackground: 'linear-gradient(135deg, #1a0020 0%, #006640 25%, #016b6e 50%, #006640 75%, #1a0020 100%)',
    stripeColor: 'rgba(0, 180, 90, 0.12)',
    lineColor: 'rgba(255,255,255,0.42)',
    ringColor: 'rgba(255,255,255,0.18)',
  },
  {
    code: 'BL1',
    name: 'Bundesliga',
    shortName: 'BUN',
    accent: '#e24b5b',
    accentSoft: 'rgba(226, 75, 91, 0.16)',
    accentText: '#f08b95',
    titleGradient: 'linear-gradient(90deg, #f2f4f5 0%, #e24b5b 42%, #c8ced4 100%)',
    pageBackground: 'linear-gradient(135deg, #0d1014 0%, #232a31 28%, #3e474f 52%, #611f2d 76%, #12151b 100%)',
    stripeColor: 'rgba(226, 75, 91, 0.08)',
    lineColor: 'rgba(223,228,232,0.32)',
    ringColor: 'rgba(214,220,224,0.12)',
  },
  {
    code: 'FL1',
    name: 'Ligue 1',
    shortName: 'L1',
    accent: '#16d9ff',
    accentSoft: 'rgba(22, 217, 255, 0.16)',
    accentText: '#69e7ff',
    titleGradient: 'linear-gradient(90deg, #edf8ff 0%, #16d9ff 45%, #93efff 100%)',
    pageBackground: 'linear-gradient(135deg, #051421 0%, #0c2b43 24%, #0e5a83 48%, #15b2d6 76%, #03111b 100%)',
    stripeColor: 'rgba(22, 217, 255, 0.12)',
    lineColor: 'rgba(207,244,255,0.38)',
    ringColor: 'rgba(182,239,255,0.16)',
  },
  {
    code: 'SA',
    name: 'Serie A',
    shortName: 'SA',
    accent: '#4b86d9',
    accentSoft: 'rgba(75, 134, 217, 0.16)',
    accentText: '#93b9f0',
    titleGradient: 'linear-gradient(90deg, #eef4ff 0%, #4b86d9 48%, #d9e7fb 100%)',
    pageBackground: 'linear-gradient(135deg, #08101c 0%, #12253f 24%, #193965 50%, #122b46 74%, #0a1422 100%)',
    stripeColor: 'rgba(75, 134, 217, 0.08)',
    lineColor: 'rgba(214,228,247,0.3)',
    ringColor: 'rgba(190,211,241,0.12)',
  },
  {
    code: 'PD',
    name: 'La Liga',
    shortName: 'LAL',
    accent: '#d38a35',
    accentSoft: 'rgba(211, 138, 53, 0.16)',
    accentText: '#e3b171',
    titleGradient: 'linear-gradient(90deg, #fff1df 0%, #d38a35 42%, #e9c597 100%)',
    pageBackground: 'linear-gradient(135deg, #1c0d12 0%, #3b1d2a 24%, #5c2e3f 48%, #6f4c2d 74%, #181017 100%)',
    stripeColor: 'rgba(211, 138, 53, 0.08)',
    lineColor: 'rgba(237,219,196,0.3)',
    ringColor: 'rgba(222,197,165,0.12)',
  },
  {
    code: 'CL',
    name: 'Champions League',
    shortName: 'UCL',
    accent: '#5aa6ff',
    accentSoft: 'rgba(90, 166, 255, 0.18)',
    accentText: '#8cc1ff',
    titleGradient: 'linear-gradient(90deg, #ffffff 0%, #5aa6ff 45%, #d9e9ff 100%)',
    pageBackground: 'linear-gradient(135deg, #020714 0%, #0a1f4d 24%, #123d8c 50%, #0f2b61 76%, #01040c 100%)',
    stripeColor: 'rgba(90, 166, 255, 0.12)',
    lineColor: 'rgba(220,235,255,0.42)',
    ringColor: 'rgba(183,214,255,0.18)',
  },
];

export const DEFAULT_LEAGUE: LeagueCode = 'PL';

export const DOMESTIC_LEAGUES = LEAGUES.filter((league) => league.code !== 'CL');
export const EUROPEAN_LEAGUES = LEAGUES.filter((league) => league.code === 'CL');

export const LEAGUE_MAP = Object.fromEntries(
  LEAGUES.map((league) => [league.code, league]),
) as Record<LeagueCode, LeagueTheme>;
