import React from 'react';
import type { FaceConfig } from '../engine/avatarGenerator';

interface PlayerAvatarProps {
    face: FaceConfig;
    size?: number;
    className?: string;
}

const SKIN_TONES = [
    '#FDDBB4', // 1
    '#F0C27F', // 2
    '#C68642', // 3
    '#8D5524', // 4
    '#6B3A2A', // 5
    '#4A2511', // 6
    '#FFD9CC', // 7 - pink fair
    '#FFECDB', // 8 - pale
];

const HAIR_COLORS = [
    '#2C1B0E', // black
    '#5C3A1E', // dark brown
    '#8B6914', // medium brown
    '#D4A017', // blonde
    '#E87B52', // auburn/red
    '#A9A9A9', // grey
];

const FACE_SHAPE_PATHS = {
    oval: 'M 50 15 C 80 15, 90 40, 90 60 C 90 82, 78 93, 50 95 C 22 93, 10 82, 10 60 C 10 40, 20 15, 50 15 Z',
    round: 'M 50 18 C 76 18, 88 36, 88 58 C 88 78, 77 90, 50 90 C 23 90, 12 78, 12 58 C 12 36, 24 18, 50 18 Z',
    square: 'M 15 20 L 85 20 C 88 20, 90 24, 90 30 L 90 75 C 90 84, 82 92, 50 92 C 18 92, 10 84, 10 75 L 10 30 C 10 24, 12 20, 15 20 Z',
    sharp: 'M 50 14 C 74 14, 88 32, 88 55 C 88 75, 74 90, 50 96 C 26 90, 12 75, 12 55 C 12 32, 26 14, 50 14 Z',
};

const EYE_SHAPES = [
    // Style 0: Simple circle
    (x: number, y: number) => (
        <g key={x}>
            <circle cx={x} cy={y} r={6} fill="white" />
            <circle cx={x} cy={y} r={3.5} fill="#1a1a1a" />
            <circle cx={x + 1.5} cy={y - 1.5} r={1} fill="white" />
        </g>
    ),
    // Style 1: Narrow/calm
    (x: number, y: number) => (
        <g key={x}>
            <ellipse cx={x} cy={y} rx={7} ry={4.5} fill="white" />
            <circle cx={x} cy={y} r={3} fill="#1a1a1a" />
            <circle cx={x + 1} cy={y - 1} r={0.8} fill="white" />
        </g>
    ),
    // Style 2: Wide/alert
    (x: number, y: number) => (
        <g key={x}>
            <ellipse cx={x} cy={y} rx={7.5} ry={6.5} fill="white" />
            <circle cx={x} cy={y} r={4} fill="#1a1a1a" />
            <circle cx={x + 1.5} cy={y - 1.5} r={1.2} fill="white" />
        </g>
    ),
    // Style 3: Hooded
    (x: number, y: number) => (
        <g key={x}>
            <ellipse cx={x} cy={y + 1} rx={6.5} ry={4} fill="white" />
            <circle cx={x} cy={y + 1} r={3} fill="#1a1a1a" />
            <circle cx={x + 1} cy={y} r={0.8} fill="white" />
        </g>
    ),
    // Style 4: Almond
    (x: number, y: number) => (
        <g key={x}>
            <path d={`M ${x - 7} ${y} Q ${x} ${y - 5}, ${x + 7} ${y} Q ${x} ${y + 5}, ${x - 7} ${y} Z`} fill="white" />
            <circle cx={x} cy={y} r={3} fill="#1a1a1a" />
            <circle cx={x + 1} cy={y - 1} r={0.8} fill="white" />
        </g>
    ),
];

