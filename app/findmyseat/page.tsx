'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { ROOM_ALLOCATIONS } from '@/lib/roomData';

export default function FindMySeat() {
    const [teamId, setTeamId] = useState('');
    const [result, setResult] = useState<{ found: boolean; room?: string; query?: string } | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const numericPart = teamId.trim();
        if (!numericPart) return;
        
        const query = `TRI${numericPart}`.toUpperCase();

        const room = ROOM_ALLOCATIONS[query];
        
        if (room) {
            setResult({ found: true, room, query });
        } else {
            setResult({ found: false, query });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-100 text-teal-600 mb-6 shadow-sm border border-teal-200">
                    <MapPin size={32} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                    Find My Seat
                </h1>
                <p className="mt-3 text-slate-500 font-medium max-w-md mx-auto">
                    Enter the last 5 digits of your Team ID to instantly discover your allocated hackathon space.
                </p>
            </div>

            {/* Search Box */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl p-2 shadow-xl border border-slate-200/60 flex items-center"
            >
                <form onSubmit={handleSearch} className="flex w-full items-center">
                    <div className="pl-4 pr-1 text-slate-400">
                        <Search size={20} />
                    </div>
                    <div className="flex items-center bg-transparent py-4 text-slate-900 font-bold uppercase tracking-wider text-lg">
                        <span className="text-teal-700 select-none mr-1">TRI</span>
                        <input
                            type="text"
                            maxLength={5}
                            placeholder="26012"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-transparent placeholder:text-slate-300 focus:outline-none"
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex-1"></div>
                    <button
                        type="submit"
                        disabled={!teamId.trim()}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase tracking-widest text-xs px-6 py-4 rounded-2xl transition-all active:scale-95"
                    >
                        Search
                    </button>
                </form>
            </motion.div>

            {/* Result Area */}
            <div className="w-full max-w-md mt-6 h-40">
                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            key={result.query}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`w-full overflow-hidden rounded-3xl border shadow-lg ${
                                result.found ? 'bg-teal-600 border-teal-500 text-white' : 'bg-red-50 border-red-200 text-red-900'
                            }`}
                        >
                            {result.found ? (
                                <div className="p-8 text-center relative">
                                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#grid)" />
                                        </svg>
                                    </div>
                                    <p className="text-teal-100 font-bold uppercase tracking-widest text-xs mb-2">Team {result.query}</p>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">{result.room}</h2>
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <AlertCircle size={32} className="text-red-400 mb-3" />
                                    <h2 className="text-lg font-bold">Team Not Found</h2>
                                    <p className="text-red-700/80 text-sm mt-1 font-medium">Please check your Team ID and try again.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
