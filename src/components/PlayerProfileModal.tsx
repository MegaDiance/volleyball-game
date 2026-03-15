import React from 'react';
import { X, Trophy, Activity, Shield } from 'lucide-react';
import type { Player, Team } from '../engine/models';
import type { Season } from '../engine/season';
interface PlayerProfileModalProps {
    player: Player;
    team?: Team;
    season: Season;
    onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, team, season, onClose }) => {
    const stats = season.cumulativeStats?.[player.id];

    // Calculate averages
    const games = stats?.gamesPlayed || 0;
    const avgKills = games > 0 ? (stats!.kills / games).toFixed(1) : '0.0';
    const avgBlocks = games > 0 ? (stats!.blocks / games).toFixed(1) : '0.0';
    const avgDigs = games > 0 ? (stats!.digs / games).toFixed(1) : '0.0';
    const avgAces = games > 0 ? (stats!.aces / games).toFixed(1) : '0.0';
    const hittingEff = stats && stats.attempts > 0
        ? ((stats.kills - stats.errors) / stats.attempts).toFixed(3)
        : '.000';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header/Banner */}
                <div className="h-32 bg-gradient-to-r from-blue-600/20 to-indigo-900/40 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute -bottom-12 left-10 flex items-end gap-6">
                        <div className="w-24 h-24 bg-slate-800 rounded-3xl border-4 border-slate-900 flex items-center justify-center shadow-xl">
                            <span className="text-4xl font-black text-white">{player.firstName[0]}{player.lastName[0]}</span>
                        </div>
                        <div className="pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black uppercase rounded">{player.position}</span>
                                <span className="text-slate-400 font-bold text-sm">#{player.jerseyNumber}</span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{player.firstName} {player.lastName}</h2>
                            <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">{team?.name || 'Free Agent'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 pt-20">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall</div>
                            <div className="text-2xl font-black text-white">{player.overall}</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Age</div>
                            <div className="text-2xl font-black text-white">{player.age}</div>
                        </div>
                        <div className={`rounded-2xl p-4 border ${player.injury ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{player.injury ? 'Injury Status' : 'Health'}</div>
                            <div className={`text-xl font-black ${player.injury ? 'text-red-400' : 'text-emerald-400'}`}>
                                {player.injury ? `${player.injury.type} (${player.injury.weeksLeft}w)` : 'Healthy'}
                            </div>
                        </div>
                    </div>

                    {/* Traits */}
                    {(player.traits || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-10">
                            {(player.traits || []).map(trait => {
                                const traitColors: Record<string, string> = {
                                    'Ace Server': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                    'Clutch Player': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                    'Wall Blocker': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                    'Wall Stopper': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
                                    'Ironman': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                    'Fraud': 'bg-red-500/20 text-red-400 border-red-500/30',
                                    'Injury Prone': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                    'Floor General': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                                    'Quick Snap': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
                                    'Scrappy': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                                    'Glass Cannon': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                                };
                                return (
                                    <span key={trait} className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${traitColors[trait] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {trait}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="space-y-8">
                        {/* Current Season Stats */}
                        <section>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Season Stats (Averages)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatBox label="Kills" value={avgKills} />
                                <StatBox label="Blocks" value={avgBlocks} />
                                <StatBox label="Digs" value={avgDigs} />
                                <StatBox label="Aces" value={avgAces} />
                            </div>
                            <div className="mt-4 flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hitting %</span>
                                <span className={`font-black ${parseFloat(hittingEff) > 0.3 ? 'text-emerald-400' : 'text-white'}`}>{hittingEff}</span>
                            </div>
                        </section>

                        {/* Ratings */}
                        <section>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Skill Ratings
                            </h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                                <RatingBar label="Spiking" value={player.stats.spiking} />
                                <RatingBar label="Blocking" value={player.stats.blocking} />
                                <RatingBar label="Serve" value={player.stats.serve} />
                                <RatingBar label="Digging" value={player.stats.digging} />
                                <RatingBar label="Setting" value={player.stats.setting} />
                                <RatingBar label="Athleticism" value={player.stats.athleticism} />
                            </div>
                        </section>

                        {/* Career Trophies */}
                        {player.careerStats && (
                            <section className="bg-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
                                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Trophy className="w-4 h-4" /> Career Accomplishments
                                </h3>
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-white">{player.careerStats.mvps}</div>
                                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">MVPs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-white">{player.careerStats.championships}</div>
                                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Titles</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-white">{player.careerStats.totalKills}</div>
                                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Tot Kills</div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 text-center">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-xl font-black text-white">{value}</div>
    </div>
);

const RatingBar = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-black text-white">{value}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
    </div>
);
