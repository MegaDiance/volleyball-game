import type { Player, Team, Achievement, LeagueHistoryEntry, LeagueSettings, RandomEvent } from './models';
import { generatePlayer } from './generator';

export interface PlayoffMatch {
    id: string;
    teamAId: string | null;
    teamBId: string | null;
    isPlayed: boolean;
    winnerId?: string;
    score?: string;
    setScores?: { teamA: number; teamB: number }[];
}

export interface ScheduleMatch {
    isPlayed: boolean;
    teamAId: string;
    teamBId: string;
    winnerId?: string;
    score?: string; // e.g. "3-1" or "3-2"
    setScores?: { teamA: number; teamB: number }[];
}

export interface Season {
    phase: 'REGULAR' | 'PLAYOFFS' | 'OFFSEASON';
    week: number;
    standings: Record<string, { wins: number, losses: number, setsWon: number, setsLost: number, points: number }>;
    schedule: ScheduleMatch[][];
    freeAgents: Player[];
    playoffs: {
        semis: [PlayoffMatch, PlayoffMatch];
        finals: PlayoffMatch;
    } | null;
    awards?: {
        mvp: string;
        bestSetter: string;
        bestHitter: string;
        bestMB: string;
        bestLibero: string;
        champMVP?: string;
    };
    cumulativeStats?: Record<string, {
        kills: number, errors: number, attempts: number,
        blocks: number, digs: number, aces: number,
        assists: number, passes: number, gamesPlayed: number,
        performanceScore: number
    }>;
    achievements?: Achievement[];
    year: number;
    history: LeagueHistoryEntry[];
    settings: LeagueSettings;
    pendingEvents: RandomEvent[];
}

export function createSeason(teams: Team[], year: number = 1, history: LeagueHistoryEntry[] = [], settings: LeagueSettings = { isGodMode: false, difficulty: 'NORMAL' }): Season {
    const standings: Season['standings'] = {};
    teams.forEach(t => { standings[t.id] = { wins: 0, losses: 0, setsWon: 0, setsLost: 0, points: 0 } });

    const freeAgents = [
        generatePlayer('S'), generatePlayer('OH'), generatePlayer('OH'),
        generatePlayer('OPP'), generatePlayer('MB'), generatePlayer('MB'),
        generatePlayer('L'), generatePlayer('OH'), generatePlayer('S'), generatePlayer('MB')
    ];

    // Generate round robin schedule for 10 teams
    // Single round robin = 9 rounds, Double = 18 rounds = 18 weeks
    const ids = teams.map(t => t.id);
    const schedule: ScheduleMatch[][] = [];

    for (let round = 0; round < ids.length - 1; round++) {
        const week: ScheduleMatch[] = [];
        for (let i = 0; i < ids.length / 2; i++) {
            week.push({ isPlayed: false, teamAId: ids[i], teamBId: ids[ids.length - 1 - i] });
        }
        schedule.push(week);
        ids.splice(1, 0, ids.pop()!);
    }

    // Double round robin (reverse home/away)
    const secondHalf: ScheduleMatch[][] = JSON.parse(JSON.stringify(schedule));
    secondHalf.forEach(week => week.forEach(match => {
        const temp = match.teamAId;
        match.teamAId = match.teamBId;
        match.teamBId = temp;
    }));

    return {
        phase: 'REGULAR',
        week: 1,
        standings,
        schedule: [...schedule, ...secondHalf],
        freeAgents,
        playoffs: null,
        awards: {
            mvp: '',
            bestSetter: '',
            bestHitter: '',
            bestMB: '',
            bestLibero: '',
            champMVP: ''
        },
        cumulativeStats: {},
        achievements: [],
        year,
        history,
        settings,
        pendingEvents: []
    };
}
