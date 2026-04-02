import React from 'react';
import type { RandomEvent } from '../engine/models';
import { AlertCircle, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

interface EventAlertModalProps {
    event: RandomEvent;
    onClose: (choiceIndex?: number) => void;
}

export const EventAlertModal: React.FC<EventAlertModalProps> = ({ event, onClose }) => {
    const getIcon = () => {
        switch (event.type) {
            case 'INJURY': return <AlertCircle className="w-8 h-8 text-red-400" />;
            case 'HOLIDAY': return <Calendar className="w-8 h-8 text-blue-400" />;
            case 'DISPUTE': return <MessageSquare className="w-8 h-8 text-orange-400" />;
            case 'MORALE': return <TrendingUp className="w-8 h-8 text-emerald-400" />;
            default: return <AlertCircle className="w-8 h-8 text-blue-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 rounded-[32px] border border-white/5 shadow-3xl overflow-hidden relative">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/5 rounded-2xl">
                            {getIcon()}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Incoming Dispatch</p>
                            <h2 className="text-2xl font-black text-white uppercase italic">{event.title}</h2>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8">
                        <p className="text-slate-300 leading-relaxed font-medium">
                            {event.description}
                        </p>
                    </div>

                    {event.choices && event.choices.length > 0 ? (
                        <div className="space-y-3">
                            {event.choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onClose(idx)}
                                    className="w-full group p-4 bg-slate-800 hover:bg-blue-600 border border-white/5 hover:border-blue-400 rounded-2xl transition-all text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                                            {choice.text}
                                        </span>
                                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all">
                                            <div className="w-1.5 h-1.5 bg-white group-hover:bg-blue-600 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 group-hover:text-blue-100 mt-1 uppercase tracking-wider">
                                        {choice.impact}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => onClose()}
                            className="w-full py-4 bg-white text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-98 transition-all shadow-xl shadow-white/5"
                        >
                            Understood
                        </button>
                    )}
                </div>

                {/* Background Glow */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            </div>
        </div>
    );
};
