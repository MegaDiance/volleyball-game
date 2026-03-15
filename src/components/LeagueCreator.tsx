import React, { useState, useRef, useEffect } from 'react';
import { generateTeam } from '../engine/generator';
import type { Team } from '../engine/models';
import { readSaveFile, getLocalSaves, deleteLocalSave } from '../engine/saveload';
import type { SaveGame } from '../engine/models';
import { Trophy, Upload, RefreshCw, Play, Shuffle, Trash2, Database, Users } from 'lucide-react';

interface LeagueCreatorProps {
    onStart: (teams: Team[], myTeamId: string, leagueName: string) => void;
    onImport: (save: SaveGame) => void;
}

const CITY_NAMES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Charlotte", "Seattle", "Denver", "Boston", "Portland", "Miami", "Atlanta", "Nashville", "Las Vegas"];
const TEAM_MASCOTS = ["Spikers", "Aces", "Blockers", "Volleys", "Eagles", "Tigers", "Sharks", "Falcons", "Knights", "Titans", "Kings", "Storm", "Waves", "Comets", "Panthers", "Cobras", "Vipers", "Dynamo", "Rush", "Thunder"];

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

interface TeamEntry {
    team: Team;
    name: string;
    location: string;
    isMyTeam: boolean;
}

const TEAM_COUNTS = [6, 8, 10, 12];

