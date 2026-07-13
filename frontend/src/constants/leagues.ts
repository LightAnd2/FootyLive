export type LeagueCode =
  | 'PL' | 'ELC' | 'BL1' | 'FL1' | 'SA' | 'PD' | 'DED' | 'PPL' | 'BSA'
  | 'CL' | 'EC' | 'WC';

export interface LeagueTheme {
  code: LeagueCode;
  name: string;
  shortName: string;
  /** Country or region shown under the league name. */
  country: string;
  emblem: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  /** Lightened accent that stays legible on dark glass (cards, tables, inputs). */
  accentBright: string;
  accentBrightSoft: string;
}

export const LEAGUES: LeagueTheme[] = [
  {
    code: 'PL',
    name: 'Premier League',
    shortName: 'PL',
    country: 'England',
    emblem: '/prem_logo.cc.png',
    accent: '#3d195b',
    accentSoft: 'rgba(61, 25, 91, 0.16)',
    accentText: '#3d195b',
    accentBright: '#c4a3f0',
    accentBrightSoft: 'rgba(196, 163, 240, 0.14)',
  },
  {
    code: 'ELC',
    name: 'Championship',
    shortName: 'ELC',
    country: 'England',
    emblem: 'https://crests.football-data.org/ELC.png',
    accent: '#012169',
    accentSoft: 'rgba(1, 33, 105, 0.16)',
    accentText: '#012169',
    accentBright: '#6b8dd6',
    accentBrightSoft: 'rgba(107, 141, 214, 0.14)',
  },
  {
    code: 'BL1',
    name: 'Bundesliga',
    shortName: 'BUN',
    country: 'Germany',
    emblem: '/bundesliga_logo.png',
    accent: '#d20515',
    accentSoft: 'rgba(210, 5, 21, 0.16)',
    accentText: '#d20515',
    accentBright: '#ff5d6c',
    accentBrightSoft: 'rgba(255, 93, 108, 0.14)',
  },
  {
    code: 'FL1',
    name: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    emblem: '/ligue1_logo.cc.png',
    accent: '#13235b',
    accentSoft: 'rgba(19, 35, 91, 0.16)',
    accentText: '#13235b',
    accentBright: '#6b8cff',
    accentBrightSoft: 'rgba(107, 140, 255, 0.14)',
  },
  {
    code: 'SA',
    name: 'Serie A',
    shortName: 'SA',
    country: 'Italy',
    emblem: '/seriea_logo.cc.png',
    accent: '#0a3d8f',
    accentSoft: 'rgba(10, 61, 143, 0.16)',
    accentText: '#0a3d8f',
    accentBright: '#5b9bff',
    accentBrightSoft: 'rgba(91, 155, 255, 0.14)',
  },
  {
    code: 'PD',
    name: 'La Liga',
    shortName: 'LAL',
    country: 'Spain',
    emblem: '/laliga_logo.cc.png',
    accent: '#e2231a',
    accentSoft: 'rgba(226, 35, 26, 0.16)',
    accentText: '#e2231a',
    accentBright: '#ff6257',
    accentBrightSoft: 'rgba(255, 98, 87, 0.14)',
  },
  {
    code: 'DED',
    name: 'Eredivisie',
    shortName: 'ERE',
    country: 'Netherlands',
    emblem: 'https://crests.football-data.org/ED.png',
    accent: '#003da5',
    accentSoft: 'rgba(0, 61, 165, 0.16)',
    accentText: '#003da5',
    accentBright: '#5b8def',
    accentBrightSoft: 'rgba(91, 141, 239, 0.14)',
  },
  {
    code: 'PPL',
    name: 'Primeira Liga',
    shortName: 'LIG',
    country: 'Portugal',
    emblem: 'https://crests.football-data.org/PPL.png',
    accent: '#d40026',
    accentSoft: 'rgba(212, 0, 38, 0.16)',
    accentText: '#d40026',
    accentBright: '#ff5c75',
    accentBrightSoft: 'rgba(255, 92, 117, 0.14)',
  },
  {
    code: 'BSA',
    name: 'Brasileirão',
    shortName: 'BSA',
    country: 'Brazil',
    emblem: 'https://crests.football-data.org/bsa.png',
    accent: '#009c3b',
    accentSoft: 'rgba(0, 156, 59, 0.16)',
    accentText: '#009c3b',
    accentBright: '#2bd06a',
    accentBrightSoft: 'rgba(43, 208, 106, 0.14)',
  },
  {
    code: 'CL',
    name: 'Champions League',
    shortName: 'UCL',
    country: 'UEFA',
    emblem: 'https://crests.football-data.org/CL.png',
    accent: '#5aa6ff',
    accentSoft: 'rgba(90, 166, 255, 0.18)',
    accentText: '#2b6cb8',
    accentBright: '#5aa6ff',
    accentBrightSoft: 'rgba(90, 166, 255, 0.16)',
  },
  {
    code: 'EC',
    name: 'Euros',
    shortName: 'EURO',
    country: 'UEFA',
    emblem: 'https://crests.football-data.org/ec.png',
    accent: '#4338ca',
    accentSoft: 'rgba(67, 56, 202, 0.16)',
    accentText: '#4338ca',
    accentBright: '#818cf8',
    accentBrightSoft: 'rgba(129, 140, 248, 0.14)',
  },
  {
    code: 'WC',
    name: 'World Cup',
    shortName: 'WC',
    country: 'FIFA',
    emblem: '/worldcup_logo.png',
    accent: '#c9a227',
    accentSoft: 'rgba(201, 162, 39, 0.16)',
    accentText: '#a3801a',
    accentBright: '#e8c766',
    accentBrightSoft: 'rgba(232, 199, 102, 0.16)',
  },
];

export const DEFAULT_LEAGUE: LeagueCode = 'PL';

const EUROPEAN_CODES: LeagueCode[] = ['CL', 'EC'];
const INTERNATIONAL_CODES: LeagueCode[] = ['WC'];
const NON_DOMESTIC_CODES: LeagueCode[] = [...EUROPEAN_CODES, ...INTERNATIONAL_CODES];

/** Cup-style competitions: matches group by date (not matchweek) and club pages are hidden. */
export const CUP_CODES: LeagueCode[] = ['CL', 'EC', 'WC'];

export const DOMESTIC_LEAGUES = LEAGUES.filter((league) => !NON_DOMESTIC_CODES.includes(league.code));
export const EUROPEAN_LEAGUES = LEAGUES.filter((league) => EUROPEAN_CODES.includes(league.code));
export const INTERNATIONAL_LEAGUES = LEAGUES.filter((league) => INTERNATIONAL_CODES.includes(league.code));

export const LEAGUE_MAP = Object.fromEntries(
  LEAGUES.map((league) => [league.code, league]),
) as Record<LeagueCode, LeagueTheme>;
