import type { MatchEvent, MatchState, MatchStats, Player, Team } from './models';

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

const emptyStats = (teamId: string): MatchStats => ({
    teamId, kills: 0, errors: 0, attempts: 0, blocks: 0,
    digs: 0, aces: 0, assists: 0, passes: 0, performanceScore: 0
});

export function createMatch(teamA: Team, teamB: Team): MatchState {
    const playerStats: Record<string, MatchStats> = {};
    teamA.players.forEach(p => playerStats[p.id] = emptyStats(teamA.id));
    teamB.players.forEach(p => playerStats[p.id] = emptyStats(teamB.id));

    const servingTeamId = Math.random() > 0.5 ? teamA.id : teamB.id;

    return {
        teamAId: teamA.id,
        teamBId: teamB.id,
        setsA: 0,
        setsB: 0,
        setScores: [],
        currentSetPointsA: 0,
        currentSetPointsB: 0,
        servingTeamId,
        possessionTeamId: servingTeamId,
        rallyPhase: 'WAITING_TO_SERVE',
        lastTouchQuality: 50,
        events: [],
        playerStats,
        gameOver: false,
        rotations: { teamA: 0, teamB: 0 },
        playerPositions: {},
        playerStamina: Object.fromEntries(
            [...teamA.players, ...teamB.players].map(p => [p.id, 100])
        ),
        momentum: 0.5,
        liberoHistory: { teamA: null, teamB: null }
    };
}

const ZONE_MAP = ['P1', 'P6', 'P5', 'P4', 'P3', 'P2'];
const BACK_ROW_ZONES = ['P1', 'P6', 'P5'];
const FRONT_ROW_ZONES = ['P4', 'P3', 'P2'];

function getPlayerInZone(team: Team, rotation: number, zone: string, match?: MatchState): Player {
    const zoneIdx = ZONE_MAP.indexOf(zone);
    const sortedStarters = [
        team.starters.S, team.starters.MB1, team.starters.OH1,
        team.starters.OPP, team.starters.MB2, team.starters.OH2
    ];
    const rotatedIdx = (zoneIdx + rotation) % 6;
    const playerId = sortedStarters[rotatedIdx];
    const p = team.players.find(x => x.id === playerId)!;

    // Libero Logic
    if (BACK_ROW_ZONES.includes(zone)) {
        if (p.position === 'MB') {
            const libero = team.players.find(x => x.id === team.starters.L);
            if (libero && match) {
                const teamKey = team.id === match.teamAId ? 'teamA' : 'teamB' as const;
                const subbedOutLastRally = match.liberoHistory?.[teamKey];

                // If the Libero was SUBBED OUT last rally, they must sit out this one.
                if (subbedOutLastRally === 'LIBERO_OUT') {
                    return p;
                }
                return libero;
            }
        }
    }

    return p;
}

function isBackRow(zone: string): boolean {
    return BACK_ROW_ZONES.includes(zone);
}

function rotateTeam(match: MatchState, teamId: string) {
    if (teamId === match.teamAId) {
        match.rotations.teamA = (match.rotations.teamA + 1) % 6;
    } else {
        match.rotations.teamB = (match.rotations.teamB + 1) % 6;
    }
}

function getRotation(match: MatchState, teamId: string): number {
    return teamId === match.teamAId ? match.rotations.teamA : match.rotations.teamB;
}

// Competitive balance: compress stats toward midpoint and add large randomness
// This ensures that a 90 OVR team doesn't crush a 60 OVR team every time
// Raw stat 90 → ~72, Raw stat 50 → ~58.  The gap shrinks from 40 to ~14
// Then ±25 random swing means the weaker player can regularly outperform
function balancedStat(raw: number, variance: number = 25): number {
    const compressed = 55 + (raw - 50) * 0.4; // compress toward 55
    return compressed + randomInt(-variance, variance);
}

// Utility functions for simulation logic
function getOpposingTeam(teamA: Team, teamB: Team, currentTeamId: string) {
    return currentTeamId === teamA.id ? teamB : teamA;
}

function getTeamById(teamA: Team, teamB: Team, id: string) {
    return teamA.id === id ? teamA : teamB;
}

