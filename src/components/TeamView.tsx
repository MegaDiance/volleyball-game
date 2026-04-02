import React, { useState } from 'react';
import type { Player, Team } from '../engine/models';
import { calculateOverall } from '../engine/generator';
import { ChevronLeft } from 'lucide-react';
import { PlayerProfileModal } from './PlayerProfileModal';

interface TeamViewProps {
    team: Team;
    onBack: () => void;
    onUpdatePlayer: (playerId: string, updatedPlayer: Player) => void;
    onTransferPlayer: (action: 'SIGN' | 'RELEASE', player: Player) => void;
    allTeams: Team[];
    freeAgents: Player[];
    isMyTeam?: boolean;
    isGodMode?: boolean;
    season?: any;
}

export const TeamView: React.FC<TeamViewProps> = ({ team, onBack, onUpdatePlayer, onTransferPlayer, allTeams, freeAgents = [], isMyTeam = false, isGodMode = false, season }) => {
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ROSTER' | 'TACTICS' | 'FREE_AGENCY'>('ROSTER');

    // We need season to pass to PlayerProfileModal, but TeamView doesn't have it.
    // However, PlayerProfileModal uses season for awards/history. 
    // For now we'll pass an empty season or update the props.
    // Actually, looking at SeasonView, it has season. 
    // Let's add season to TeamViewProps.

    const handleStatChange = (statName: keyof Player['stats'], val: string) => {
        if (!editingPlayer) return;
        const numVal = Math.max(1, Math.min(99, parseInt(val) || 1));
        const newStats = { ...editingPlayer.stats, [statName]: numVal };
        // Auto-recalculate overall whenever any stat changes
        setEditingPlayer({
            ...editingPlayer,
            stats: newStats,
            overall: calculateOverall(newStats, editingPlayer.position)
        });
    };

    const handleSave = () => {
        if (editingPlayer) {
            onUpdatePlayer(editingPlayer.id, editingPlayer);
            setEditingPlayer(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
            <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white mb-6 font-bold text-sm transition-colors group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to League
            </button>

            {/* Team Header */}
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl border border-white/5 p-8 mb-6 overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{team.location}</div>
                        <h1 className="text-4xl font-black text-white tracking-tight">{team.name}</h1>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="px-2 py-0.5 bg-slate-700/80 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">{team.players.length} Players</span>
                            {isGodMode && <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-yellow-500/20">⚡ God Mode</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {(['ROSTER', ...(isMyTeam ? ['TACTICS', 'FREE_AGENCY'] : [])]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-5 py-2.5 text-sm font-black rounded-xl border transition-all ${activeTab === tab ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/30' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {tab === 'FREE_AGENCY' ? 'Free Agency' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'ROSTER' && (
                        <div className="space-y-1.5">
                            <div className="grid items-center px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest"
                                style={{gridTemplateColumns: '2.5rem 1fr 3.5rem 2.5rem 2.5rem 2.5rem 5rem'}}>
                                <div></div>
                                <div>Player</div>
                                <div className="text-center">OVR</div>
                                <div className="text-center">Age</div>
                                <div className="text-center">Spk</div>
                                <div className="text-center">Blk</div>
                                {isMyTeam && <div className="text-center">Actions</div>}
                            </div>
                            {team.players.map(player => (
                                <div
                                    key={player.id}
                                    className={`grid items-center px-4 py-3 rounded-2xl border transition-all ${player.injury ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10' : 'bg-slate-800/40 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                                    style={{gridTemplateColumns: '2.5rem 1fr 3.5rem 2.5rem 2.5rem 2.5rem 5rem'}}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black border ${
                                        player.position === 'OH' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                        player.position === 'OPP' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                                        player.position === 'MB' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                        player.position === 'S' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                        'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                    }`}>
                                        {player.position}
                                    </div>
                                    <div className="min-w-0 px-3">
                                        <button
                                            onClick={() => setSelectedPlayerId(player.id)}
                                            className="font-bold text-white hover:text-blue-400 transition-colors text-sm leading-tight truncate block"
                                        >
                                            {player.firstName} {player.lastName}
                                        </button>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {player.injury && <span className="text-[9px] font-black text-red-400">🏥 {player.injury.weeksLeft}w out</span>}
                                            {(player.traits || []).slice(0,1).map(t => (
                                                <span key={t} className="text-[9px] font-black text-blue-400/70">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`text-center font-black text-base ${player.overall >= 85 ? 'text-yellow-400' : player.overall >= 70 ? 'text-emerald-400' : 'text-slate-300'}`}>{player.overall}</div>
                                    <div className={`text-center text-sm font-bold ${player.age <= 21 ? 'text-yellow-400' : player.age <= 28 ? 'text-slate-300' : player.age <= 31 ? 'text-orange-400' : 'text-red-400'}`}>{player.age}</div>
                                    <div className="text-center text-slate-400 text-sm">{player.stats.spiking}</div>
                                    <div className="text-center text-slate-400 text-sm">{player.stats.blocking}</div>
                                    {isMyTeam && (
                                        <div className="flex gap-1 justify-end">
                                            {isGodMode
                                                ? <button onClick={() => setEditingPlayer(player)} className="px-2 py-1 text-[9px] font-black text-yellow-400 bg-yellow-500/10 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-all">⚡</button>
                                                : <span className="px-2 py-1 text-[9px] text-slate-700 bg-white/5 rounded-lg border border-white/5 cursor-not-allowed">🔒</span>
                                            }
                                            <button onClick={() => onTransferPlayer('RELEASE', player)} className="px-2 py-1 text-[9px] font-black text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all">Cut</button>
                                        </div>
                                    )}
                                    {!isMyTeam && <div />}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'TACTICS' && isMyTeam && (
                        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-8 space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Serve Strategy</h3>
                                <p className="text-slate-400 mb-4">Dictates how aggressively your players serve. Higher risk leads to more aces but more service errors.</p>
                                <div className="flex gap-4">
                                    {['SAFE', 'NORMAL', 'AGGRESSIVE'].map(risk => (
                                        <button
                                            key={risk}
                                            onClick={() => onUpdatePlayer('TACTICS_UPDATE', { ...team.tactics, serveRisk: risk } as any)}
                                            className={`flex-1 py-4 font-bold rounded-lg border-2 transition-all ${team.tactics.serveRisk === risk ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:text-white'}`}>
                                            {risk}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Offensive Tempo</h3>
                                <p className="text-slate-400 mb-4">Fast tempos require excellent passing and setting but are harder to block. Normal/High relies purely on hitter power.</p>
                                <div className="flex gap-4">
                                    {['NORMAL', 'HIGH', 'FAST'].map(tempo => (
                                        <button
                                            key={tempo}
                                            onClick={() => onUpdatePlayer('TACTICS_UPDATE', { ...team.tactics, tempo: tempo } as any)}
                                            className={`flex-1 py-4 font-bold rounded-lg border-2 transition-all ${team.tactics.tempo === tempo ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500 hover:text-white'}`}>
                                            {tempo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-700 text-slate-500 italic text-sm">Tactics are automatically saved.</div>
                        </div>
                    )}

                    {activeTab === 'FREE_AGENCY' && isMyTeam && (
                        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
                            <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                                <h2 className="text-xl font-bold">Free Agent Pool</h2>
                            </div>
                            {freeAgents.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic">No free agents available.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900/50 text-slate-400 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Pos</th>
                                            <th className="px-6 py-3">Player</th>
                                            <th className="px-6 py-3 text-center text-emerald-400">OVR</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {freeAgents.sort((a, b) => b.overall - a.overall).map(player => (
                                            <tr key={player.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-blue-400">{player.position}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedPlayerId(player.id)}
                                                        className="font-bold text-white hover:text-blue-400 transition-colors"
                                                    >
                                                        {player.firstName} {player.lastName}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-lg text-emerald-400">{player.overall}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => onTransferPlayer('SIGN', player)} className="text-emerald-400 hover:text-white text-xs font-semibold px-4 py-2 bg-emerald-900/30 rounded-lg border border-emerald-800/50 hover:bg-emerald-600 transition-colors">Sign Player</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Roster Breakdown */}
                    <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Roster Breakdown</div>
                        {(['S','OH','OPP','MB','L'] as const).map(pos => {
                            const count = team.players.filter(p => p.position === pos).length;
                            const avgOvr = count > 0 ? Math.round(team.players.filter(p => p.position === pos).reduce((s,p) => s + p.overall, 0) / count) : 0;
                            return count > 0 ? (
                                <div key={pos} className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black border flex-shrink-0 ${
                                        pos === 'OH' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                        pos === 'OPP' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                                        pos === 'MB' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                        pos === 'S' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                        'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                    }`}>{pos}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-300 font-bold">{count} player{count > 1 ? 's' : ''}</span>
                                            <span className={`font-black ${avgOvr >= 80 ? 'text-yellow-400' : avgOvr >= 70 ? 'text-emerald-400' : 'text-slate-400'}`}>{avgOvr} avg</span>
                                        </div>
                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${
                                                pos === 'OH' ? 'bg-blue-500' :
                                                pos === 'OPP' ? 'bg-purple-500' :
                                                pos === 'MB' ? 'bg-emerald-500' :
                                                pos === 'S' ? 'bg-yellow-500' : 'bg-orange-500'
                                            }`} style={{width: `${avgOvr}%`}} />
                                        </div>
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>

                    {/* Age Profile */}
                    <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Age Profile</div>
                        {[
                            { label: 'Prospects', emoji: '🌱', range: [17,21], color: 'text-yellow-400' },
                            { label: 'Prime', emoji: '⚡', range: [22,28], color: 'text-emerald-400' },
                            { label: 'Veteran', emoji: '🎖️', range: [29,32], color: 'text-orange-400' },
                            { label: 'Aging', emoji: '⏳', range: [33,99], color: 'text-red-400' },
                        ].map(({ label, emoji, range, color }) => {
                            const count = team.players.filter(p => p.age >= range[0] && p.age <= range[1]).length;
                            return count > 0 ? (
                                <div key={label} className="flex items-center justify-between mb-2">
                                    <span className="text-slate-400 text-sm">{emoji} {label}</span>
                                    <span className={`font-black text-sm ${color}`}>{count}</span>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>

            {/* Editing Modal */}
            {editingPlayer && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto pt-20 pb-10">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-700">
                        <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
                            <div>
                                <h2 className="text-xl font-black text-white leading-none mb-1">{editingPlayer.firstName} {editingPlayer.lastName}</h2>
                                <p className="text-blue-400 font-bold text-xs uppercase tracking-wider">{editingPlayer.position} • OVR {editingPlayer.overall}</p>
                            </div>
                            <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(editingPlayer.stats).map(([statName, statValue]) => (
                                <div key={statName} className="flex items-center justify-between">
                                    <label className="text-slate-400 capitalize text-xs font-bold">{statName}</label>
                                    <input
                                        type="number"
                                        min="1" max="99"
                                        value={statValue}
                                        onChange={(e) => handleStatChange(statName as keyof Player['stats'], e.target.value)}
                                        className="w-12 bg-slate-900 border border-slate-700 rounded-md px-1 py-1 text-white font-bold text-xs text-center focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Personality Editing */}
                        <div className="mt-4 pt-3 border-t border-slate-700">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Personality</h3>
                            <div className="space-y-2">
                                {(editingPlayer.position === 'S' || editingPlayer.position === 'OH' || editingPlayer.position === 'OPP' || editingPlayer.position === 'MB' || editingPlayer.position === 'L') && (
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-400 font-bold text-[10px] uppercase">Style</label>
                                        <select
                                            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-white text-[10px] font-bold w-36"
                                            value={
                                                editingPlayer.position === 'S' ? (editingPlayer.personality?.setterStyle || 'BALANCED') :
                                                (editingPlayer.position === 'MB' || editingPlayer.position === 'L') ? (editingPlayer.personality?.blockerStyle || 'READ') :
                                                (editingPlayer.personality?.hitterStyle || 'POWER')
                                            }
                                            onChange={e => {
                                                const key = editingPlayer.position === 'S' ? 'setterStyle' :
                                                    (editingPlayer.position === 'MB' || editingPlayer.position === 'L') ? 'blockerStyle' : 'hitterStyle';
                                                setEditingPlayer({
                                                    ...editingPlayer,
                                                    personality: { ...editingPlayer.personality, [key]: e.target.value }
                                                })
                                            }}
                                        >
                                            {editingPlayer.position === 'S' ? (
                                                <>
                                                    <option value="BALANCED">Balanced</option>
                                                    <option value="QUICK_MIDDLE">Quick Middle</option>
                                                    <option value="HIGH_OUTSIDE">High Outside</option>
                                                    <option value="DUMP_HAPPY">Dump Happy</option>
                                                </>
                                            ) : (editingPlayer.position === 'MB' || editingPlayer.position === 'L') ? (
                                                <>
                                                    <option value="READ">Read (Reactive)</option>
                                                    <option value="COMMIT">Commit (Aggressive)</option>
                                                    <option value="SWING">Swing (Balanced)</option>
                                                    <option value="GUESS">Guess (Coin Flip)</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="POWER">Power</option>
                                                    <option value="LINE">Line Shot</option>
                                                    <option value="CROSS">Cross Court</option>
                                                    <option value="TIP">Tip</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <label className="text-slate-400 font-bold text-[10px] uppercase">Tendency</label>
                                    <input
                                        type="number" min="10" max="100"
                                        value={editingPlayer.personality?.tendencyStrength || 60}
                                        onChange={e => setEditingPlayer({
                                            ...editingPlayer,
                                            personality: { ...editingPlayer.personality, tendencyStrength: Math.max(10, Math.min(100, parseInt(e.target.value) || 60)) }
                                        })}
                                        className="w-12 bg-slate-900 border border-slate-700 rounded-md px-1 py-1 text-white font-bold text-xs text-center focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-700">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                                <span>Special Archetype</span>
                                <span className="text-blue-400">Max 1</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-40 pr-1">
                                {[
                                    { n: 'Ace Server', d: 'Huge boost to Ace chance' },
                                    { n: 'Wall Blocker', d: 'Bonus to Kill Blocks' },
                                    { n: 'Wall Stopper', d: 'Bonus to Soft Blocks' },
                                    { n: 'Floor General', d: 'Increased momentum gains' },
                                    { n: 'Scrappy', d: 'Defensive + receiving boost' },
                                    { n: 'Quick Snap', d: 'Attack speed bonus' },
                                    { n: 'Glass Cannon', d: 'High power, high error risk' },
                                    { n: 'Clutch Player', d: 'Boost in close sets' },
                                    { n: 'Fraud', d: 'Penalty in close sets' },
                                    { n: 'Ironman', d: 'Fatigue drains 50% slower' },
                                    { n: 'Injury Prone', d: '2x higher injury risk' }
                                ].map(traitObj => {
                                    const trait = traitObj.n;
                                    const desc = traitObj.d;
                                    const isSelected = (editingPlayer.traits || []).includes(trait as any);
                                    return (
                                        <button
                                            key={trait}
                                            onClick={() => {
                                                const currentTraits = editingPlayer.traits || [];
                                                const has = currentTraits.includes(trait as any);
                                                // Enforce 1 trait max
                                                const next = has ? [] : [trait as any];
                                                setEditingPlayer({ ...editingPlayer, traits: next as any });
                                            }}
                                            className={`p-1.5 rounded-lg text-left border transition-all ${isSelected
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            <div className="text-[9px] font-black uppercase leading-tight">{trait}</div>
                                            <div className={`text-[8px] leading-tight ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Face Code Editing (God Mode Only) */}
                        {isGodMode && (
                            <div className="mt-4 pt-3 border-t border-slate-700">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Face Code</span>
                                    <span className="text-yellow-400">God Mode</span>
                                </h3>
                                <input
                                    type="text"
                                    value={editingPlayer.faceCode || ''}
                                    placeholder="Paste face code here"
                                    onChange={e => setEditingPlayer({ ...editingPlayer, faceCode: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono text-[10px] focus:border-yellow-500 focus:outline-none transition-colors"
                                />
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setEditingPlayer(null)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSave} className="flex-[2] items-center justify-center flex px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Player Profile Modal */}
            {selectedPlayerId && (
                <PlayerProfileModal
                    player={[...team.players, ...freeAgents, ...allTeams.flatMap(t => t.players)].find(p => p.id === selectedPlayerId)!}
                    team={allTeams.find(t => t.players.some(p => p.id === selectedPlayerId))}
                    season={season}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};
