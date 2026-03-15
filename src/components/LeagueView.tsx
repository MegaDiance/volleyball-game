import React from 'react';
import type { Team } from '../engine/models';
import { Users, Trophy } from 'lucide-react';

interface LeagueViewProps {
    teams: Team[];
    onSelectTeam: (team: Team) => void;
}

export const LeagueView: React.FC<LeagueViewProps> = ({ teams, onSelectTeam }) => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center space-x-3 mb-8">
                <Trophy className="w-10 h-10 text-yellow-400" />
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Volleyball GM Simulation
                </h1>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-2xl font-bold flex items-center">
                        <Users className="w-6 h-6 mr-2 text-blue-400" />
                        League Teams
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">Select a team to view their roster or challenge them to a match.</p>
                </div>

                <div className="divide-y divide-slate-700/50">
                    {teams.map((team) => {
                        const avgOverall = Math.round(team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length);
                        return (
                            <div
                                key={team.id}
                                onClick={() => onSelectTeam(team)}
                                className="flex items-center justify-between p-6 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                                        {team.location} {team.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{team.players.length} Players on Roster</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-emerald-400">{avgOverall}</div>
                                    <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Team OVR</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