export function simulateNextTouch(match: MatchState, teamA: Team, teamB: Team) {
    if (match.gameOver) return;

    const currentTeam = getTeamById(teamA, teamB, match.possessionTeamId);
    const opposingTeam = getOpposingTeam(teamA, teamB, match.possessionTeamId);

    const log = (text: string, type: MatchEvent['type'], actorId?: string, teamScoredId?: string, x?: number, y?: number) => {
        match.events.push({ id: generateId(), type, description: text, actorId, teamScoredId, x, y });
    };

    const stat = (playerId: string, st: keyof Omit<MatchStats, 'teamId'>, val = 1) => {
        if (match.playerStats[playerId]) {
            (match.playerStats[playerId] as any)[st] += val;
        }
    };

    const getMomentumBonus = (teamId: string) => {
        const diff = teamId === match.teamAId ? match.momentum - 0.5 : 0.5 - match.momentum;
        return diff * 4; // Nerfed from 6 to 4 for better balance
    };

    const getStaminaPenalty = (playerId: string) => {
        const stam = match.playerStamina[playerId] || 100;
        if (stam > 60) return 0;
        if (stam > 30) return -10;
        return -25;
    };

    const isClutchMoment = () => {
        const isFifthSet = match.setsA + match.setsB === 4;
        const threshold = isFifthSet ? 12 : 20;
        const diff = Math.abs(match.currentSetPointsA - match.currentSetPointsB);
        return (match.currentSetPointsA >= threshold || match.currentSetPointsB >= threshold) && diff <= 3;
    };

    const getTraitBonus = (player: Player, action: 'SERVE' | 'ATTACK' | 'BLOCK' | 'RECEIVE' | 'DIG'): number => {
        let bonus = 0;
        const traits = player.traits || [];
        if (traits.includes('Clutch Player') && isClutchMoment()) bonus += 12;
        if (traits.includes('Fraud') && isClutchMoment()) bonus -= 12;

        if (action === 'SERVE' && traits.includes('Ace Server')) bonus += 15;
        if (action === 'BLOCK' && traits.includes('Wall Blocker')) bonus += 15;
        if (action === 'BLOCK' && traits.includes('Wall Stopper')) bonus += 10;

        if (action === 'ATTACK' && traits.includes('Quick Snap')) bonus += 12;
        if (action === 'ATTACK' && traits.includes('Glass Cannon')) bonus += 20;
        if (action === 'DIG' && traits.includes('Scrappy')) bonus += 15;
        if (action === 'RECEIVE' && traits.includes('Scrappy')) bonus += 8;

        return bonus;
    };

    const applyFatigue = (player: Player, amount: number) => {
        if (match.playerStamina[player.id] !== undefined) {
            let finalAmount = amount;
            if (player.traits.includes('Ironman')) finalAmount *= 0.5;
            match.playerStamina[player.id] = Math.max(0, match.playerStamina[player.id] - finalAmount);
        }
    };

    const checkInjury = (player: Player, intensity: number) => {
        // Base risk: 0.05% per touch. Increases if fatigue is high.
        const fatigue = 100 - (match.playerStamina[player.id] || 100);
        let risk = 0.0005 + (fatigue / 100) * 0.005;
        if (player.traits.includes('Injury Prone')) risk *= 2;

        if (Math.random() < risk * intensity) {
            const types = ['Sprained Ankle', 'Knee Strain', 'Wrist Sprain', 'Shoulder Soreness', 'Hammer Toe'];
            const type = types[randomInt(0, types.length - 1)];
            // We'll mark the player as injured in the actual player object later, but for now log it
            log(`!!! INJURY: ${player.lastName} has suffered a ${type}!`, 'ERROR', player.id);
            // In a real implementation we might need to sub them out, but for simplicity of this engine
            // we'll let them "finish" the match or just take a huge stat hit.
            // For now, let's just apply a massive stamina drain to 'sideline' them.
            match.playerStamina[player.id] = 0;
        }
    };

    // ====================================================================
    // PHASE 1: SERVE
    // ====================================================================
    if (match.rallyPhase === 'WAITING_TO_SERVE') {
        match.possessionTeamId = match.servingTeamId;
        const servingTeam = getTeamById(teamA, teamB, match.servingTeamId);
        const receivingTeam = getOpposingTeam(teamA, teamB, match.servingTeamId);
        const rot = getRotation(match, servingTeam.id);
        const server = getPlayerInZone(servingTeam, rot, 'P1');

        let serveStat = balancedStat(server.stats.serve, 18);
        serveStat += getMomentumBonus(servingTeam.id);
        serveStat += getStaminaPenalty(server.id);
        serveStat += getTraitBonus(server, 'SERVE');

        if (servingTeam.tactics.serveRisk === 'AGGRESSIVE') serveStat += 10;
        if (servingTeam.tactics.serveRisk === 'SAFE') serveStat -= 8;

        applyFatigue(server, 2); // Serve is tiring
        checkInjury(server, 1);

        // Serve style personality effects
        const serveStyle = server.personality?.serveStyle || 'HYBRID';
        let serveDesc = `${server.lastName} serves the ball.`;
        let errorThreshold: number;

        if (serveStyle === 'FLOAT') {
            // Float: low error chance, lower ace potential, more in-play serves
            serveStat -= 3;
            errorThreshold = servingTeam.tactics.serveRisk === 'AGGRESSIVE' ? 38 : 22;
            serveDesc = `${server.lastName} floats a tricky serve.`;
        } else if (serveStyle === 'JUMP') {
            // Jump serve: high power = more aces AND more errors
            serveStat += 8;
            errorThreshold = servingTeam.tactics.serveRisk === 'AGGRESSIVE' ? 52 : 38;
            serveDesc = `${server.lastName} launches a JUMP SERVE!`;
        } else {
            // Hybrid: balanced
            errorThreshold = servingTeam.tactics.serveRisk === 'AGGRESSIVE' ? 45 : 30;
        }

        const serveQuality = serveStat;
        const serverY = servingTeam.id === teamA.id ? 5 : 95;
        const serverX = randomInt(20, 80);

        log(serveDesc, 'SERVE', server.id, undefined, serverX, serverY);

        if (serveQuality < errorThreshold) {
            stat(server.id, 'errors');
            const netY = servingTeam.id === teamA.id ? 45 : 55;
            const errDesc = serveStyle === 'JUMP'
                ? `${server.lastName}'s jump serve goes out!`
                : `${server.lastName}'s serve doesn't clear the net!`;
            log(errDesc, 'ERROR', server.id, receivingTeam.id, serverX, netY);
            awardPoint(match, receivingTeam.id, teamA, teamB);
            return;
        }

        match.rallyPhase = 'SERVED';
        match.lastTouchQuality = serveQuality;
        match.possessionTeamId = receivingTeam.id;
        return;
    }

    // ====================================================================
    // PHASE 2: RECEIVE (ball goes to receiving team)
    // ====================================================================
    if (match.rallyPhase === 'SERVED') {
        const rot = getRotation(match, currentTeam.id);
        // Passers are back-row players (P1, P5, P6)
        const targetZone = ['P6', 'P5', 'P1'][randomInt(0, 2)];
        const passer = getPlayerInZone(currentTeam, rot, targetZone);
        stat(passer.id, 'passes');

        let receiveQuality = balancedStat(passer.stats.receive, 20);
        receiveQuality += getMomentumBonus(currentTeam.id);
        receiveQuality += getStaminaPenalty(passer.id);
        receiveQuality += getTraitBonus(passer, 'RECEIVE');

        applyFatigue(passer, 1);
        checkInjury(passer, 1);
        const passY = currentTeam.id === teamA.id ? 15 : 85;
        const passX = randomInt(30, 70);

        // Ace: high serve quality vs low receive quality (wider gap = easier aces)
        if (match.lastTouchQuality > receiveQuality + 30) {
            const servingTeam = getOpposingTeam(teamA, teamB, currentTeam.id);
            const serverRot = getRotation(match, servingTeam.id);
            const server = getPlayerInZone(servingTeam, serverRot, 'P1');
            stat(server.id, 'aces');
            log(`SERVICE ACE! ${server.lastName}'s serve is untouchable!`, 'POINT', passer.id, servingTeam.id, passX, passY);
            awardPoint(match, servingTeam.id, teamA, teamB);
            return;
        }

        log(`${passer.lastName} passes to the setter.`, 'PASS', passer.id, undefined, passX, passY);
        match.lastTouchQuality = receiveQuality;
        match.rallyPhase = 'PASSED';
        return;
    }

    // ====================================================================
    // PHASE 3: SET (setter chooses target based on personality)
    // ====================================================================
    if (match.rallyPhase === 'PASSED') {
        const setter = currentTeam.players.find(p => p.id === currentTeam.starters.S);
        if (!setter) { match.rallyPhase = 'WAITING_TO_SERVE'; return; }

        const passQuality = match.lastTouchQuality;
        let settingStat = balancedStat(setter.stats.setting, 15);
        settingStat += getMomentumBonus(currentTeam.id);
        settingStat += getStaminaPenalty(setter.id);
        settingStat += getTraitBonus(setter, 'DIG'); // Setter accuracy

        if (passQuality < 40) settingStat -= 15;
        const setQuality = settingStat;
        applyFatigue(setter, 2.5); // Setter works hard
        checkInjury(setter, 0.5);
        const setY = currentTeam.id === teamA.id ? 38 : 62;

        // Setter personality determines set target
        const style = setter.personality?.setterStyle || 'BALANCED';
        const tendency = setter.personality?.tendencyStrength || 60;
        const useTendency = randomInt(1, 100) <= tendency;

        let setTarget: string;
        let setDesc: string;

        if (style === 'QUICK_MIDDLE' && useTendency) {
            setTarget = 'P3';
            setDesc = `${setter.lastName} fires a QUICK SET to the middle!`;
        } else if (style === 'HIGH_OUTSIDE' && useTendency) {
            setTarget = 'P4';
            setDesc = `${setter.lastName} sends a HIGH BALL to the outside!`;
        } else if (style === 'DUMP_HAPPY' && useTendency && setQuality > 75 && randomInt(1, 5) === 1) {
            // Setter dump — nerfed: only 1-in-5 attempts actually succeed as a direct dump
            // Must have excellent set quality (>75) and opponent must not be ready
            const opponentLibero = opposingTeam.players.find(p => p.id === opposingTeam.starters.L);
            const diggingChance = opponentLibero ? balancedStat(opponentLibero.stats.digging, 20) : 40;
            if (diggingChance > 60) {
                // Opponent digs the dump
                stat(opponentLibero!.id, 'digs');
                log(`${setter.lastName} tries to dump it — dug up nicely by ${opponentLibero?.lastName}!`, 'DIG', opponentLibero?.id, undefined, 50, setY);
                match.lastTouchQuality = 55;
                match.rallyPhase = 'PASSED';
                match.possessionTeamId = opposingTeam.id;
                return;
            }
            stat(setter.id, 'kills');
            stat(setter.id, 'attempts');
            log(`${setter.lastName} DUMPS the ball over! Caught them off guard!`, 'POINT', setter.id, currentTeam.id, 50, setY);
            awardPoint(match, currentTeam.id, teamA, teamB);
            return;
        } else {
            // Balanced or fallback: pick from front row
            const frontZones = ['P4', 'P2', 'P3'];
            setTarget = frontZones[randomInt(0, 2)];
            setDesc = `${setter.lastName} sets up the offense.`;
        }

        // Store the set target in lastTouchQuality context
        // We'll encode it: setQuality is the quality, setTarget is stored via match phase transition
        log(setDesc, 'SET', setter.id, undefined, setTarget === 'P4' ? 25 : (setTarget === 'P2' ? 75 : 50), setY);
        match.lastTouchQuality = setQuality;

        // Store target zone in a simple way: use the event's x coordinate to encode zone
        // P4 = left (25), P3 = center (50), P2 = right (75)
        // Back row attacks: sometimes set to back row
        const rot = getRotation(match, currentTeam.id);
        const attacker = getPlayerInZone(currentTeam, rot, setTarget);

        // Prevent setter setting to himself
        if (attacker.id === setter.id) {
            // Re-pick a different zone
            const altZones = ['P4', 'P2', 'P3'].filter(z => {
                const p = getPlayerInZone(currentTeam, rot, z);
                return p.id !== setter.id;
            });
            if (altZones.length > 0) {
                setTarget = altZones[randomInt(0, altZones.length - 1)];
            }
        }

        // Back-row set option (10% chance)
        if (randomInt(1, 10) === 1) {
            const backZone = ['P1', 'P6', 'P5'][randomInt(0, 2)];
            const backPlayer = getPlayerInZone(currentTeam, rot, backZone);
            if (backPlayer.id !== setter.id && backPlayer.position !== 'L') {
                setTarget = backZone;
                log(`${setter.lastName} sets BEHIND to ${backPlayer.lastName} for a back-row attack!`, 'SET', setter.id, undefined, 50, currentTeam.id === teamA.id ? 20 : 80);
            }
        }

        // Store set target in match state via a simple trick: put target zone index in events
        match.rallyPhase = 'SET';
        // We pass the target zone through a custom mechanism — store in last event
        const lastEvt = match.events[match.events.length - 1];
        if (lastEvt) lastEvt.targetId = setTarget;
        return;
    }

    // ====================================================================
    // PHASE 4: ATTACK (hitter personality affects shot selection)
    // ====================================================================
    if (match.rallyPhase === 'SET') {
        const rot = getRotation(match, currentTeam.id);
        const setter = currentTeam.players.find(p => p.id === currentTeam.starters.S);

        // Get target zone from last SET event
        const lastSetEvent = [...match.events].reverse().find(e => e.type === 'SET');
        let attackerZone = lastSetEvent?.targetId || 'P4';

        // Validate zone
        if (!ZONE_MAP.includes(attackerZone)) attackerZone = 'P4';

        const attacker = getPlayerInZone(currentTeam, rot, attackerZone);

        // Prevent setter attacking (unless it's a dump which was handled above)
        if (setter && attacker.id === setter.id) {
            const altZones = FRONT_ROW_ZONES.filter(z => {
                const p = getPlayerInZone(currentTeam, rot, z);
                return p.id !== setter.id;
            });
            if (altZones.length > 0) {
                attackerZone = altZones[randomInt(0, altZones.length - 1)];
            }
        }

        const finalAttacker = getPlayerInZone(currentTeam, rot, attackerZone);
        stat(finalAttacker.id, 'attempts');

        const setQuality = match.lastTouchQuality;
        let attackPower = balancedStat(finalAttacker.stats.spiking, 22);
        attackPower += getMomentumBonus(currentTeam.id);
        attackPower += getStaminaPenalty(finalAttacker.id);
        attackPower += getTraitBonus(finalAttacker, 'ATTACK');

        applyFatigue(finalAttacker, 3); // Spiking is very tiring
        checkInjury(finalAttacker, 1.5);

        // Back-row attack penalty
        if (isBackRow(attackerZone)) {
            attackPower -= 15;
        }

        // Tempo bonuses
        if (currentTeam.tactics.tempo === 'FAST') {
            if (setQuality > 70) attackPower += 15;
            else attackPower -= 20;
        }

        // Hitter personality flavor text
        const hitterStyle = finalAttacker.personality?.hitterStyle;
        let attackDesc = `${finalAttacker.lastName} goes for the spike!`;

        if (hitterStyle === 'LINE') attackDesc = `${finalAttacker.lastName} rips it DOWN THE LINE!`;
        else if (hitterStyle === 'CROSS') attackDesc = `${finalAttacker.lastName} swings CROSS-COURT!`;
        else if (hitterStyle === 'POWER') attackDesc = `${finalAttacker.lastName} loads up for a POWER shot!`;
        else if (hitterStyle === 'TIP') attackDesc = `${finalAttacker.lastName} goes for a soft TIP!`;

        const attackY = currentTeam.id === teamA.id ? 45 : 55;
        const attackX = attackerZone === 'P4' ? 25 : (attackerZone === 'P2' ? 75 : 50);

        let errorThreshold = 30;
        if ((finalAttacker.traits || []).includes('Glass Cannon')) errorThreshold = 45;

        if (attackPower < errorThreshold) {
            stat(finalAttacker.id, 'errors');
            const errDesc = isBackRow(attackerZone)
                ? `${finalAttacker.lastName}'s back-row attack goes long!`
                : `${finalAttacker.lastName} hits the ball out of bounds!`;
            log(errDesc, 'ERROR', finalAttacker.id, opposingTeam.id, attackX, attackY);
            awardPoint(match, opposingTeam.id, teamA, teamB);
            return;
        }

        log(attackDesc, 'ATTACK', finalAttacker.id, undefined, attackX, attackY);
        match.lastTouchQuality = attackPower;
        match.rallyPhase = 'ATTACK_IN_AIR';
        match.possessionTeamId = opposingTeam.id;

        // Store hitter style + attack zone for blocker to use
        const lastAtk = match.events[match.events.length - 1];
        if (lastAtk) lastAtk.targetId = `${hitterStyle || 'POWER'}:${attackerZone}`;
        return;
    }

    // ====================================================================
    // PHASE 5: BLOCK/DIG (blocker personality affects effectiveness)
    // ====================================================================
    if (match.rallyPhase === 'ATTACK_IN_AIR') {
        const defRot = getRotation(match, currentTeam.id);

        // Pick blocker from front row, closest to attack
        const lastAtkEvent = [...match.events].reverse().find(e => e.type === 'ATTACK');
        const atkMeta = lastAtkEvent?.targetId?.split(':') || ['POWER', 'P4'];
        const hitterStyle = atkMeta[0];
        const attackZone = atkMeta[1] || 'P4';

        // Mirror the attack zone for blocking (P4 attack → P2 block, P2→P4, P3→P3)
        let blockZone = 'P3';
        if (attackZone === 'P4') blockZone = 'P2';
        else if (attackZone === 'P2') blockZone = 'P4';

        const blocker = getPlayerInZone(currentTeam, defRot, blockZone);
        const digger = getPlayerInZone(currentTeam, defRot, ['P6', 'P5', 'P1'][randomInt(0, 2)]);

        const attackerTeam = opposingTeam;
        const attRot = getRotation(match, attackerTeam.id);
        const attacker = getPlayerInZone(attackerTeam, attRot, attackZone !== 'P3' ? attackZone : 'P4');
        const setter = attackerTeam.players.find(p => p.id === attackerTeam.starters.S);

        const attackPower = match.lastTouchQuality;
        let blockPower = balancedStat(blocker.stats.blocking, 22);
        blockPower += getMomentumBonus(currentTeam.id);
        blockPower += getStaminaPenalty(blocker.id);
        blockPower += getTraitBonus(blocker, 'BLOCK');
        applyFatigue(blocker, 2);
        checkInjury(blocker, 1);

        // Blocker personality modifiers
        const blockerStyle = blocker.personality?.blockerStyle;
        if (blockerStyle === 'READ') {
            // Read blockers are consistent
            blockPower += 5;
        } else if (blockerStyle === 'GUESS') {
            // Guess blockers are high variance — big reward or big miss
            blockPower += randomInt(-15, 25);
        } else if (blockerStyle === 'COMMIT') {
            // Commit blockers dominate quick sets but get burned by outside sets
            if (attackZone === 'P3') blockPower += 20;
            else blockPower -= 10;
        }

        // Hitter style vs block interaction
        if (hitterStyle === 'TIP' && blockPower > attackPower) {
            blockPower -= 15; // Tips are harder to stuff block
        }
        if (hitterStyle === 'LINE') blockPower -= 5; // Line shots evade the block more

        let digPower = balancedStat(digger.stats.digging, 22);
        digPower += getMomentumBonus(currentTeam.id);
        digPower += getStaminaPenalty(digger.id);
        digPower += getTraitBonus(digger, 'DIG');
        applyFatigue(digger, 2);
        checkInjury(digger, 1.2);

        const netY = currentTeam.id === teamA.id ? 48 : 52;
        const courtTargetY = currentTeam.id === teamA.id ? 10 : 90;

        // Block Check
        if (blockPower > attackPower + 10) {
            stat(blocker.id, 'blocks');
            const blockDesc = blockerStyle === 'COMMIT'
                ? `COMMIT BLOCK by ${blocker.lastName}! Read it perfectly!`
                : blockerStyle === 'GUESS'
                    ? `${blocker.lastName} GUESSED RIGHT! Stuff block!`
                    : `STUFF BLOCK by ${blocker.lastName}!`;
            log(blockDesc, 'BLOCK', blocker.id, currentTeam.id, attackZone === 'P4' ? 25 : 75, netY);
            awardPoint(match, currentTeam.id, teamA, teamB);
            return;
        } else if (blockPower > attackPower - 5) {
            if (randomInt(1, 100) > 70) {
                stat(attacker.id, 'kills');
                if (setter) stat(setter.id, 'assists');
                log(`Tooled off ${blocker.lastName}'s block and out!`, 'POINT', attacker.id, attackerTeam.id, 50, netY);
                awardPoint(match, attackerTeam.id, teamA, teamB);
                return;
            } else {
                log(`Soft block touch by ${blocker.lastName}...`, 'BLOCK', blocker.id, undefined, 50, netY);
                let reduction = 20;
                if (blocker.traits.includes('Wall Stopper')) {
                    reduction = 35; // Wall Stopper reduces attack power more
                    log(`Wall Stopper: ${blocker.lastName} slows it down significantly!`, 'BLOCK', blocker.id);
                }
                match.lastTouchQuality -= reduction;
            }
        }

        // Dig Check
        if (digPower > match.lastTouchQuality - 10) {
            stat(digger.id, 'digs');
            log(`Great dig by ${digger.lastName}! The rally continues...`, 'DIG', digger.id, undefined, 50, courtTargetY);
            match.lastTouchQuality = 60;
            match.rallyPhase = 'PASSED';
            return;
        } else {
            stat(attacker.id, 'kills');
            if (setter) stat(setter.id, 'assists');
            const killDesc = hitterStyle === 'LINE'
                ? `LINE SHOT KILL by ${attacker.lastName}!`
                : hitterStyle === 'CROSS'
                    ? `CROSS-COURT KILL by ${attacker.lastName}!`
                    : hitterStyle === 'TIP'
                        ? `Sneaky TIP by ${attacker.lastName} finds the floor!`
                        : `KILL! Great hit by ${attacker.lastName}.`;
            log(killDesc, 'POINT', attacker.id, attackerTeam.id, 50, courtTargetY);
            awardPoint(match, attackerTeam.id, teamA, teamB);
            return;
        }
    }
}

