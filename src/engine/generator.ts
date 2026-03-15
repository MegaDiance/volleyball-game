import type { Player, PlayerStats, Position, Team, SetterStyle, HitterStyle, BlockerStyle, PlayerPersonality, ServeStyle, Trait } from './models';

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST_NAMES = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Theodore", "Jack", "Levi", "Jackson", "Mateo", "Daniel", "Michael", "Mason", "Sebastian", "Ethan", "Logan", "Carlos", "Andre", "Rafael", "Ivan", "Dmitri", "Kofi", "Yuki", "Marco", "Felipe", "Alejandro"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Sousa", "Volkov", "Nakamura", "Petrov", "Osei", "Rossi", "Ferreira", "Diallo", "Kim", "Hansen"];

const CITY_NAMES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Seattle", "Denver", "Boston", "Portland", "Miami"];
const TEAM_MASCOTS = ["Spikers", "Aces", "Blockers", "Volleys", "Eagles", "Tigers", "Sharks", "Falcons", "Knights", "Titans", "Kings", "Storm", "Waves", "Comets", "Panthers", "Cobras", "Vipers", "Dynamo", "Rush", "Thunder"];

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function generateAgeForPosition(pos: Position): number {
    switch (pos) {
        case 'S': return randomInt(19, 32);
        case 'OH': return randomInt(18, 31);
        case 'OPP': return randomInt(19, 32);
        case 'MB': return randomInt(19, 33);
        case 'L': return randomInt(20, 33);
    }
}

function generateStatsForPosition(pos: Position): PlayerStats {
    const base = () => randomInt(40, 80);
    const core = () => randomInt(65, 95);

    const stats: PlayerStats = {
        spiking: base(),
        blocking: base(),
        serve: base(),
        receive: base(),
        digging: base(),
        setting: base(),
        athleticism: randomInt(50, 95),
        stamina: randomInt(70, 95)
    };

    switch (pos) {
        case 'S':
            stats.setting = core();
            stats.digging = randomInt(55, 85);
            break;
        case 'OH':
            stats.spiking = core();
            stats.receive = core();
            stats.athleticism = core();
            break;
        case 'OPP':
            stats.spiking = randomInt(75, 99);
            stats.athleticism = core();
            break;
        case 'MB':
            stats.blocking = core();
            stats.spiking = core();
            break;
        case 'L':
            stats.receive = randomInt(80, 99);
            stats.digging = randomInt(80, 99);
            stats.spiking = randomInt(10, 40);
            stats.blocking = randomInt(10, 30);
            break;
    }
    return stats;
}

function generatePersonality(pos: Position): PlayerPersonality {
    const tendencyStrength = randomInt(50, 90);
    const personality: PlayerPersonality = { tendencyStrength };

    const serveStyles: ServeStyle[] = ['FLOAT', 'JUMP', 'HYBRID'];
    personality.serveStyle = serveStyles[randomInt(0, serveStyles.length - 1)];

    if (pos === 'S') {
        const styles: SetterStyle[] = ['QUICK_MIDDLE', 'HIGH_OUTSIDE', 'BALANCED', 'DUMP_HAPPY'];
        personality.setterStyle = styles[randomInt(0, styles.length - 1)];
    }
    if (pos === 'OH' || pos === 'OPP') {
        const styles: HitterStyle[] = ['LINE', 'CROSS', 'POWER', 'TIP'];
        personality.hitterStyle = styles[randomInt(0, styles.length - 1)];
    }
    if (pos === 'MB') {
        const hStyles: HitterStyle[] = ['POWER', 'TIP'];
        personality.hitterStyle = hStyles[randomInt(0, hStyles.length - 1)];
        const bStyles: BlockerStyle[] = ['READ', 'GUESS', 'COMMIT'];
        personality.blockerStyle = bStyles[randomInt(0, bStyles.length - 1)];
    }
    if (pos === 'OH' || pos === 'OPP') {
        const bStyles: BlockerStyle[] = ['READ', 'GUESS', 'COMMIT'];
        personality.blockerStyle = bStyles[randomInt(0, bStyles.length - 1)];
    }

    return personality;
}

export function calculateOverall(stats: PlayerStats, pos: Position): number {
    let weights = { spiking: 0, blocking: 0, serve: 0, receive: 0, digging: 0, setting: 0, athleticism: 0 };

    if (pos === 'S') weights = { spiking: 0.05, blocking: 0.1, serve: 0.1, receive: 0.05, digging: 0.1, setting: 0.5, athleticism: 0.1 };
    if (pos === 'OH') weights = { spiking: 0.35, blocking: 0.1, serve: 0.1, receive: 0.2, digging: 0.1, setting: 0.05, athleticism: 0.1 };
    if (pos === 'OPP') weights = { spiking: 0.5, blocking: 0.15, serve: 0.1, receive: 0.05, digging: 0.05, setting: 0.05, athleticism: 0.1 };
    if (pos === 'MB') weights = { spiking: 0.25, blocking: 0.45, serve: 0.1, receive: 0.05, digging: 0.05, setting: 0.05, athleticism: 0.05 };
    if (pos === 'L') weights = { spiking: 0, blocking: 0, serve: 0.05, receive: 0.45, digging: 0.45, setting: 0.05, athleticism: 0 };

    const ovr = Object.keys(weights).reduce((sum, key) => {
        return sum + (stats[key as keyof PlayerStats] * weights[key as keyof typeof weights]);
    }, 0);
    return Math.round(ovr);
}

