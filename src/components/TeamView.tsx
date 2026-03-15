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
    season?: any;
}

export const TeamView: React.FC<TeamViewProps> = ({ team, onBack, onUpdatePlayer, onTransferPlayer, allTeams, freeAgents = [], isMyTeam = false, season }) => {
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
        <div className="max-w-6xl mx-auto p-6">
            <button onClick={onBack} className="flex items-center text-blue-400 hover:text-blue-300 mb-6 font-semibold">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to League
            </button>

            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-black text-white">{team.location} {team.name}</h1>
                    <div className="flex gap-4">
                        <p className="text-slate-400">Roster Size: {team.players.length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-700 pb-2">
                    <button onClick={() => setActiveTab('ROSTER')} className={`px-4 py-2 font-bold rounded-t-lg transition-colors ${activeTab === 'ROSTER' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Roster</button>
                    {isMyTeam && <button onClick={() => setActiveTab('TACTICS')} className={`px-4 py-2 font-bold rounded-t-lg transition-colors ${activeTab === 'TACTICS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Tactics</button>}
                    {isMyTeam && <button onClick={() => setActiveTab('FREE_AGENCY')} className={`px-4 py-2 font-bold rounded-t-lg transition-colors ${activeTab === 'FREE_AGENCY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Free Agency</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {activeTab === 'ROSTER' && (
                        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
                            <div className="p-4 bg-slate-800/80 border-b border-slate-700">
                                <h2 className="text-xl font-bold">Current Roster</h2>
                            </div>
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Pos</th>
                                        <th className="px-6 py-3">Player</th>
                                        <th className="px-6 py-3 text-center text-emerald-400">OVR</th>
                                        <th className="px-6 py-3 text-center">Age</th>
                                        <th className="px-6 py-3">Spk</th>
                                        <th className="px-6 py-3">Blk</th>
                                        <th className="px-6 py-3">Rcv</th>
                                        {isMyTeam && <th className="px-6 py-3 text-right">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {team.players.map(player => (
                                        <tr key={player.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-blue-400">{player.position}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedPlayerId(player.id)}
                                                    className="font-bold text-white hover:text-blue-400 transition-colors"
                                                >
                                                    {player.firstName} {player.lastName}
                                                </button>
                                                {(player.traits || []).length > 0 && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded border border-blue-500/30">
                                                        {player.traits[0]}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-lg text-emerald-400">{player.overall}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${player.age < 22 ? 'text-yellow-400 bg-yellow-900/20' :
                                                    player.age <= 28 ? 'text-emerald-400 bg-emerald-900/20' :
                                                        player.age <= 31 ? 'text-yellow-400 bg-yellow-900/20' :
                                                            'text-red-400 bg-red-900/20'
                                                    }`}>{player.age ?? '?'}</span>
                                            </td>
                                            <td className="px-6 py-4">{player.stats.spiking}</td>
                                            <td className="px-6 py-4">{player.stats.blocking}</td>
                                            <td className="px-6 py-4">{player.stats.receive}</td>
                                            {isMyTeam && (
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setEditingPlayer(player)} className="text-blue-400 hover:text-white text-xs font-semibold px-3 py-1 bg-blue-900/30 rounded-full border border-blue-800/50 hover:bg-blue-600 transition-colors mr-2">Edit</button>
                                                    <button onClick={() => onTransferPlayer('RELEASE', player)} className="text-red-400 hover:text-white text-xs font-semibold px-3 py-1 bg-red-900/30 rounded-full border border-red-800/50 hover:bg-red-600 transition-colors">Release</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {(editingPlayer.position === 'S' || editingPlayer.position === 'OH' || editingPlayer.position === 'OPP' || editingPlayer.position === 'MB') && (
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-400 font-bold text-[10px] uppercase">Style</label>
                                        <select
                                            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-white text-[10px] font-bold w-36"
                                            value={editingPlayer.position === 'S' ? (editingPlayer.personality?.setterStyle || 'BALANCED') : (editingPlayer.personality?.hitterStyle || 'POWER')}
                                            onChange={e => {
                                                const key = editingPlayer.position === 'S' ? 'setterStyle' : 'hitterStyle';
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

                        {/* Special Traits Editing */}
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
