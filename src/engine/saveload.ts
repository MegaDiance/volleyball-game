import type { SaveGame } from './models';

const SAVE_VERSION = 1;

export function exportSave(
    teams: any[],
    season: any,
    myTeamId: string,
    leagueName: string
): void {
    const save: SaveGame = {
        version: SAVE_VERSION,
        leagueName,
        myTeamId,
        teams,
        season,
        savedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(save, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const safeLeagueName = leagueName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeLeagueName}_${dateStr}.vgm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function parseSave(jsonString: string): SaveGame | null {
    try {
        const data = JSON.parse(jsonString) as SaveGame;
        if (!data.version || !data.teams || !data.season || !data.myTeamId) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export function readSaveFile(file: File): Promise<SaveGame | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(parseSave(text));
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}

// Phase 7: Local Storage Persistence
const STORAGE_KEY = 'volleyball_gm_saves';

export function saveToLocal(save: SaveGame): void {
    const saves = getLocalSaves();
    // Unique key: leagueName (or add a unique ID to SaveGame if needed)
    const existingIdx = saves.findIndex(s => s.leagueName === save.leagueName);
    if (existingIdx >= 0) {
        saves[existingIdx] = save;
    } else {
        saves.push(save);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function getLocalSaves(): SaveGame[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export function deleteLocalSave(leagueName: string): void {
    const saves = getLocalSaves();
    const filtered = saves.filter(s => s.leagueName !== leagueName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