function awardPoint(match: MatchState, teamId: string, teamA: Team, teamB: Team) {
    const scoringTeam = teamId === match.teamAId ? teamA : teamB;
    const hasFloorGeneral = scoringTeam.players.some(p => (p.traits || []).includes('Floor General'));
    const momentumGain = hasFloorGeneral ? 0.03 : 0.02; // Reduced from 0.04/0.025

    if (teamId === match.teamAId) {
        match.currentSetPointsA++;
        match.momentum = Math.min(1.0, match.momentum + momentumGain);
    } else {
        match.currentSetPointsB++;
        match.momentum = Math.max(0.0, match.momentum - momentumGain);
    }

    // Serve Runs: Consecutive points by serving team gives extra momentum
    if (teamId === match.servingTeamId) {
        const bonus = 0.01; // Reduced from 0.015
        match.momentum = teamId === match.teamAId
            ? Math.min(1.0, match.momentum + bonus)
            : Math.max(0.0, match.momentum - bonus);
        match.events.push({ id: generateId(), type: 'POINT', description: `Team ${teamId === match.teamAId ? 'A' : 'B'} is on a SERVE RUN!` });
    }

    if (teamId !== match.servingTeamId) rotateTeam(match, teamId);
    match.servingTeamId = teamId;
    match.rallyPhase = 'POINT_OVER';

    // Track Libero status: was anyone subbed out?
    if (match.liberoHistory) {
        // Simple logic: if a team just ROTATED and the Libero was in P1 (now P6), they stay.
        // If they were in P5 (now P4), they MUST leave.
        // We'll mark if the Libero is 'sitting out' for the next point.
        const tA = getTeamById(teamA, teamB, match.teamAId);
        const tB = getTeamById(teamA, teamB, match.teamBId);

        const checkLiberoOut = (tm: Team, teamKey: 'teamA' | 'teamB') => {
            const rot = getRotation(match, tm.id);
            const zoneIdx = ZONE_MAP.indexOf('P4');
            const sortedStarters = [tm.starters.S, tm.starters.MB1, tm.starters.OH1, tm.starters.OPP, tm.starters.MB2, tm.starters.OH2];
            const rotatedIdx = (zoneIdx + rot) % 6;
            const originalPlayer = tm.players.find(x => x.id === sortedStarters[rotatedIdx])!;

            if (originalPlayer.position === 'MB') {
                if (match.liberoHistory) match.liberoHistory[teamKey] = 'LIBERO_OUT';
            } else {
                if (match.liberoHistory) match.liberoHistory[teamKey] = null;
            }
        };

        checkLiberoOut(tA, 'teamA');
        checkLiberoOut(tB, 'teamB');
    }

    checkSetWinner(match);
}

