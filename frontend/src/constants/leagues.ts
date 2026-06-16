export type LeagueCode = 'PL' | 'BL1' | 'FL1' | 'SA' | 'PD' | 'CL' | 'WC';

export interface LeagueTheme {
  code: LeagueCode;
  name: string;
  shortName: string;
  emblem: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  /** Lightened accent that stays legible on dark glass (cards, tables, inputs). */
  accentBright: string;
  accentBrightSoft: string;
  /** Free font that evokes the league's official logo type. */
  titleFont: string;
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
    emblem: '/prem_logo.cc.png',
    accent: '#3d195b',
    accentSoft: 'rgba(61, 25, 91, 0.16)',
    accentText: '#3d195b',
    accentBright: '#c4a3f0',
    accentBrightSoft: 'rgba(196, 163, 240, 0.14)',
    titleFont: "'Poppins', sans-serif",
    titleGradient: 'linear-gradient(90deg, #3d195b 0%, #3d195b 50%, #3d195b 100%)',
    pageBackground: 'linear-gradient(135deg, #1b0423 0%, #2c0939 22%, #014a37 50%, #00694c 72%, #3a0814 92%, #14031d 100%)',
    stripeColor: 'rgba(0, 180, 90, 0.12)',
    lineColor: 'rgba(255,255,255,0.42)',
    ringColor: 'rgba(255,255,255,0.18)',
  },
  {
    code: 'BL1',
    name: 'Bundesliga',
    shortName: 'BUN',
    emblem: '/bundesliga_logo.png',
    accent: '#d20515',
    accentSoft: 'rgba(210, 5, 21, 0.16)',
    accentText: '#d20515',
    accentBright: '#ff5d6c',
    accentBrightSoft: 'rgba(255, 93, 108, 0.14)',
    titleFont: "'Archivo Black', sans-serif",
    titleGradient: 'linear-gradient(90deg, #d20515 0%, #d20515 50%, #d20515 100%)',
    pageBackground: 'linear-gradient(145deg, #0c0c0d 0%, #34060b 24%, #9d0c19 50%, #cf1020 62%, #5a4710 86%, #0a0a0b 100%)',
    stripeColor: 'rgba(226, 75, 91, 0.1)',
    lineColor: 'rgba(223,228,232,0.32)',
    ringColor: 'rgba(214,220,224,0.12)',
  },
  {
    code: 'FL1',
    name: 'Ligue 1',
    shortName: 'L1',
    emblem: '/ligue1_logo.cc.png',
    accent: '#13235b',
    accentSoft: 'rgba(19, 35, 91, 0.16)',
    accentText: '#13235b',
    accentBright: '#6b8cff',
    accentBrightSoft: 'rgba(107, 140, 255, 0.14)',
    titleFont: "'Orbitron', sans-serif",
    titleGradient: 'linear-gradient(90deg, #13235b 0%, #13235b 50%, #13235b 100%)',
    pageBackground: 'linear-gradient(130deg, #05101f 0%, #082748 24%, #0b4f93 48%, #0f72ad 64%, #320a12 90%, #050c17 100%)',
    stripeColor: 'rgba(22, 217, 255, 0.12)',
    lineColor: 'rgba(207,244,255,0.38)',
    ringColor: 'rgba(182,239,255,0.16)',
  },
  {
    code: 'SA',
    name: 'Serie A',
    shortName: 'SA',
    emblem: '/seriea_logo.cc.png',
    accent: '#0a3d8f',
    accentSoft: 'rgba(10, 61, 143, 0.16)',
    accentText: '#0a3d8f',
    accentBright: '#5b9bff',
    accentBrightSoft: 'rgba(91, 155, 255, 0.14)',
    titleFont: "'Montserrat', sans-serif",
    titleGradient: 'linear-gradient(90deg, #0a3d8f 0%, #0a3d8f 50%, #0a3d8f 100%)',
    pageBackground: 'linear-gradient(150deg, #03281a 0%, #053862 26%, #034196 50%, #0a356a 72%, #2c0810 100%)',
    stripeColor: 'rgba(75, 134, 217, 0.08)',
    lineColor: 'rgba(214,228,247,0.3)',
    ringColor: 'rgba(190,211,241,0.12)',
  },
  {
    code: 'PD',
    name: 'La Liga',
    shortName: 'LAL',
    emblem: '/laliga_logo.cc.png',
    accent: '#e2231a',
    accentSoft: 'rgba(226, 35, 26, 0.16)',
    accentText: '#e2231a',
    accentBright: '#ff6257',
    accentBrightSoft: 'rgba(255, 98, 87, 0.14)',
    titleFont: "'Poppins', sans-serif",
    titleGradient: 'linear-gradient(90deg, #e2231a 0%, #e2231a 50%, #e2231a 100%)',
    pageBackground: 'linear-gradient(140deg, #1a070a 0%, #4c0f15 26%, #b3181f 50%, #c81230 62%, #6e5310 86%, #160608 100%)',
    stripeColor: 'rgba(229, 75, 75, 0.1)',
    lineColor: 'rgba(247,224,219,0.3)',
    ringColor: 'rgba(241,200,190,0.12)',
  },
  {
    code: 'CL',
    name: 'Champions League',
    shortName: 'UCL',
    emblem: 'https://crests.football-data.org/CL.png',
    accent: '#5aa6ff',
    accentSoft: 'rgba(90, 166, 255, 0.18)',
    accentText: '#8cc1ff',
    accentBright: '#5aa6ff',
    accentBrightSoft: 'rgba(90, 166, 255, 0.16)',
    titleFont: "'Oswald', sans-serif",
    titleGradient: 'linear-gradient(90deg, #ffffff 0%, #ffffff 50%, #ffffff 100%)',
    pageBackground: 'linear-gradient(135deg, #020714 0%, #0a1f4d 24%, #123d8c 50%, #0f2b61 76%, #01040c 100%)',
    stripeColor: 'rgba(90, 166, 255, 0.12)',
    lineColor: 'rgba(220,235,255,0.42)',
    ringColor: 'rgba(183,214,255,0.18)',
  },
  {
    code: 'WC',
    name: 'World Cup',
    shortName: 'WC',
    emblem: '/worldcup_logo.png',
    accent: '#c9a227',
    accentSoft: 'rgba(201, 162, 39, 0.16)',
    accentText: '#e3c35a',
    accentBright: '#e8c766',
    accentBrightSoft: 'rgba(232, 199, 102, 0.16)',
    titleFont: "'Anton', sans-serif",
    titleGradient: 'linear-gradient(90deg, #e8c766 0%, #c9a227 50%, #e8c766 100%)',
    pageBackground: 'linear-gradient(135deg, #1a1405 0%, #3a2c08 24%, #6b5210 48%, #2a2208 72%, #0c0a03 100%)',
    stripeColor: 'rgba(201, 162, 39, 0.1)',
    lineColor: 'rgba(245,235,200,0.35)',
    ringColor: 'rgba(232,210,150,0.14)',
  },
];

export const DEFAULT_LEAGUE: LeagueCode = 'PL';

const EUROPEAN_CODES: LeagueCode[] = ['CL'];
const INTERNATIONAL_CODES: LeagueCode[] = ['WC'];
const NON_DOMESTIC_CODES: LeagueCode[] = [...EUROPEAN_CODES, ...INTERNATIONAL_CODES];

export const DOMESTIC_LEAGUES = LEAGUES.filter((league) => !NON_DOMESTIC_CODES.includes(league.code));
export const EUROPEAN_LEAGUES = LEAGUES.filter((league) => EUROPEAN_CODES.includes(league.code));
export const INTERNATIONAL_LEAGUES = LEAGUES.filter((league) => INTERNATIONAL_CODES.includes(league.code));

export const LEAGUE_MAP = Object.fromEntries(
  LEAGUES.map((league) => [league.code, league]),
) as Record<LeagueCode, LeagueTheme>;
