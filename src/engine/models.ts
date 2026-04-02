export type Position = 'S' | 'OH' | 'OPP' | 'MB' | 'L';

// Personality Systems
export type SetterStyle = 'QUICK_MIDDLE' | 'HIGH_OUTSIDE' | 'BALANCED' | 'DUMP_HAPPY';
export type HitterStyle = 'LINE' | 'CROSS' | 'POWER' | 'TIP';
export type BlockerStyle = 'READ' | 'COMMIT' | 'SWING' | 'GUESS';
export type ServeStyle = 'FLOAT' | 'JUMP' | 'HYBRID';

export type Trait = 'Ace Server' | 'Fraud' | 'Wall Blocker' | 'Wall Stopper' | 'Injury Prone' | 'Clutch Player' | 'Ironman' | 'Floor General' | 'Quick Snap' | 'Scrappy' | 'Glass Cannon';

export interface PlayerHistoryEvent {
  year: number;
  teamId: string;
  award?: string;
}

export interface PlayerInjury {
  type: string;
  weeksLeft: number;
}

export interface PlayerPersonality {
  setterStyle?: SetterStyle;
  hitterStyle?: HitterStyle;
  blockerStyle?: BlockerStyle;
  serveStyle?: ServeStyle;
  tendencyStrength: number; // 0-100: how often they use their preferred style
}

export interface PlayerStats {
  spiking: number; // 1-100
  blocking: number;
  serve: number;
  receive: number;
  digging: number;
  setting: number;
  athleticism: number; // Jumping/Speed
  stamina: number; // Max stamina (e.g. 50-99)
}

export interface MatchStats {
  teamId: string;
  kills: number;
  errors: number;
  attempts: number;
  blocks: number; // Total kill blocks (for legacy/summary)
  killBlocks: number;
  softBlocks: number;
  blockOuts: number;
  digs: number;
  aces: number;
  assists: number;
  passes: number;
  performanceScore: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: Position;
  overall: number;
  jerseyNumber: number;
  age: number;
  stats: PlayerStats;
  personality: PlayerPersonality;
  traits: Trait[];
  injury?: PlayerInjury;
  faceCode?: string;
  salary: number;
  contractYears: number;
  careerStats?: {
    seasons: number;
    totalKills: number;
    totalBlocks: number;
    totalAces: number;
    totalAssists: number;
    mvps: number;
    championships: number;
  };
}

export interface TeamTactics {
  serveRisk: 'SAFE' | 'NORMAL' | 'AGGRESSIVE';
  tempo: 'HIGH' | 'NORMAL' | 'FAST';
}

export interface Team {
  id: string;
  name: string;
  location: string;
  tactics: TeamTactics;
  players: Player[];
  starters: {
    S: string;
    OH1: string;
    OH2: string;
    OPP: string;
    MB1: string;
    MB2: string;
    L: string;
  };
  budget: number;
  salaryCap: number;
  history?: {
    championships: number;
    playoffAppearances: number;
  };
}

export interface LeagueHistoryEntry {
  year: number;
  championId: string;
  mvpId: string;
  runnerUpId: string;
}

export interface MatchEvent {
  id: string;
  type: 'SERVE' | 'PASS' | 'SET' | 'ATTACK' | 'BLOCK' | 'DIG' | 'POINT' | 'ERROR' | 'MATCH_END';
  description: string;
  teamScoredId?: string;
  actorId?: string;
  targetId?: string;
  x?: number;
  y?: number;
}

export interface PlayerMatchStat {
  playerId: string;
  teamId: string;
  stats: MatchStats;
}

export interface MatchState {
  teamAId: string;
  teamBId: string;
  setsA: number;
  setsB: number;
  setScores: { teamA: number; teamB: number }[];
  currentSetPointsA: number;
  currentSetPointsB: number;
  servingTeamId: string;

  rallyPhase: 'WAITING_TO_SERVE' | 'SERVED' | 'PASSED' | 'SET' | 'ATTACK_IN_AIR' | 'POINT_OVER' | 'SET_BREAK';
  possessionTeamId: string;
  lastTouchQuality: number;

  events: MatchEvent[];
  playerStats: Record<string, MatchStats>;

  gameOver: boolean;
  winnerId?: string;
  matchMVP?: string;
  matchSVP?: string;
  honorableMentions?: string[];

  rotations: { teamA: number; teamB: number };
  playerPositions: Record<string, { x: number; y: number }>;

  // Phase 7: Fatigue & Adrenaline
  playerStamina: Record<string, number>; // Current stamina (0-100%)
  momentum: number; // Momentum/Adrenaline balance (e.g. 0 to 1, 0.5 is neutral)
  liberoHistory?: { teamA: string | null, teamB: string | null }; // Track if libero was just on court
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
  icon?: string;
}

export interface RandomEventChoice {
  text: string;
  impact: string;
  resultDescription: string;
}

export interface RandomEvent {
  id: string;
  type: 'INJURY' | 'HOLIDAY' | 'DISPUTE' | 'MORALE';
  title: string;
  description: string;
  targetPlayerId?: string;
  choices?: RandomEventChoice[];
  effect?: {
    type: 'STAT_CHANGE';
    stat: string;
    value: number;
    duration: number;
  };
}

export interface LeagueSettings {
  isGodMode: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
}

// Save Game structure
export interface SaveGame {
  version: number;
  leagueName: string;
  myTeamId: string;
  teams: Team[];
  season: any; // Season type — using any to avoid circular import
  savedAt: string;
  settings: LeagueSettings;
}