function checkSetWinner(match: MatchState) {
    const pA = match.currentSetPointsA;
    const pB = match.currentSetPointsB;
    if (pA >= 25 && pA - pB >= 2) { match.setsA++; endSet(match, match.teamAId); }
    else if (pB >= 25 && pB - pA >= 2) { match.setsB++; endSet(match, match.teamBId); }
}

function endSet(match: MatchState, winningTeamId: string) {
    match.setScores.push({ teamA: match.currentSetPointsA, teamB: match.currentSetPointsB });
    match.events.push({ id: generateId(), type: 'POINT', description: `=== SET WON BY TEAM ${winningTeamId === match.teamAId ? 'A' : 'B'} ===` });
    if (match.setsA === 3) finishMatch(match, match.teamAId);
    else if (match.setsB === 3) finishMatch(match, match.teamBId);
    else {
        match.currentSetPointsA = 0;
        match.currentSetPointsB = 0;
        match.rallyPhase = 'SET_BREAK';
    }
}

function finishMatch(match: MatchState, winningTeamId: string) {
    match.gameOver = true;
    match.winnerId = winningTeamId;
    match.rallyPhase = 'POINT_OVER';
    const losingTeamId = match.teamAId === winningTeamId ? match.teamBId : match.teamAId;
    for (const pId of Object.keys(match.playerStats)) {
        const p = match.playerStats[pId];
        p.performanceScore = (p.kills * 3) + (p.blocks * 4) + (p.aces * 4) + (p.digs * 1.5) + (p.assists * 1) + (p.passes * 0.5) - (p.errors * 2);
    }
    const allIds = Object.keys(match.playerStats).sort((a, b) => match.playerStats[b].performanceScore - match.playerStats[a].performanceScore);
    match.matchMVP = allIds.find(id => match.playerStats[id].teamId === winningTeamId);
    match.matchSVP = allIds.find(id => match.playerStats[id].teamId === losingTeamId);
    match.honorableMentions = allIds.filter(id => id !== match.matchMVP && id !== match.matchSVP).slice(0, 3);
    match.events.push({ id: generateId(), type: 'MATCH_END', description: `=== MATCH CONCLUDED ===` });
}

export function advanceRallyLoop(match: MatchState, teamA: Team, teamB: Team) {
    if (match.rallyPhase === 'POINT_OVER') {
        match.rallyPhase = 'WAITING_TO_SERVE';
        return;
    }
    if (match.rallyPhase === 'SET_BREAK') {
        // Recovery during break
        Object.keys(match.playerStamina).forEach(id => {
            match.playerStamina[id] = Math.min(100, match.playerStamina[id] + 30);
        });
        match.rallyPhase = 'WAITING_TO_SERVE';
        return;
    }
    simulateNextTouch(match, teamA, teamB);
}
