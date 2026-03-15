import React, { useEffect, useState, useRef } from 'react';
import type { MatchState, Team, Player } from '../engine/models';
import { createMatch, advanceRallyLoop } from '../engine/simulator';
import { ChevronLeft, Play, FastForward, Trophy, Award, Medal, RefreshCw, Zap, Battery } from 'lucide-react';
import { CourtView } from './CourtView';

interface MatchViewProps {
    teamA: Team;
    teamB: Team;
    onExit: (matchResult: MatchState) => void;
    isSimulated?: boolean;
    onLineupChange?: (starters: Team['starters']) => void;
    isMyTeamA?: boolean;
}

export const MatchView: React.FC<MatchViewProps> = ({ teamA, teamB, onExit, isSimulated, onLineupChange, isMyTeamA }) => {
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed] = useState(800);
    const [showLineupModal, setShowLineupModal] = useState(false);

    const simulatedRef = useRef(false);
    const [activeSubTab, setActiveSubTab] = useState<'LOG' | 'BOX_SCORE'>('LOG');

    useEffect(() => {
        if (matchState) return; // DON'T reset if already in progress
        const newMatch = createMatch(teamA, teamB);
        if (isSimulated) {
            if (simulatedRef.current) return;
            simulatedRef.current = true;
            let state = { ...newMatch };
            let safety = 0;
            while (!state.gameOver && safety < 50000) {
                advanceRallyLoop(state, teamA, teamB);
                safety++;
            }
            onExit(state);
        } else {
            setMatchState(newMatch);
            // Show lineup modal on START if it's the user's team
            if (isMyTeamA !== undefined) {
                setShowLineupModal(true);
            }
        }
    }, [teamA, teamB, isSimulated, matchState]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isPlaying && matchState && !matchState.gameOver) {
            // Check if we need to show lineup modal (Set break or Start)
            if (matchState.rallyPhase === 'SET_BREAK' && !showLineupModal) {
                setIsPlaying(false);
                if (isMyTeamA !== undefined) {
                    setShowLineupModal(true);
                } else {
                    const nextState = { ...matchState, rallyPhase: 'WAITING_TO_SERVE' as const };
                    setMatchState(nextState);
                }
                return;
            }
            timer = setTimeout(() => {
                const nextState = { ...matchState };
                nextState.events = [...matchState.events];
                advanceRallyLoop(nextState, teamA, teamB);
                setMatchState(nextState);
            }, playSpeed);
        } else if (matchState?.gameOver) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, matchState, playSpeed, teamA, teamB]);

    // UseEffect for auto-scrolling removed as per user request to improve experience

    // handleScroll removed as auto-scroll is disabled

    const handleManualSim = () => {
        if (!matchState || matchState.gameOver) return;
        if (matchState.rallyPhase === 'SET_BREAK') {
            if (isMyTeamA !== undefined) {
                setShowLineupModal(true);
            } else {
                setMatchState({ ...matchState, rallyPhase: 'WAITING_TO_SERVE' });
            }
            return;
        }
        const nextState = { ...matchState };
        nextState.events = [...matchState.events];
        advanceRallyLoop(nextState, teamA, teamB);
        setMatchState(nextState);
    };

    const handleSimToEnd = () => {
        if (!matchState || matchState.gameOver) return;
        const nextState: MatchState = {
            ...matchState,
            events: [...matchState.events],
            setScores: [...matchState.setScores],
            rotations: { ...matchState.rotations },
            playerStats: Object.fromEntries(
                Object.entries(matchState.playerStats).map(([k, v]) => [k, { ...v }])
            ),
            playerPositions: { ...matchState.playerPositions }
        };
        let safety = 0;
        while (!nextState.gameOver && safety < 50000) {
            advanceRallyLoop(nextState, teamA, teamB);
            safety++;
        }
        setMatchState(nextState);
    };

    const handleSimToNextSet = () => {
        if (!matchState || matchState.gameOver) return;
        const nextState: MatchState = {
            ...matchState,
            events: [...matchState.events],
            setScores: [...matchState.setScores],
            rotations: { ...matchState.rotations },
            playerStats: Object.fromEntries(
                Object.entries(matchState.playerStats).map(([k, v]) => [k, { ...v }])
            ),
            playerPositions: { ...matchState.playerPositions }
        };
        const startSets = nextState.setsA + nextState.setsB;
        let safety = 0;
        while (!nextState.gameOver && (nextState.setsA + nextState.setsB) === startSets && safety < 50000) {
            advanceRallyLoop(nextState, teamA, teamB);
            safety++;
        }
        setMatchState(nextState);
    };

    const handleLineupConfirm = () => {
        setShowLineupModal(false);
        if (matchState) {
            setMatchState({ ...matchState, rallyPhase: 'WAITING_TO_SERVE' });
        }
    };


    const getPlayerFull = (id: string) => {
        let p = teamA.players.find(x => x.id === id);
        if (p) return `${p.firstName} ${p.lastName} (${teamA.name})`;
        p = teamB.players.find(x => x.id === id);
        if (p) return `${p.firstName} ${p.lastName} (${teamB.name})`;
        return 'Unknown';
    }

    if (!matchState) return null;

    const myTeam = isMyTeamA === true ? teamA : (isMyTeamA === false ? teamB : null);

    return (
        <div className="max-w-6xl mx-auto p-6 flex flex-col h-screen max-h-screen">
            <button onClick={() => onExit(matchState)} className="flex flex-none items-center text-blue-400 hover:text-blue-300 font-semibold mb-6">
                <ChevronLeft className="w-5 h-5 mr-1" /> {matchState.gameOver ? 'Return to Season' : 'Forfeit & Exit'}
            </button>

            {/* Top Section: Scoreboard & Court */}
            <div className="flex-none grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Scoreboard */}
                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-700/20 to-transparent pointer-events-none"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className={`text-center flex-1 ${matchState.servingTeamId === teamA.id ? 'opacity-100 scale-105' : 'opacity-70'} transition-all`}>
                            <h2 className="text-3xl font-black text-white">{teamA.name}</h2>
                            <div className="text-7xl font-black text-emerald-400 mt-4 tabular-nums">{matchState.currentSetPointsA}</div>

                            {/* Team A Stamina Summary */}
                            <div className="flex flex-wrap justify-center gap-1 mt-3">
                                {Object.values(teamA.starters).map(pid => (
                                    <div key={pid} className="w-1 h-3 rounded-full overflow-hidden bg-slate-700" title={`Stamina: ${Math.round(matchState.playerStamina[pid])}%`}>
                                        <div
                                            className={`h-full ${matchState.playerStamina[pid] > 60 ? 'bg-emerald-500' : (matchState.playerStamina[pid] > 30 ? 'bg-yellow-500' : 'bg-red-500')}`}
                                            style={{ height: `${matchState.playerStamina[pid]}%` }}
                                        />
                                    </div>
                                ))}
                                <Battery className="w-3 h-3 text-slate-500 ml-1" />
                            </div>

                            <div className="mt-2 text-slate-300 font-bold">SETS: <span className="text-xl text-white ml-2">{matchState.setsA}</span></div>
                        </div>

                        <div className="flex flex-col items-center justify-center px-8">
                            <div className="text-slate-500 font-black text-2xl mb-4">VS</div>
                            {matchState.gameOver ? (
                                <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-bold animate-pulse">
                                    FINAL
                                </div>
                            ) : matchState.rallyPhase === 'SET_BREAK' ? (
                                <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-lg font-bold animate-pulse">
                                    SET BREAK
                                </div>
                            ) : (
                                <div className="bg-slate-900 px-3 py-1 rounded text-xs font-bold text-slate-400">
                                    {matchState.rallyPhase.replace(/_/g, ' ')}
                                </div>
                            )}
                        </div>

                        <div className={`text-center flex-1 ${matchState.servingTeamId === teamB.id ? 'opacity-100 scale-105' : 'opacity-70'} transition-all`}>
                            <h2 className="text-3xl font-black text-white">{teamB.name}</h2>
                            <div className="text-7xl font-black text-emerald-400 mt-4 tabular-nums">{matchState.currentSetPointsB}</div>

                            {/* Team B Stamina Summary */}
                            <div className="flex flex-wrap justify-center gap-1 mt-3">
                                <Battery className="w-3 h-3 text-slate-500 mr-1" />
                                {Object.values(teamB.starters).map(pid => (
                                    <div key={pid} className="w-1 h-3 rounded-full overflow-hidden bg-slate-700" title={`Stamina: ${Math.round(matchState.playerStamina[pid])}%`}>
                                        <div
                                            className={`h-full ${matchState.playerStamina[pid] > 60 ? 'bg-emerald-500' : (matchState.playerStamina[pid] > 30 ? 'bg-yellow-500' : 'bg-red-500')}`}
                                            style={{ height: `${matchState.playerStamina[pid]}%` }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-2 text-slate-300 font-bold">SETS: <span className="text-xl text-white ml-2">{matchState.setsB}</span></div>
                        </div>
                    </div>

                    {/* Adrenaline / Momentum Bar */}
                    <div className="mt-8 relative z-10">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            <span>TEAM A MOMENTUM</span>
                            <Zap className={`w-4 h-4 ${matchState.momentum > 0.6 ? 'text-yellow-400 animate-pulse' : (matchState.momentum < 0.4 ? 'text-orange-400' : 'text-slate-600')}`} />
                            <span>TEAM B MOMENTUM</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 p-[1px]">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 via-slate-700 to-blue-500 transition-all duration-500"
                                style={{ width: '100%', transformOrigin: 'center', scale: '1' }}
                            >
                                <div
                                    className="h-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${matchState.momentum * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {matchState.setScores.length > 0 && (
                        <div className="flex justify-center gap-4 mt-6 relative z-10 border-t border-slate-700/50 pt-4">
                            {matchState.setScores.map((score, i) => (
                                <div key={i} className="text-sm font-bold bg-slate-900/50 px-3 py-1 rounded border border-slate-700 text-slate-400">
                                    S{i + 1}: <span className={score.teamA > score.teamB ? 'text-blue-400' : 'text-slate-200'}>{score.teamA}</span> - <span className={score.teamB > score.teamA ? 'text-blue-400' : 'text-slate-200'}>{score.teamB}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2D Court */}
                <CourtView
                    events={matchState.events}
                    teamA={teamA}
                    teamB={teamB}
                    rotations={matchState.rotations}
                />
            </div>

            {/* Controls */}
            <div className="flex-none flex justify-center gap-4 mb-6">
                {!matchState.gameOver && (
                    <>
                        <button
                            onClick={handleManualSim} disabled={isPlaying}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg border border-slate-600 transition-colors disabled:opacity-50"
                        >
                            Next Touch
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`flex items-center px-6 py-3 ${isPlaying ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-xl shadow-lg border border-transparent transition-colors`}
                        >
                            <Play className="w-5 h-5 mr-2" /> {isPlaying ? 'Pause' : 'Auto Play'}
                        </button>
                        <button
                            onClick={handleSimToEnd} disabled={isPlaying}
                            className="flex items-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl shadow-lg border border-slate-600 transition-colors disabled:opacity-50"
                        >
                            <FastForward className="w-5 h-5 mr-2" /> Sim to End
                        </button>
                        <button
                            onClick={handleSimToNextSet} disabled={isPlaying}
                            className="flex items-center px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg border border-purple-500/50 transition-colors disabled:opacity-50"
                        >
                            <FastForward className="w-5 h-5 mr-2" /> Sim to Set
                        </button>
                    </>
                )}
            </div>

            {/* Play by Play & Box Score */}
            <div className="flex-1 min-h-0 flex flex-col bg-slate-900 rounded-xl shadow-inner border border-slate-800 overflow-hidden">
                <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveSubTab('LOG')}
                            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeSubTab === 'LOG' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Game Log
                        </button>
                        <button
                            onClick={() => setActiveSubTab('BOX_SCORE')}
                            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeSubTab === 'BOX_SCORE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Box Score
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 relative" style={{ overflowAnchor: 'none' }}>
                    {activeSubTab === 'LOG' ? (
                        <div className="space-y-3 pb-4">
                            {matchState.events.length === 0 && <p className="text-center text-slate-500 mt-10 italic">Waiting for serve...</p>}

                            {matchState.events.map((evt) => {
                                let colorClass = "text-slate-300";
                                let bgClass = "bg-transparent";

                                if (evt.type === 'POINT') {
                                    colorClass = evt.teamScoredId === teamA.id ? 'text-blue-400 font-bold' : 'text-orange-400 font-bold';
                                    if (evt.description.includes('=== SET')) {
                                        bgClass = evt.teamScoredId === teamA.id ? 'bg-blue-900/40' : 'bg-orange-900/40';
                                    } else {
                                        bgClass = evt.teamScoredId === teamA.id ? 'bg-blue-900/10' : 'bg-orange-900/10';
                                    }
                                } else if (evt.type === 'ERROR') {
                                    colorClass = "text-red-400 font-bold";
                                } else if (evt.type === 'BLOCK' || evt.type === 'ATTACK') {
                                    colorClass = "text-white font-semibold";
                                }

                                return (
                                    <div key={evt.id} className={`p-3 rounded-lg border-l-2 ${evt.type === 'POINT' ? (evt.teamScoredId === teamA.id ? 'border-blue-500' : 'border-orange-500') : 'border-slate-700'} ${bgClass}`}>
                                        <span className="inline-block w-20 text-[10px] font-black text-slate-600 uppercase">
                                            {evt.description.includes('ACE') ? '⚡ ACE' : evt.type}
                                        </span>
                                        <span className={colorClass}>
                                            {evt.description}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-8 pb-10">
                            {[teamA, teamB].map(team => (
                                <div key={team.id}>
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${team.id === teamA.id ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                        {team.name} Statistics
                                    </h3>
                                    <table className="w-full text-left text-[11px] font-bold">
                                        <thead className="text-slate-600 uppercase tracking-tighter border-b border-slate-800">
                                            <tr>
                                                <th className="pb-2">Player</th>
                                                <th className="pb-2 text-center">K</th>
                                                <th className="pb-2 text-center">E</th>
                                                <th className="pb-2 text-center">B</th>
                                                <th className="pb-2 text-center text-purple-400">AST</th>
                                                <th className="pb-2 text-center text-yellow-500">ACE</th>
                                                <th className="pb-2 text-center">D</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {team.players
                                                .filter(p => matchState.playerStats[p.id])
                                                .sort((a, b) => (matchState.playerStats[b.id]?.performanceScore || 0) - (matchState.playerStats[a.id]?.performanceScore || 0))
                                                .map(p => {
                                                    const s = matchState.playerStats[p.id];
                                                    return (
                                                        <tr key={p.id} className="text-slate-400 hover:bg-white/5 transition-colors">
                                                            <td className="py-2.5 text-white flex items-center gap-2">
                                                                <span className="text-[9px] text-slate-500 w-4">{p.position}</span>
                                                                {p.lastName}
                                                            </td>
                                                            <td className="py-2.5 text-center text-emerald-400 font-bold tabular-nums">{s.kills}</td>
                                                            <td className="py-2.5 text-center text-red-500 tabular-nums">{s.errors}</td>
                                                            <td className="py-2.5 text-center text-blue-400 tabular-nums">{s.blocks}</td>
                                                            <td className="py-2.5 text-center text-purple-400 font-bold tabular-nums">{s.assists}</td>
                                                            <td className="py-2.5 text-center text-yellow-500 tabular-nums">{s.aces}</td>
                                                            <td className="py-2.5 text-center text-slate-400 tabular-nums">{s.digs}</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Post Match Awards Overlay */}
            {matchState.gameOver && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-in fade-in duration-700">
                    <div className="max-w-4xl w-full space-y-10 text-center">
                        <div className="space-y-2 animate-in slide-in-from-top-12 duration-1000">
                            <Trophy className="w-16 h-16 text-yellow-500 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Match Concluded</h2>
                            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">Final Awards & Recognition</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* MVP - Main Celeb */}
                            <div className="bg-gradient-to-br from-yellow-500/20 via-slate-900 to-slate-900 border border-yellow-500/30 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group animate-in slide-in-from-left-12 duration-1000 delay-300">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-yellow-900/40">
                                        <Trophy className="w-3 h-3" /> Match MVP
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-2 leading-none uppercase">{getPlayerFull(matchState.matchMVP!)}</h3>
                                    <div className="text-yellow-500/80 font-bold text-sm mb-6 uppercase tracking-tight">Winning Team Masterclass</div>
                                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                                        <div>
                                            <div className="text-2xl font-black text-white">{matchState.playerStats[matchState.matchMVP!]?.kills}</div>
                                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Kills</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white">{matchState.playerStats[matchState.matchMVP!]?.blocks}</div>
                                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Blocks</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white">{matchState.playerStats[matchState.matchMVP!]?.performanceScore.toFixed(0)}</div>
                                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Val</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 animate-in slide-in-from-right-12 duration-1000 delay-500">
                                {/* SVP */}
                                {matchState.matchSVP && (
                                    <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-8 text-left hover:bg-slate-800/80 transition-all flex items-center gap-6">
                                        <div className="p-4 bg-slate-800 rounded-2xl border border-white/5">
                                            <Award className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Star Valued Player</div>
                                            <div className="text-xl font-black text-white uppercase">{getPlayerFull(matchState.matchSVP)}</div>
                                            <div className="text-xs text-blue-400/80 font-bold uppercase tracking-tight">Losing Team Standout</div>
                                        </div>
                                    </div>
                                )}

                                {/* Honorable Mentions */}
                                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 text-left">
                                    <div className="flex items-center gap-2 mb-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                        <Medal className="w-4 h-4 text-orange-400" /> Honorable Mentions
                                    </div>
                                    <div className="grid gap-3">
                                        {matchState.honorableMentions?.map(id => (
                                            <div key={id} className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                                {getPlayerFull(id)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onExit(matchState)}
                            className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-900/40 text-sm animate-in fade-in zoom-in duration-1000 delay-700"
                        >
                            Finish Match & Continue
                        </button>
                    </div>
                </div>
            )}
            {/* Lineup Change Modal */}
            {showLineupModal && myTeam && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-slate-800 rounded-2xl border border-slate-600 p-8 max-w-lg w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-white mb-2 flex items-center">
                            <RefreshCw className="w-6 h-6 mr-2 text-blue-400" /> Set Break — Change Lineup
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">Adjust your starting lineup for the next set.</p>

                        <LineupEditor team={myTeam as Team} onConfirm={(newStarters) => {
                            if (onLineupChange) onLineupChange(newStarters);
                            handleLineupConfirm();
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Lineup Editor Sub-Component
interface LineupEditorProps {
    team: Team;
    onConfirm: (starters: Team['starters']) => void;
}

const LineupEditor: React.FC<LineupEditorProps> = ({ team, onConfirm }) => {
    const [starters, setStarters] = useState({ ...team.starters });

    const roles: (keyof Team['starters'])[] = ['S', 'OH1', 'OH2', 'OPP', 'MB1', 'MB2', 'L'];
    const roleLabels: Record<string, string> = { S: 'Setter', OH1: 'Outside 1', OH2: 'Outside 2', OPP: 'Opposite', MB1: 'Middle 1', MB2: 'Middle 2', L: 'Libero' };

    const getEligiblePlayers = (role: keyof Team['starters']): Player[] => {
        const posMap: Record<string, string> = { S: 'S', OH1: 'OH', OH2: 'OH', OPP: 'OPP', MB1: 'MB', MB2: 'MB', L: 'L' };
        return team.players.filter(p => p.position === posMap[role]);
    };

    return (
        <div className="space-y-3">
            {roles.map(role => {

                const eligible = getEligiblePlayers(role);

                return (
                    <div key={role} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-bold text-slate-400 uppercase">{roleLabels[role]}</span>
                        <select
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-semibold"
                            value={starters[role]}
                            onChange={e => setStarters({ ...starters, [role]: e.target.value })}
                        >
                            {eligible.map(p => (
                                <option key={p.id} value={p.id}>
                                    #{p.jerseyNumber} {p.firstName} {p.lastName} (OVR: {p.overall})
                                </option>
                            ))}
                        </select>
                    </div>
                );
            })}

            <button
                onClick={() => onConfirm(starters)}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
            >
                Confirm Lineup & Continue
            </button>
        </div>
    );
};