export const ALL_TRAITS: Trait[] = ['Ace Server', 'Fraud', 'Wall Blocker', 'Wall Stopper', 'Injury Prone', 'Clutch Player', 'Ironman', 'Floor General', 'Quick Snap', 'Scrappy', 'Glass Cannon'];

function generateTraits(): Trait[] {
    const traits: Trait[] = [];
    const numTraits = randomInt(0, 100) > 60 ? 1 : 0;
    const available = [...ALL_TRAITS];
    for (let i = 0; i < numTraits; i++) {
        const idx = randomInt(0, available.length - 1);
        traits.push(available[idx]);
        available.splice(idx, 1);
    }
    return traits;
}

export function generatePlayer(pos: Position): Player {
    const stats = generateStatsForPosition(pos);
    return {
        id: generateId(),
        firstName: FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)],
        lastName: LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)],
        position: pos,
        overall: calculateOverall(stats, pos),
        jerseyNumber: randomInt(1, 99),
        age: generateAgeForPosition(pos),
        stats,
        personality: generatePersonality(pos),
        traits: generateTraits(),
        salary: Math.round(Math.pow(calculateOverall(stats, pos) / 50, 4) * 500000), // Exponential salary
        contractYears: randomInt(1, 4),
        careerStats: {
            seasons: 0,
            totalKills: 0,
            totalBlocks: 0,
            totalAces: 0,
            totalAssists: 0,
            mvps: 0,
            championships: 0
        }
    };
}

/** Apply one season of aging: progression for young players, regression for older ones */
export function applyAgeProgression(player: Player): Player {
    const pos = player.position;
    const age = player.age + 1;

    // Progression/peak/regression curves
    // Peak age varies by position: OH/OPP peak ~23-26, S peak ~24-27, MB 22-26, L 22-28
    const peakMap: Record<Position, { start: number; peak: number; decline: number }> = {
        'OH': { start: 18, peak: 25, decline: 29 },
        'OPP': { start: 19, peak: 25, decline: 29 },
        'S': { start: 19, peak: 26, decline: 30 },
        'MB': { start: 19, peak: 24, decline: 28 },
        'L': { start: 20, peak: 26, decline: 32 },
    };

    const curve = peakMap[pos];
    let statDelta = 0;

    if (age < curve.peak) {
        // Growing: +1 to +3 per year
        statDelta = randomInt(1, 3);
    } else if (age < curve.decline) {
        // Peak plateau: small random fluctuation -1 to +1
        statDelta = randomInt(-1, 1);
    } else {
        // Decline: -1 to -4 per year, worsening with age
        const yearsOver = age - curve.decline;
        statDelta = -(randomInt(1, 2) + Math.min(yearsOver, 3));
    }

    const clamp = (v: number) => Math.max(10, Math.min(99, v));

    const newStats: PlayerStats = {
        spiking: clamp(player.stats.spiking + (pos !== 'L' ? statDelta : 0)),
        blocking: clamp(player.stats.blocking + (pos !== 'L' ? statDelta : 0)),
        serve: clamp(player.stats.serve + statDelta),
        receive: clamp(player.stats.receive + statDelta),
        digging: clamp(player.stats.digging + statDelta),
        setting: clamp(player.stats.setting + (pos === 'S' ? statDelta : Math.round(statDelta * 0.3))),
        athleticism: clamp(player.stats.athleticism + statDelta),
        stamina: clamp(player.stats.stamina + Math.round(statDelta * 0.5)),
    };

    return {
        ...player,
        age,
        stats: newStats,
        overall: calculateOverall(newStats, pos),
    };
}

export function generateTeam(nameOverride?: string, locationOverride?: string): Team {
    const players = [
        generatePlayer('S'), generatePlayer('S'),
        generatePlayer('OH'), generatePlayer('OH'), generatePlayer('OH'), generatePlayer('OH'),
        generatePlayer('OPP'), generatePlayer('OPP'),
        generatePlayer('MB'), generatePlayer('MB'), generatePlayer('MB'), generatePlayer('MB'),
        generatePlayer('L'), generatePlayer('L')
    ];

    const getBest = (pos: Position, skipIds: string[] = []): string => {
        return players
            .filter(p => p.position === pos && !skipIds.includes(p.id))
            .sort((a, b) => b.overall - a.overall)[0].id;
    };

    const oh1 = getBest('OH');
    const oh2 = getBest('OH', [oh1]);
    const mb1 = getBest('MB');
    const mb2 = getBest('MB', [mb1]);

    return {
        id: generateId(),
        location: locationOverride || CITY_NAMES[randomInt(0, CITY_NAMES.length - 1)],
        name: nameOverride || TEAM_MASCOTS[randomInt(0, TEAM_MASCOTS.length - 1)],
        tactics: { serveRisk: 'NORMAL', tempo: 'NORMAL' },
        players,
        starters: {
            S: getBest('S'),
            OH1: oh1,
            OH2: oh2,
            OPP: getBest('OPP'),
            MB1: mb1,
            MB2: mb2,
            L: getBest('L')
        },
        budget: 10000000,
        salaryCap: 8000000
    };
}

export function generateLeague(numTeams: number = 10): Team[] {
    const teams: Team[] = [];
    for (let i = 0; i < numTeams; i++) {
        teams.push(generateTeam());
    }
    return teams;
}
