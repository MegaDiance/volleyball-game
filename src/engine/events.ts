import type { Team, RandomEvent } from './models';

const EVENT_CHANCE = 0.4;

export function generateWeeklyEvents(teams: Team[], _week: number, myTeamId: string): RandomEvent[] {
    const events: RandomEvent[] = [];
    if (Math.random() > EVENT_CHANCE) return [];

    const targetTeam = Math.random() > 0.3
        ? teams.find(t => t.id === myTeamId)
        : teams[Math.floor(Math.random() * teams.length)];
    if (!targetTeam) return [];

    const isMyTeam = targetTeam.id === myTeamId;
    const players = targetTeam.players;
    if (players.length < 6) return [];

    const roll = Math.random();

    if (roll < 0.3) {
        const player = players[Math.floor(Math.random() * players.length)];
        const playerName = `${player.firstName} ${player.lastName}`;
        const weeks = Math.floor(Math.random() * 3) + 1;
        events.push({
            id: `injury-${Date.now()}`,
            title: isMyTeam ? "Medical Report" : "League News",
            description: isMyTeam
                ? `${playerName} went down in practice with a twisted ankle. The medical staff says they'll be out for ${weeks} week(s).`
                : `${targetTeam.location}'s stars are struggling. ${playerName} has been sidelined.`,
            type: 'INJURY',
            targetPlayerId: player.id,
            effect: { type: 'STAT_CHANGE', stat: 'overall', value: 0, duration: weeks }
        });
    } else if (roll < 0.5) {
        const bestPlayers = [...players].sort((a, b) => b.overall - a.overall).slice(0, 3);
        const player = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
        const playerName = `${player.firstName} ${player.lastName}`;
        events.push({
            id: `holiday-${Date.now()}`,
            title: "Personal Request",
            description: `${playerName} has requested a week off to attend a family wedding. They're a key part of the rotation — what do you do?`,
            type: 'HOLIDAY',
            targetPlayerId: player.id,
            choices: [
                { text: "Grant the leave", impact: "Player misses 1 week", resultDescription: "You showed heart. The team respects the call." },
                { text: "Refuse request", impact: "-Performance for 2 weeks", resultDescription: "Business is business. They stay, but they're frustrated." }
            ]
        });
    } else if (roll < 0.7) {
        if (players.length >= 2) {
            const p1Name = `${players[0].firstName} ${players[0].lastName}`;
            const p2Name = `${players[1].firstName} ${players[1].lastName}`;
            events.push({
                id: `dispute-${Date.now()}`,
                title: "Locker Room Heat",
                description: `A heated argument broke out between ${p1Name} and ${p2Name} during film study. Chemistry is at an all-time low.`,
                type: 'DISPUTE',
                choices: [
                    { text: "Mediate the situation", impact: "50/50 outcome", resultDescription: "Things seem calmer, but tension remains." },
                    { text: "Bench the instigator", impact: "-Morale squad-wide", resultDescription: "You made an example. The room is quiet, but heavy." }
                ]
            });
        }
    } else {
        const player = players[Math.floor(Math.random() * players.length)];
        const playerName = `${player.firstName} ${player.lastName}`;
        events.push({
            id: `boost-${Date.now()}`,
            title: "Viral Performance",
            description: `A clip of ${playerName}'s insane save from last week went viral. Their confidence is through the roof!`,
            type: 'MORALE',
            targetPlayerId: player.id,
            effect: { type: 'STAT_CHANGE', stat: 'overall', value: 3, duration: 2 }
        });
    }

    return events;
}