const MOUTH_STYLES = [
    // 0: Neutral
    (x: number, y: number) => <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke="#333" strokeWidth={2} strokeLinecap="round" />,
    // 1: Slight smile
    (x: number, y: number) => <path d={`M ${x - 6} ${y} Q ${x} ${y + 4}, ${x + 6} ${y}`} fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />,
    // 2: Big smile
    (x: number, y: number) => <path d={`M ${x - 7} ${y - 1} Q ${x} ${y + 7}, ${x + 7} ${y - 1}`} fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />,
    // 3: Serious
    (x: number, y: number) => <path d={`M ${x - 6} ${y + 1} Q ${x} ${y - 2}, ${x + 6} ${y + 1}`} fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" />,
];

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ face, size = 80, className = '' }) => {
    const skinColor = SKIN_TONES[(face.skinTone - 1) % SKIN_TONES.length];
    const hairColor = HAIR_COLORS[face.hairColor % HAIR_COLORS.length];
    const facePath = FACE_SHAPE_PATHS[face.faceShape];
    const eyeStyle = EYE_SHAPES[face.eyeShape % EYE_SHAPES.length];
    const mouthStyle = MOUTH_STYLES[face.mouthStyle % MOUTH_STYLES.length];

    // Hair style (0 = bald)
    const hairStyle = face.hairStyle;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 10 100 90"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Face base */}
            <path d={facePath} fill={skinColor} />

            {/* Hair (back) - only if not bald */}
            {hairStyle > 0 && hairStyle <= 4 && (
                <path
                    d={hairStyle === 1 ? `M 14 52 C 10 30, 20 10, 50 10 C 80 10, 90 30, 86 52 L 86 34 C 86 16, 68 8, 50 8 C 32 8, 14 16, 14 34 Z`
                        : hairStyle === 2 ? `M 50 10 C 28 10, 12 24, 12 44 L 12 32 C 12 14, 30 5, 50 5 C 70 5, 88 14, 88 32 L 88 44 C 88 24, 72 10, 50 10 Z`
                            : hairStyle === 3 ? `M 50 10 C 72 10, 90 25, 90 50 L 82 44 C 82 26, 68 12, 50 12 C 32 12, 18 26, 18 44 L 10 50 C 10 25, 28 10, 50 10 Z`
                                : `M 14 50 C 14 26, 30 10, 50 10 C 70 10, 86 26, 86 50 C 86 35, 68 20, 50 20 C 32 20, 14 35, 14 50 Z`}
                    fill={hairColor}
                />
            )}
            {hairStyle >= 5 && (
                <path d={`M 50 10 C 30 10, 12 22, 12 40 L 88 40 C 88 22, 70 10, 50 10 Z`} fill={hairColor} />
            )}

            {/* Eyebrows */}
            {face.eyebrows === 0 && <>
                <path d={`M 26 40 Q 36 36, 42 40`} fill="none" stroke={hairColor} strokeWidth={2} strokeLinecap="round" />
                <path d={`M 58 40 Q 64 36, 74 40`} fill="none" stroke={hairColor} strokeWidth={2} strokeLinecap="round" />
            </>}
            {face.eyebrows === 1 && <>
                <path d={`M 25 39 Q 35 34, 43 38`} fill="none" stroke={hairColor} strokeWidth={2.5} strokeLinecap="round" />
                <path d={`M 57 38 Q 65 34, 75 39`} fill="none" stroke={hairColor} strokeWidth={2.5} strokeLinecap="round" />
            </>}
            {face.eyebrows === 2 && <>
                <line x1={26} y1={38} x2={42} y2={40} stroke={hairColor} strokeWidth={2} strokeLinecap="round" />
                <line x1={58} y1={40} x2={74} y2={38} stroke={hairColor} strokeWidth={2} strokeLinecap="round" />
            </>}
            {face.eyebrows === 3 && <>
                <path d={`M 24 41 Q 34 35, 44 40`} fill="none" stroke={hairColor} strokeWidth={3} strokeLinecap="round" />
                <path d={`M 56 40 Q 66 35, 76 41`} fill="none" stroke={hairColor} strokeWidth={3} strokeLinecap="round" />
            </>}

            {/* Eyes */}
            {eyeStyle(34, 52)}
            {eyeStyle(66, 52)}

            {/* Nose */}
            <path d={`M 50 58 C 47 62, 46 65, 47 67 C 48 68, 50 68, 53 67 C 54 65, 53 62, 50 58 Z`} fill="none" stroke={skinColor === '#FFECDB' ? '#ccc' : '#00000030'} strokeWidth={1.5} />

            {/* Mouth */}
            {mouthStyle(50, 76)}

            {/* Ear left */}
            <ellipse cx={10} cy={60} rx={4} ry={6} fill={skinColor} />
            {/* Ear right */}
            <ellipse cx={90} cy={60} rx={4} ry={6} fill={skinColor} />

            {/* Accessory: headband */}
            {face.accessory === 'headband' && (
                <g>
                    <rect x={10} y={30} width={80} height={10} rx={5} fill="#E53935" opacity={0.9} />
                    <rect x={10} y={32} width={80} height={6} rx={3} fill="#FF5252" opacity={0.5} />
                </g>
            )}
            {/* Accessory: glasses */}
            {face.accessory === 'glasses' && (
                <g fill="none" stroke="#333" strokeWidth={2}>
                    <rect x={22} y={46} width={24} height={14} rx={4} />
                    <rect x={54} y={46} width={24} height={14} rx={4} />
                    <line x1={46} y1={53} x2={54} y2={53} />
                    <line x1={10} y1={53} x2={22} y2={53} />
                    <line x1={78} y1={53} x2={90} y2={53} />
                </g>
            )}
            {/* Accessory: earring */}
            {face.accessory === 'earring' && (
                <circle cx={10} cy={68} r={3} fill="#FFD700" stroke="#DAA520" strokeWidth={1} />
            )}
        </svg>
    );
};
