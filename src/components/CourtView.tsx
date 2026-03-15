import React from 'react';
import type { MatchEvent, Team } from '../engine/models';

interface CourtViewProps {
    events: MatchEvent[];
    teamA: Team;
    teamB: Team;
    rotations: { teamA: number; teamB: number };
}

export const CourtView: React.FC<CourtViewProps> = ({ events, teamA, teamB, rotations }) => {
    // Find the latest event that has coordinates
    const latestEvent = [...events].reverse().find(e => e.x !== undefined && e.y !== undefined);

    const getBasePos = (zone: string, isTeamA: boolean) => {
        // P-Zones (P1 is back right, P2 is front right, P3 is front mid...)
        let x = 50, y = 25;
        if (zone === 'P1') { x = 80; y = 15; }
        if (zone === 'P6') { x = 50; y = 15; }
        if (zone === 'P5') { x = 20; y = 15; }
        if (zone === 'P4') { x = 25; y = 40; }
        if (zone === 'P3') { x = 50; y = 43; }
        if (zone === 'P2') { x = 75; y = 40; }

        if (!isTeamA) {
            x = 100 - x;
            y = 100 - y;
        }
        return { x, y };
    };

    const renderTeam = (team: Team, isTeamA: boolean, rotation: number) => {
        const zones = ['P1', 'P6', 'P5', 'P4', 'P3', 'P2'];
        const sortedStarters = [
            team.starters.S,
            team.starters.MB1,
            team.starters.OH1,
            team.starters.OPP,
            team.starters.MB2,
            team.starters.OH2
        ];

        return zones.map((zone, zoneIdx) => {
            const rotatedIdx = (zoneIdx + rotation) % 6;
            const playerId = sortedStarters[rotatedIdx];

            // Resolve actual player (handling Libero sub)
            let displayPlayer = team.players.find(p => p.id === playerId);
            if (zoneIdx <= 2 && displayPlayer?.position === 'MB') {
                displayPlayer = team.players.find(p => p.id === team.starters.L);
            }

            if (!displayPlayer) return null;

            const basePos = getBasePos(zone, isTeamA);
            const isActive = latestEvent?.actorId === displayPlayer.id;

            // Jitter for life
            const time = Date.now() / 1000;
            const jitterX = Math.sin(time + displayPlayer.id.length) * 0.5;
            const jitterY = Math.cos(time + displayPlayer.id.length) * 0.5;

            const currentX = isActive && latestEvent?.x !== undefined ? latestEvent.x : basePos.x + jitterX;
            const currentY = isActive && latestEvent?.y !== undefined ? latestEvent.y : basePos.y + jitterY;

            const isLibero = displayPlayer.position === 'L';

            // Color logic: active > libero > normal
            let colorClasses = 'z-0 border-white/20 bg-slate-800';
            if (isLibero) colorClasses = 'z-0 border-amber-400/60 bg-amber-700';
            if (isActive) colorClasses = 'scale-125 z-20 border-yellow-400 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';

            return (
                <div
                    key={displayPlayer.id}
                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-[600ms] ease-out border-2 ${colorClasses}`}
                    style={{
                        left: `calc(${currentX}% - 14px)`,
                        top: `calc(${currentY}% - 14px)`
                    }}
                    title={`${displayPlayer.firstName} ${displayPlayer.lastName}${isLibero ? ' (L)' : ''}`}
                >
                    {displayPlayer.jerseyNumber}
                </div>
            );
        });
    };

    return (
        <div className="bg-emerald-800/20 rounded-xl border border-emerald-900 overflow-hidden relative" style={{ height: '300px' }}>
            {/* Court Visuals */}
            <div className="absolute inset-4 bg-orange-600/30 border-2 border-white/50 rounded flex flex-col">
                {/* Team A Side */}
                <div className="flex-1 border-b-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] relative">
                    <div className="absolute top-0 w-full text-center text-white/50 font-black text-4xl uppercase tracking-widest mt-8 pointer-events-none">
                        {teamA.name}
                    </div>
                    {/* 3m Line Team A */}
                    <div className="absolute bottom-1/3 w-full border-b border-white/30"></div>
                </div>
                {/* Team B Side */}
                <div className="flex-1 relative">
                    <div className="absolute bottom-0 w-full text-center text-white/50 font-black text-4xl uppercase tracking-widest mb-8 pointer-events-none">
                        {teamB.name}
                    </div>
                    {/* 3m Line Team B */}
                    <div className="absolute top-1/3 w-full border-t border-white/30"></div>
                </div>

                {renderTeam(teamA, true, rotations.teamA)}
                {renderTeam(teamB, false, rotations.teamB)}
            </div>

            {/* Ball Animation */}
            {latestEvent && latestEvent.x !== undefined && latestEvent.y !== undefined && (
                <div
                    className="absolute w-4 h-4 bg-yellow-300 rounded-full shadow-[0_0_15px_rgba(253,224,71,1)] transition-all duration-300 ease-out z-10"
                    style={{
                        left: `calc(${latestEvent.x}% - 8px)`,
                        top: `calc(${latestEvent.y}% - 8px)`
                    }}
                />
            )}
        </div>
    );
};