export const LeagueCreator: React.FC<LeagueCreatorProps> = ({ onStart, onImport }) => {
    const [leagueName, setLeagueName] = useState('My League');
    const [teamCount, setTeamCount] = useState(10);
    const [entries, setEntries] = useState<TeamEntry[]>(() => buildEntries(10));
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [localSaves, setLocalSaves] = useState<SaveGame[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalSaves(getLocalSaves());
    }, []);

    const refreshLocalSaves = () => {
        setLocalSaves(getLocalSaves());
    };

    const handleDeleteLocal = (name: string) => {
        if (confirm(`Are you sure you want to delete the save "${name}"?`)) {
            deleteLocalSave(name);
            refreshLocalSaves();
        }
    };

    function buildEntries(count: number, prev?: TeamEntry[]): TeamEntry[] {
        const result: TeamEntry[] = [];
        for (let i = 0; i < count; i++) {
            const existing = prev?.[i];
            const team = existing?.team || generateTeam();
            result.push({
                team,
                name: existing?.name || randomItem(TEAM_MASCOTS),
                location: existing?.location || randomItem(CITY_NAMES),
                isMyTeam: i === 0,
            });
        }
        return result;
    }

    const handleTeamCountChange = (count: number) => {
        setTeamCount(count);
        setEntries(buildEntries(count, entries));
    };

    const handleRegenTeam = (idx: number) => {
        const newTeam = generateTeam();
        setEntries(prev => prev.map((e, i) => i === idx ? { ...e, team: newTeam } : e));
    };

    const handleSetMyTeam = (idx: number) => {
        setEntries(prev => prev.map((e, i) => ({ ...e, isMyTeam: i === idx })));
    };

    const handleFieldUpdate = (idx: number, field: 'name' | 'location', val: string) => {
        setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
    };

    const handleStart = () => {
        const teams = entries.map(e => ({
            ...e.team,
            name: e.name,
            location: e.location,
        }));
        const myEntry = entries.find(e => e.isMyTeam);
        const myTeamId = myEntry ? myEntry.team.id : teams[0].id;
        onStart(teams, myTeamId, leagueName);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        setImportError(null);
        const save = await readSaveFile(file);
        setIsImporting(false);
        if (!save) {
            setImportError('Invalid save file. Please select a valid .vgm file.');
            return;
        }
        onImport(save);
    };




    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-6xl relative z-10">
                {/* Main Branding */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
                    <div className="text-left">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/40">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                                Volley<span className="text-blue-500">GM</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-lg font-bold tracking-tight max-w-md">
                            The world's most advanced volleyball management simulation. Lead your franchise to legendary status.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleStart}
                            className="px-8 py-4 bg-white text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Launch Dynasty
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Saved Progress - Sidebar style */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-slate-900/50 rounded-3xl border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Database className="w-4 h-4 text-emerald-400" /> Resume Progress
                                </h2>
                                <button onClick={refreshLocalSaves} className="text-slate-500 hover:text-white transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {localSaves.length === 0 ? (
                                    <div className="py-12 px-6 text-center text-slate-600">
                                        <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-wider">No active franchises found</p>
                                    </div>
                                ) : (
                                    localSaves.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(save => (
                                        <div
                                            key={save.leagueName}
                                            className="group relative flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
                                            onClick={() => onImport(save)}
                                        >
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-white text-lg">
                                                {save.leagueName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-black text-white truncate uppercase tracking-tight">{save.leagueName}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">WK{save.season?.week || '?'}</span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase">{save.teams.length} Teams</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLocal(save.leagueName); }}
                                                className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Backup Management</h2>
                            <input ref={fileInputRef} type="file" accept=".vgm,.json" className="hidden" onChange={handleImport} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Upload className="w-5 h-5 text-blue-400" />
                                {isImporting ? 'Syncing...' : 'Upload Cloud Save'}
                            </button>
                            {importError && (
                                <p className="text-red-400 text-[10px] mt-4 font-black uppercase tracking-wider text-center">{importError}</p>
                            )}
                        </section>
                    </div>

                    {/* Franchise Configuration */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-slate-900/80 rounded-[40px] border border-white/5 p-8 shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row gap-8 mb-10">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3 pl-1">Franchise Title</label>
                                    <input
                                        type="text"
                                        value={leagueName}
                                        onChange={e => setLeagueName(e.target.value)}
                                        maxLength={40}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xl font-black focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                                        placeholder="Enter Dynasty Name..."
                                    />
                                </div>
                                <div className="flex-none">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3 pl-1">League Size</label>
                                    <div className="flex gap-2">
                                        {TEAM_COUNTS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => handleTeamCountChange(c)}
                                                className={`px-6 py-4 rounded-2xl font-black text-sm transition-all border ${teamCount === c ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-900/40 scale-105' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <Users className="w-4 h-4 text-blue-400" /> Customise Roster Pool
                                    </h2>
                                    <button
                                        onClick={() => setEntries(buildEntries(teamCount))}
                                        className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <Shuffle className="w-3 h-3" /> Re-roll All
                                    </button>
                                </div>

                                <div className="max-h-[440px] overflow-y-auto px-4 py-4 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {entries.map((entry, idx) => (
                                            <div
                                                key={entry.team.id}
                                                className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${entry.isMyTeam ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex-none">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${entry.isMyTeam ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-blue-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                </div>

                                                {editingIdx === idx ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <input
                                                            autoFocus
                                                            value={entry.location}
                                                            onChange={e => handleFieldUpdate(idx, 'location', e.target.value)}
                                                            className="w-24 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-bold"
                                                        />
                                                        <input
                                                            value={entry.name}
                                                            onChange={e => handleFieldUpdate(idx, 'name', e.target.value)}
                                                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-bold"
                                                        />
                                                        <button onClick={() => setEditingIdx(null)} className="text-blue-400 font-black text-[10px] uppercase">OK</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 min-w-0" onClick={() => setEditingIdx(idx)}>
                                                        <div className="font-black text-white text-sm uppercase tracking-tight truncate">{entry.location} {entry.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase">Avg OVR {Math.round(entry.team.players.reduce((s, p) => s + p.overall, 0) / entry.team.players.length)}</div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    {!entry.isMyTeam && (
                                                        <button
                                                            onClick={() => handleSetMyTeam(idx)}
                                                            className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                                                            title="Take Control"
                                                        >
                                                            <Play className="w-4 h-4 fill-current" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRegenTeam(idx)}
                                                        className="p-2 text-slate-500 hover:text-orange-400 transition-colors"
                                                        title="Re-roll Roster"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
