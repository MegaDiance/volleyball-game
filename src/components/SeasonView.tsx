import React from 'react';
import type { Season } from '../engine/season';
import type { Team } from '../engine/models';
import { Trophy, CalendarDays, Zap, Award, Medal, LayoutDashboard, Wallet, TrendingUp, Users, History, Shuffle } from 'lucide-react';
import { PlayerProfileModal } from './PlayerProfileModal';
import { formatCurrency } from '../utils/format';

interface SeasonViewProps {
    season: Season;
    teams: Team[];
    myTeamId?: string;
    leagueName?: string;
    onSelectTeam: (teamId: string) => void;
    onPlayNextMatch: (matchId: string) => void;
    onSimulateAll?: () => void;
    onTacticChange: (teamId: string, tactic: string, value: any) => void;
    onStartNextSeason?: () => void;
}

export const SeasonView: React.FC<SeasonViewProps> = ({ season, teams, myTeamId, leagueName = 'My League', onSelectTeam, onPlayNextMatch, onSimulateAll, onTacticChange, onStartNextSeason }) => {
    const sortedStandings = Object.entries(season.standings)
        .sort(([, a], [, b]) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            const setDiffA = a.setsWon - a.setsLost;
            const setDiffB = b.setsWon - b.setsLost;
            return setDiffB - setDiffA;
        });

    const currentWeekMatches = season.schedule[season.week - 1] || [];
    const allMatchesPlayed = currentWeekMatches.every(m => m.isPlayed);

    const getTeam = (id: string) => teams.find(t => t.id === id);

    const [activeTab, setActiveTab] = React.useState<'DASHBOARD' | 'SCHEDULE' | 'FINANCIALS' | 'AWARDS' | 'HISTORY' | 'TEAMS' | 'FREE_AGENCY'>('DASHBOARD');
    const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);

    const activePlayer = selectedPlayerId ? teams.flatMap(t => t.players).find(p => p.id === selectedPlayerId) || season.freeAgents.find(p => p.id === selectedPlayerId) : null;
    const activePlayerTeam = activePlayer ? teams.find(t => t.players.some(p => p.id === activePlayer.id)) : undefined;

    const myTeam = getTeam(myTeamId || '');
    const totalSalaries = myTeam?.players.reduce((sum, p) => sum + (p.salary || 0), 0) || 0;
    const capRoom = (myTeam?.salaryCap || 0) - totalSalaries;

    return (
        <div className="max-w-7xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Upper Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/20">
                            {season.phase} Phase
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded border border-slate-700">
                            Week {season.week} of {season.schedule.length}
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">
                        {leagueName}
                    </h1>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'SCHEDULE', label: season.phase === 'REGULAR' ? 'Schedule' : 'Playoffs', icon: season.phase === 'REGULAR' ? CalendarDays : Trophy },
                        { id: 'TEAMS', label: 'Teams', icon: Users },
                        { id: 'FREE_AGENCY', label: 'Free Agency', icon: Zap },
                        { id: 'FINANCIALS', label: 'Financials', icon: Wallet },
                        { id: 'HISTORY', label: 'History', icon: History },
                        ...(season.phase === 'OFFSEASON' ? [{ id: 'AWARDS', label: 'Awards', icon: Award }] : [])
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'DASHBOARD' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Standings Table */}
                    <div className="lg:col-span-2 space-y-6">
                        {season.phase === 'OFFSEASON' ? (
                            <section className="bg-gradient-to-br from-yellow-600/20 to-amber-900/20 rounded-2xl border border-yellow-500/30 p-10 text-center relative overflow-hidden backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
                                <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Season Complete</h2>
                                <p className="text-yellow-400/80 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Championship Winner</p>
                                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl inline-block">
                                    <h3 className="text-5xl font-black text-white drop-shadow-xl">{getTeam(season.playoffs?.finals.winnerId || '')?.name}</h3>
                                </div>
                                <div className="mt-10">
                                    <button onClick={onStartNextSeason} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest text-xs">
                                        Advance to Next Season
                                    </button>
                                </div>
                            </section>
                        ) : (
                            <section className="bg-slate-800/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" /> League Standings
                                    </h2>
                                    {season.phase === 'REGULAR' && onSimulateAll && (
                                        <button
                                            onClick={onSimulateAll}
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-900/40"
                                        >
                                            Simulate All
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    {/* ... Standings table content remains the same ... */}
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-900/30 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">RK</th>
                                                <th className="px-6 py-4">Team</th>
                                                <th className="px-6 py-4 text-center">W-L</th>
                                                <th className="px-6 py-4 text-center">PTS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {sortedStandings.map(([teamId, record], index) => {
                                                const team = getTeam(teamId);
                                                const isSelected = teamId === myTeamId;
                                                const isPlayoffSpot = index < 4;
                                                return (
                                                    <tr key={teamId} className={`group transition-all cursor-pointer ${isSelected ? 'bg-blue-600/10' : 'hover:bg-white/5'}`} onClick={() => onSelectTeam(teamId)}>
                                                        <td className="px-6 py-4"><span className={`text-base font-black ${isPlayoffSpot ? 'text-emerald-400' : 'text-slate-600'}`}>{index + 1}</span></td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className={`font-black uppercase tracking-tight ${isSelected ? 'text-blue-400' : 'text-white'}`}>{team?.name}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{team?.location}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center"><span className="font-bold text-slate-200">{record.wins} - {record.losses}</span></td>
                                                        <td className="px-6 py-4 text-center"><span className="bg-slate-900/50 px-3 py-1 rounded text-emerald-400 font-black tabular-nums border border-white/5">{record.points}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Sidebar: Current Matchup & News */}
                    <div className="space-y-8">
                        {/* Achievements / Milestones */}
                        {season.achievements && season.achievements.length > 0 && (
                            <section className="bg-slate-800/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Career Milestones
                                </h3>
                                <div className="space-y-3">
                                    {season.achievements.slice(-3).map(a => (
                                        <div key={a.id} className="p-3 bg-white/5 rounded-xl border border-white/5 animate-in slide-in-from-right-4">
                                            <div className="text-xs font-black text-white">{a.title}</div>
                                            <div className="text-[10px] text-slate-500 font-bold">{a.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {/* Featured Matchup */}
                        <section className="bg-gradient-to-br from-blue-900/40 to-slate-900 rounded-2xl border border-blue-500/20 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Next Up
                            </h3>

                            {season.phase === 'REGULAR' ? (
                                <div className="space-y-6">
                                    {currentWeekMatches.filter(m => myTeamId && (m.teamAId === myTeamId || m.teamBId === myTeamId)).length === 0 && (
                                        <div className="text-center py-6">
                                            <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">Bye Week - No Match Scheduled</div>
                                            {allMatchesPlayed && (
                                                <button
                                                    onClick={() => onPlayNextMatch('ADVANCE_WEEK')}
                                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all animate-bounce"
                                                >
                                                    Advance to Next Week
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {currentWeekMatches.filter(m => myTeamId && (m.teamAId === myTeamId || m.teamBId === myTeamId)).map((match, idx) => {
                                        const tA = getTeam(match.teamAId);
                                        const tB = getTeam(match.teamBId);
                                        return (
                                            <div key={idx} className="space-y-6">
                                                <div className="flex justify-between items-center text-center">
                                                    <div className="flex-1">
                                                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/5 shadow-xl">
                                                            <span className="text-xl font-black text-white">{tA?.name[0]}</span>
                                                        </div>
                                                        <div className="text-xs font-black text-white uppercase">{tA?.name}</div>
                                                    </div>
                                                    <div className="px-4">
                                                        <div className="text-lg font-black text-slate-600 italic">VS</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/5 shadow-xl">
                                                            <span className="text-xl font-black text-white">{tB?.name[0]}</span>
                                                        </div>
                                                        <div className="text-xs font-black text-white uppercase">{tB?.name}</div>
                                                    </div>
                                                </div>

                                                {!match.isPlayed ? (
                                                    <button
                                                        onClick={() => onPlayNextMatch('FEATURED')}
                                                        className="w-full py-4 bg-white text-slate-900 font-black uppercase tracking-tighter text-sm rounded-xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                    >
                                                        Enter Match
                                                    </button>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="text-center bg-white/5 p-4 rounded-xl border border-white/5 font-black text-emerald-400">
                                                            Result: {match.score}
                                                        </div>
                                                        {allMatchesPlayed && (
                                                            <button
                                                                onClick={() => onPlayNextMatch('ADVANCE_WEEK')}
                                                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all animate-bounce"
                                                            >
                                                                Advance to Next Week
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                    Post-Season Active
                                </div>
                            )}
                        </section>

                        {/* Team Tactics */}
                        <section className="bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shuffle className="w-4 h-4 text-orange-400" /> Team Tactics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Serve Risk</label>
                                    <select
                                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500/50"
                                        value={myTeam?.tactics.serveRisk || 'BALANCED'}
                                        onChange={(e) => onTacticChange(myTeamId!, 'serveRisk', e.target.value)}
                                    >
                                        <option value="SAFE">Safe</option>
                                        <option value="BALANCED">Balanced</option>
                                        <option value="AGGRESSIVE">Aggressive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Offensive Tempo</label>
                                    <select
                                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500/50"
                                        value={myTeam?.tactics.tempo || 'NORMAL'}
                                        onChange={(e) => onTacticChange(myTeamId!, 'tempo', e.target.value)}
                                    >
                                        <option value="SLOW">Slow / High</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="FAST">Fast / Quick</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'SCHEDULE' && (
                <div className="max-w-4xl mx-auto space-y-10">
                    {season.phase === 'REGULAR' ? (
                        season.schedule.map((weekMatches, wIdx) => (
                            <div key={wIdx} className="space-y-4">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <span className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-xs">W{wIdx + 1}</span>
                                    Week {wIdx + 1} Matches
                                </h3>
                                {/* ... Match list remains the same ... */}
                                <div className="grid gap-3">
                                    {weekMatches.map((match, mIdx) => {
                                        const tA = getTeam(match.teamAId);
                                        const tB = getTeam(match.teamBId);
                                        const isMyMatch = myTeamId && (match.teamAId === myTeamId || match.teamBId === myTeamId);
                                        return (
                                            <div key={mIdx} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${match.isPlayed ? 'bg-slate-900/50 border-white/5 opacity-80' : (isMyMatch ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-800/40 border-white/5')}`}>
                                                <div className="flex-1 text-right pr-6">
                                                    <div className="font-black text-white uppercase tracking-tight">{tA?.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase">{tA?.location}</div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    {match.isPlayed ? (
                                                        <span className="px-4 py-1.5 bg-slate-800 rounded-xl text-emerald-400 font-black tabular-nums border border-white/5">{match.score}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase">VS</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 pl-6 flex items-center justify-between">
                                                    <div>
                                                        <div className="font-black text-white uppercase tracking-tight">{tB?.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase">{tB?.location}</div>
                                                    </div>
                                                    {!match.isPlayed && (
                                                        <button
                                                            onClick={() => onPlayNextMatch(`${wIdx}-${mIdx}`)}
                                                            disabled={wIdx !== season.week - 1}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${wIdx !== season.week - 1 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : (isMyMatch ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-700 text-slate-300 hover:bg-slate-600')}`}
                                                        >
                                                            {isMyMatch ? 'Play' : 'Watch'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : season.playoffs ? (
                        <div className="space-y-12">
                            <section>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                                    <Trophy className="w-6 h-6 text-blue-400" /> Semifinals
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {season.playoffs.semis.map((match, i) => {
                                        const tA = getTeam(match.teamAId || '');
                                        const tB = getTeam(match.teamBId || '');
                                        const isMyMatch = myTeamId && (match.teamAId === myTeamId || match.teamBId === myTeamId);
                                        return (
                                            <div key={i} className={`p-6 rounded-3xl border ${match.isPlayed ? 'bg-slate-900/50 border-white/5' : (isMyMatch ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-800/40 border-white/5')} shadow-xl`}>
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="text-center flex-1">
                                                        <div className="text-lg font-black text-white uppercase">{tA?.name || '---'}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold">#1 SEED</div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="px-4 text-slate-600 font-black italic">VS</div>
                                                        {!match.isPlayed && match.teamAId && match.teamBId && (
                                                            <button
                                                                onClick={() => onPlayNextMatch(`PLAYOFFS-SEMIS-${i}`)}
                                                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isMyMatch ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                                            >
                                                                {isMyMatch ? 'Play' : 'Watch'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="text-center flex-1">
                                                        <div className="text-lg font-black text-white uppercase">{tB?.name || '---'}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold">#4 SEED</div>
                                                    </div>
                                                </div>
                                                {!match.isPlayed && match.teamAId && match.teamBId ? (
                                                    <button onClick={() => onPlayNextMatch('PLAYOFF_' + match.id)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all">
                                                        {isMyMatch ? 'Play Match' : 'Simulate'}
                                                    </button>
                                                ) : match.isPlayed && (
                                                    <div className="text-center text-emerald-400 font-black text-xl tabular-nums">{match.score}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="pt-10 border-t border-white/5">
                                <h3 className="text-2xl font-black text-yellow-400 uppercase tracking-tighter mb-8 flex items-center justify-center gap-3">
                                    <Trophy className="w-8 h-8" /> Championship Finals
                                </h3>
                                <div className={`max-w-md mx-auto p-10 rounded-[3rem] border ${season.playoffs.finals.isPlayed ? 'bg-slate-900/60 border-white/5' : 'bg-gradient-to-br from-yellow-600/20 to-orange-900/20 shadow-2xl shadow-yellow-900/20 border-yellow-500/30'}`}>
                                    {season.playoffs.finals.teamAId ? (
                                        <div className="space-y-10">
                                            <div className="flex justify-between items-center text-center">
                                                <div className="flex-1">
                                                    <div className="text-2xl font-black text-white uppercase">{getTeam(season.playoffs.finals.teamAId)?.name}</div>
                                                </div>
                                                <div className="px-6 text-yellow-500/50 font-black text-xl italic">VS</div>
                                                <div className="flex-1">
                                                    <div className="text-2xl font-black text-white uppercase">{getTeam(season.playoffs.finals.teamBId!)?.name}</div>
                                                </div>
                                            </div>
                                            {!season.playoffs.finals.isPlayed ? (
                                                <button onClick={() => onPlayNextMatch('PLAYOFF_F')} className="w-full py-5 bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 text-white font-black uppercase tracking-widest rounded-3xl transition-all transform hover:scale-105 shadow-2xl shadow-yellow-900/40">
                                                    Enter Finals
                                                </button>
                                            ) : (
                                                <div className="text-center text-yellow-400 font-black text-4xl tabular-nums drop-shadow-xl">{season.playoffs.finals.score}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500 font-black uppercase tracking-widest py-10">Finals TBD</div>
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : null}
                </div>
            )
            }

            {
                activeTab === 'AWARDS' && season.awards && (
                    <div className="max-w-5xl mx-auto space-y-12">
                        <div className="text-center">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Season Hall of Fame</h2>
                            <div className="h-1 w-24 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AwardCard label="League MVP" playerId={season.awards.mvp} teams={teams} icon={<Trophy className="w-8 h-8 text-yellow-400" />} onSelectPlayer={setSelectedPlayerId} />
                            <AwardCard label="Best Setter" playerId={season.awards.bestSetter} teams={teams} icon={<Zap className="w-8 h-8 text-blue-400" />} onSelectPlayer={setSelectedPlayerId} />
                            <AwardCard label="Best Hitter" playerId={season.awards.bestHitter} teams={teams} icon={<Medal className="w-8 h-8 text-orange-400" />} onSelectPlayer={setSelectedPlayerId} />
                            <AwardCard label="Best Middle" playerId={season.awards.bestMB} teams={teams} icon={<Trophy className="w-8 h-8 text-emerald-400" />} onSelectPlayer={setSelectedPlayerId} />
                            <AwardCard label="Best Libero" playerId={season.awards.bestLibero} teams={teams} icon={<Award className="w-8 h-8 text-slate-400" />} onSelectPlayer={setSelectedPlayerId} />
                            {season.awards.champMVP && (
                                <AwardCard label="Finals MVP" playerId={season.awards.champMVP} teams={teams} icon={<Trophy className="w-8 h-8 text-amber-500" />} onSelectPlayer={setSelectedPlayerId} />
                            )}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'FINANCIALS' && (
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl shadow-xl shadow-emerald-900/20 border border-emerald-400/30">
                                <Wallet className="w-8 h-8 text-black/30 mb-4" />
                                <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Current Budget</div>
                                <div className="text-3xl font-black text-white tracking-tighter">{formatCurrency(myTeam?.budget || 0)}</div>
                            </div>
                            <div className="bg-slate-800/60 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                                <Users className="w-8 h-8 text-slate-500 mb-4" />
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Salaries</div>
                                <div className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalSalaries)}</div>
                            </div>
                            <div className={`p-8 rounded-3xl border ${capRoom >= 0 ? 'bg-slate-800/60 border-white/5' : 'bg-red-900/20 border-red-500/30'}`}>
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Cap Space</div>
                                <div className={`text-3xl font-black tracking-tighter ${capRoom >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(capRoom)}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2 uppercase font-black tracking-widest">Cap: {formatCurrency(Object.values(teams)[0]?.salaryCap || 0)}</div>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm">
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Player Contracts</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/30 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4 text-center">RK</th>
                                        <th className="px-8 py-4">Player</th>
                                        <th className="px-8 py-4 text-center">POS</th>
                                        <th className="px-8 py-4 text-center">OVR</th>
                                        <th className="px-8 py-4 text-right">SALARY</th>
                                        <th className="px-8 py-4 text-center">TERM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {myTeam?.players.sort((a, b) => b.salary - a.salary).map((p, i) => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-4 text-center text-slate-600 font-black">{i + 1}</td>
                                            <td className="px-8 py-4">
                                                <button
                                                    onClick={() => setSelectedPlayerId(p.id)}
                                                    className="font-bold text-white hover:text-blue-400 transition-colors text-left"
                                                >
                                                    {p.firstName} {p.lastName}
                                                </button>
                                                {(p.traits || []).length > 0 && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded border border-blue-500/30">
                                                        {p.traits[0]}
                                                    </span>
                                                )}
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">{p.age} years old</div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="bg-slate-900 px-2 py-1 rounded text-[10px] font-black text-blue-400 border border-white/10 uppercase">{p.position}</span>
                                            </td>
                                            <td className="px-8 py-4 text-center text-slate-200 font-black">{p.overall}</td>
                                            <td className="px-8 py-4 text-right font-black text-emerald-400">{formatCurrency(p.salary)}</td>
                                            <td className="px-8 py-4 text-center text-slate-500 font-bold underline decoration-white/20 underline-offset-4">{p.contractYears}Y</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'HISTORY' && (
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Career Leaders */}
                            <section className="bg-slate-800/40 rounded-3xl border border-white/5 p-8 backdrop-blur-sm">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                                    <History className="w-6 h-6 text-emerald-400" /> Career Leaders
                                </h3>

                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Most Career Kills</h4>
                                        <div className="space-y-3">
                                            {teams.flatMap(t => t.players)
                                                .sort((a, b) => (b.careerStats?.totalKills || 0) - (a.careerStats?.totalKills || 0))
                                                .slice(0, 5)
                                                .map((p, i) => (
                                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xl font-black text-slate-700 w-6">#{i + 1}</span>
                                                            <div>
                                                                <button
                                                                    onClick={() => setSelectedPlayerId(p.id)}
                                                                    className="font-bold text-white text-sm hover:text-blue-400 transition-colors text-left"
                                                                >
                                                                    {p.firstName} {p.lastName}
                                                                </button>
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase">{p.careerStats?.seasons || 0} Seasons</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xl font-black text-emerald-400 tabular-nums">{p.careerStats?.totalKills || 0}</div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Most Career Blocks</h4>
                                        <div className="space-y-3">
                                            {teams.flatMap(t => t.players)
                                                .sort((a, b) => (b.careerStats?.totalBlocks || 0) - (a.careerStats?.totalBlocks || 0))
                                                .slice(0, 5)
                                                .map((p, i) => (
                                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xl font-black text-slate-700 w-6">#{i + 1}</span>
                                                            <div>
                                                                <button
                                                                    onClick={() => setSelectedPlayerId(p.id)}
                                                                    className="font-bold text-white text-sm hover:text-blue-400 transition-colors text-left"
                                                                >
                                                                    {p.firstName} {p.lastName}
                                                                </button>
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase">{p.careerStats?.seasons || 0} Seasons</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xl font-black text-blue-400 tabular-nums">{p.careerStats?.totalBlocks || 0}</div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Most Career Aces</h4>
                                <div className="space-y-3">
                                    {teams.flatMap(t => t.players)
                                        .sort((a, b) => (b.careerStats?.totalAces || 0) - (a.careerStats?.totalAces || 0))
                                        .slice(0, 5)
                                        .map((p, i) => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl font-black text-slate-700 w-6">#{i + 1}</span>
                                                    <div>
                                                        <button
                                                            onClick={() => setSelectedPlayerId(p.id)}
                                                            className="font-bold text-white text-sm hover:text-blue-400 transition-colors text-left"
                                                        >
                                                            {p.firstName} {p.lastName}
                                                        </button>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase">{p.careerStats?.seasons || 0} Seasons</div>
                                                    </div>
                                                </div>
                                                <div className="text-xl font-black text-yellow-500 tabular-nums">{p.careerStats?.totalAces || 0}</div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Most Career Assists</h4>
                                <div className="space-y-3">
                                    {teams.flatMap(t => t.players)
                                        .sort((a, b) => (b.careerStats?.totalAssists || 0) - (a.careerStats?.totalAssists || 0))
                                        .slice(0, 5)
                                        .map((p, i) => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl font-black text-slate-700 w-6">#{i + 1}</span>
                                                    <div>
                                                        <button
                                                            onClick={() => setSelectedPlayerId(p.id)}
                                                            className="font-bold text-white text-sm hover:text-blue-400 transition-colors text-left"
                                                        >
                                                            {p.firstName} {p.lastName}
                                                        </button>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase">{p.careerStats?.seasons || 0} Seasons</div>
                                                    </div>
                                                </div>
                                                <div className="text-xl font-black text-purple-400 tabular-nums">{p.careerStats?.totalAssists || 0}</div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Season Log */}
                            <section className="bg-slate-800/40 rounded-3xl border border-white/5 p-8 backdrop-blur-sm">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-blue-400" /> League History
                                </h3>

                                <div className="space-y-4">
                                    {[...season.history].reverse().map((h) => (
                                        <div key={h.year} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5 flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-400">SEASON {h.year}</span>
                                                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase rounded border border-yellow-500/20">Finals Complete</span>
                                            </div>
                                            <div className="p-6 grid grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Champion</div>
                                                    <div className="font-black text-white text-base uppercase leading-tight italic">{getTeam(h.championId)?.name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">MVP</div>
                                                    <div className="font-bold text-blue-400 text-sm">
                                                        {teams.flatMap(t => t.players).find(p => p.id === h.mvpId)
                                                            ? `${teams.flatMap(t => t.players).find(p => p.id === h.mvpId)?.firstName[0]}. ${teams.flatMap(t => t.players).find(p => p.id === h.mvpId)?.lastName}`
                                                            : '---'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {season.history.length === 0 && (
                                        <div className="text-center py-20">
                                            <History className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Historical Data Yet</div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )
            }

            {activeTab === 'TEAMS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <section className="bg-slate-800/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-400" /> League Roster Directory
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/30 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">RK</th>
                                        <th className="px-6 py-4">Team</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4 text-center">Avg OVR</th>
                                        <th className="px-6 py-4 text-center">Players</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedStandings.map(([teamId], index) => {
                                        const team = getTeam(teamId);
                                        if (!team) return null;
                                        return (
                                            <tr key={team.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-6 py-4 font-black text-slate-700">#{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-black uppercase tracking-tight ${teamId === myTeamId ? 'text-blue-400' : 'text-white'}`}>{team.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-400 font-bold">{team.location}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-black text-emerald-400">
                                                        {Math.round(team.players.reduce((s, p) => s + p.overall, 0) / team.players.length)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-slate-500 font-bold">{team.players.length}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => onSelectTeam(team.id)}
                                                        className="px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                    >
                                                        Roster
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'FREE_AGENCY' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <section className="bg-slate-800/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" /> Free Agent Pool
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/30 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">POS</th>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-6 py-4 text-center">OVR</th>
                                        <th className="px-6 py-4 text-center">Age</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(season.freeAgents || []).sort((a, b) => b.overall - a.overall).map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-all">
                                            <td className="px-6 py-4 font-black text-blue-400">{p.position}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedPlayerId(p.id)}
                                                    className="font-black text-white hover:text-blue-400 transition-colors"
                                                >
                                                    {p.firstName} {p.lastName}
                                                </button>
                                                {(p.traits || []).length > 0 && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase rounded border border-yellow-500/30">
                                                        {p.traits[0]}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-emerald-400 text-lg">{p.overall}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-slate-500 font-bold">{p.age}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                    onClick={() => onSelectTeam(myTeamId || '')}
                                                >
                                                    Sign
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(season.freeAgents || []).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic font-bold">No free agents available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
            {activePlayer && (
                <PlayerProfileModal
                    player={activePlayer}
                    team={activePlayerTeam}
                    season={season}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};

const AwardCard: React.FC<{ label: string, playerId: string, teams: Team[], icon: React.ReactNode, onSelectPlayer: (id: string) => void }> = ({ label, playerId, teams, icon, onSelectPlayer }) => {
    const player = teams.flatMap(t => t.players).find(p => p.id === playerId);
    const team = teams.find(t => t.players.some(p => p.id === playerId));

    if (!player) return null;

    return (
        <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-slate-800 rounded-lg">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
                <button
                    onClick={() => onSelectPlayer(player.id)}
                    className="text-lg font-bold text-white truncate hover:text-blue-400 transition-colors block"
                >
                    {player.firstName} {player.lastName}
                </button>
                <div className="text-xs text-slate-400 font-semibold">{team?.name} • <span className="text-blue-400">OVR {player.overall}</span></div>
            </div>
        </div>
    );
};
