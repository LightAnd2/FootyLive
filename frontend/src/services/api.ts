import axios from 'axios';
import { Match, MatchListResponse, Team, Player, Standings, Scorers } from '../types';
import type { LeagueCode } from '../constants/leagues';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiService = {
  getMatches: async (params?: {
    status?: string;
    date?: string;
    competition?: LeagueCode;
    page?: number;
    per_page?: number;
  }): Promise<MatchListResponse> => {
    const response = await api.get('/matches', { params });
    return response.data;
  },

  getLiveMatches: async (competition: LeagueCode): Promise<Match[]> => {
    const response = await api.get('/matches/live', { params: { competition } });
    return response.data;
  },

  getTodayMatches: async (competition: LeagueCode): Promise<Match[]> => {
    const response = await api.get('/matches/today', { params: { competition } });
    return response.data;
  },

  getUpcomingMatches: async (competition: LeagueCode, days: number = 30): Promise<Match[]> => {
    const response = await api.get('/matches/upcoming', { params: { days, competition } });
    return response.data;
  },

  getMatchesByDate: async (date: string, competition: LeagueCode): Promise<Match[]> => {
    const response = await api.get('/matches', { params: { date, competition } });
    return response.data.matches;
  },

  getMatchById: async (id: number): Promise<Match> => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  syncMatches: async (): Promise<void> => {
    await api.post('/matches/sync');
  },

  getTeams: async (params?: { search?: string; country?: string; competition?: LeagueCode }): Promise<Team[]> => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  getTeamById: async (id: number): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  getPremierLeagueTeams: async (): Promise<Team[]> => {
    const response = await api.get('/teams/premier-league');
    return response.data;
  },

  getPlayers: async (params?: {
    team_id?: number;
    position?: string;
    search?: string;
  }): Promise<Player[]> => {
    const response = await api.get('/players', { params });
    return response.data;
  },

  getPlayerById: async (id: number): Promise<Player> => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  getTeamPlayers: async (teamId: number): Promise<Player[]> => {
    const response = await api.get(`/players/team/${teamId}`);
    return response.data;
  },

  getStandings: async (competition: LeagueCode): Promise<Standings> => {
    const response = await api.get('/standings', { params: { competition } });
    return response.data;
  },

  getScorers: async (competition: LeagueCode, limit: number = 20): Promise<Scorers> => {
    const response = await api.get('/scorers', { params: { limit, competition } });
    return response.data;
  },

  getCleanSheets: async (competition: LeagueCode) => {
    const response = await api.get('/clean-sheets', { params: { competition } });
    return response.data;
  },

  getTeamHistory: async (teamId: number) => {
    const response = await api.get(`/teams/${teamId}/history`);
    return response.data;
  },

  getTeamDetails: async (teamId: number, competition: LeagueCode) => {
    const response = await api.get(`/teams/${teamId}/details`, { params: { competition } });
    return response.data;
  },
};

export { apiService };
export default api;
