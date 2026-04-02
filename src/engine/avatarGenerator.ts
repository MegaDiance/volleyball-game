/**
 * Deterministic player avatar generator.
 * Given a player ID string, generates a consistent FaceConfig using a seeded hash.
 */

export interface FaceConfig {
    skinTone: number;      // 1-8
    faceShape: 'oval' | 'round' | 'square' | 'sharp';
    hairStyle: number;     // 0-8 (0 = bald)
    hairColor: number;     // 0-5
    eyeShape: number;      // 0-4
    eyebrows: number;      // 0-3
    mouthStyle: number;    // 0-3
    accessory: 'none' | 'headband' | 'glasses' | 'earring';
}

function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash |= 0; // 32-bit int
    }
    return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s ^= s << 13;
        s ^= s >> 7;
        s ^= s << 17;
        return Math.abs(s) / 2147483647;
    };
}

export function generateFace(playerId: string): FaceConfig {
    const hash = hashString(playerId);
    const rand = seededRandom(hash);

    const faceShapes: FaceConfig['faceShape'][] = ['oval', 'round', 'square', 'sharp'];
    const accessories: FaceConfig['accessory'][] = ['none', 'none', 'none', 'headband', 'glasses', 'earring'];

    return {
        skinTone: Math.floor(rand() * 8) + 1,
        faceShape: faceShapes[Math.floor(rand() * faceShapes.length)],
        hairStyle: Math.floor(rand() * 9),
        hairColor: Math.floor(rand() * 6),
        eyeShape: Math.floor(rand() * 5),
        eyebrows: Math.floor(rand() * 4),
        mouthStyle: Math.floor(rand() * 4),
        accessory: accessories[Math.floor(rand() * accessories.length)],
    };
}

export function faceToCode(face: FaceConfig): string {
    return btoa(JSON.stringify(face));
}

export function codeToFace(code: string): FaceConfig | null {
    try {
        return JSON.parse(atob(code));
    } catch {
        return null;
    }
}
