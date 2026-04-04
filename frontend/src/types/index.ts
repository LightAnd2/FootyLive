import type { LeagueCode } from '../constants/leagues';

export interface Team {
  id: number;
  external_id: number;
  name: string;
  short_name: string;
  logo: string;
  color?: string;
  country: string;
  founded?: number;
  venue?: string;
  venue_capacity?: number;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: number;
  external_id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  number?: number;
  photo?: string;
  nationality?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  team_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchEvent {
  id: number;
  match_id: number;
  type: string;
  minute: number;
  player_name: string;
  team_id: number;
  description: string;
  is_home: boolean;
  created_at: string;
}

export interface MatchLineup {
  id: number;
  match_id: number;
  team_id: number;
  player_id: number;
  position: string;
  number: number;
  is_captain: boolean;
  is_substitute: boolean;
  is_starting: boolean;
  player: Player;
  created_at: string;
}

export interface Match {
  id: number;
  external_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'live' | 'half_time' | 'full_time' | 'postponed' | 'cancelled';
  minute?: number;
  venue?: string;
  referee?: string;
  match_date: string;
  league_id: number;
  season_id: number;
  matchday?: number;
  competition_code?: string;
  competition_name?: string;
  home_team: Team;
  away_team: Team;
  events: MatchEvent[];
  lineups: MatchLineup[];
  created_at: string;
  updated_at: string;
}

export type MatchStatus = 'live' | 'today' | 'upcoming' | 'results' | 'standings' | 'bracket' | 'scorers' | 'teams';

export interface StandingRow {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
}

export interface StandingsGroup {
  name: string;
  table: StandingRow[];
}

export interface Standings {
  season: { startDate: string; endDate: string; currentMatchday?: number };
  table: StandingRow[];
  groups?: StandingsGroup[] | null;
  competition?: { code: LeagueCode | string };
}

export interface ScorerRow {
  position: number;
  player: { id: number; name: string; nationality: string };
  team: { id: number; name: string; tla: string; crest: string };
  goals: number;
  assists: number;
  penalties: number;
  playedMatches?: number;
}

export interface Scorers {
  season: object;
  scorers: ScorerRow[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface MatchListResponse {
  matches: Match[];
  total: number;
  page: number;
  per_page: number;
}
