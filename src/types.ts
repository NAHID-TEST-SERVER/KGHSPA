export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  country?: string;
  coach?: string;
  stadium?: string;
  founded?: string;
  visibility: 'public';
  createdAt: string;
  updatedAt: string;
}

export type MatchStatus = 'UPCOMING' | 'WARMUP' | 'STARTING_SOON' | 'KICKOFF' | 'LIVE' | 'FIRST_HALF' | 'HT' | 'SECOND_HALF' | 'INJURY_TIME' | 'ET' | 'PENALTY' | 'SUSPENDED' | 'DELAYED' | 'ABANDONED' | 'FINISHED';

export interface Match {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute?: string;
  timerState?: {
    isRunning: boolean;
    startTime?: number; // timestamp in ms
    elapsedMs: number; // accumulated time
    baseMinute: number; // 0 for 1st half, 45 for 2nd half, etc.
  };
  league?: string;
  matchDate?: string;
  matchTime?: string;
  stadium?: string;
  visibility: 'public';
  createdAt: string;
  updatedAt: string;
}

export interface Commentary {
  id: string;
  matchId: string;
  minute?: string;
  text: string;
  type: 'info' | 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'injury' | 'var' | 'corner';
  teamId?: string;
  visibility: 'public';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  matchId?: string;
  type: 'system' | 'match_update' | 'goal';
  visibility: 'public';
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  createdAt: string;
}
