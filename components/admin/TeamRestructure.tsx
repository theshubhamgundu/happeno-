import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRightLeft, SplitSquareHorizontal, Search, CheckCircle, UserCircle, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHackathon } from "@/context/HackathonContext";

export function TeamRestructure() {
    const { projects, refreshTeams } = useHackathon();
    const [action, setAction] = useState<'SYNC' | 'SPLIT'>('SYNC');
    const [sourceTeamId, setSourceTeamId] = useState('');
    const [targetTeamId, setTargetTeamId] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    
    // Member state
    const [fetchedSource, setFetchedSource] = useState<any>(null);
    const [fetchedTarget, setFetchedTarget] = useState<any>(null);
    const [sourceEmails, setSourceEmails] = useState<string[]>([]);
    const [targetEmails, setTargetEmails] = useState<string[]>([]);
    const [allMembersMap, setAllMembersMap] = useState<Map<string, any>>(new Map());
    
    const [loading, setLoading] = useState(false);

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, email: string) => {
        e.dataTransfer.setData('text/plain', email);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropToTarget = (e: React.DragEvent) => {
        e.preventDefault();
        const email = e.dataTransfer.getData('text/plain');
        if (email && sourceEmails.includes(email)) {
            moveMember(email, 'to_target');
        }
    };

    const handleDropToSource = (e: React.DragEvent) => {
        e.preventDefault();
        const email = e.dataTransfer.getData('text/plain');
        if (email && targetEmails.includes(email)) {
            moveMember(email, 'to_source');
        }
    };
    // ------------------------------

    const handleFetchTeams = () => {
        setIsFetching(true);
        
        const source = projects.find(p => p.teamId === sourceTeamId.toUpperCase());
        if (!source) {
            toast.error(`Source Team ${sourceTeamId.toUpperCase()} not found.`);
            setIsFetching(false);
            return;
        }

        const map = new Map<string, any>();
        source.members.forEach((m: any) => map.set(m.email, m));

        if (action === 'SYNC') {
            const target = projects.find(p => p.teamId === targetTeamId.toUpperCase());
            if (!target) {
                toast.error(`Destination Team ${targetTeamId.toUpperCase()} not found.`);
                setIsFetching(false);
                return;
            }
            if (source.teamId === target.teamId) {
                toast.error("Source and Destination teams cannot be the same.");
                setIsFetching(false);
                return;
            }
            
            target.members.forEach((m: any) => map.set(m.email, m));
            setAllMembersMap(map);
            setFetchedSource(source);
            setFetchedTarget(target);
            setSourceEmails(source.members.map((m: any) => m.email));
            setTargetEmails(target.members.map((m: any) => m.email));
        } else {
            setAllMembersMap(map);
            setFetchedSource(source);
            setFetchedTarget({ teamId: 'NEW_TEAM', team: 'New Team (TBD)', members: [] });
            setSourceEmails(source.members.map((m: any) => m.email));
            setTargetEmails([]);
        }
        
        setIsFetching(false);
    };

    const moveMember = (email: string, direction: 'to_target' | 'to_source') => {
        if (!email) return;
        if (direction === 'to_target') {
            setSourceEmails(prev => prev.filter(e => e !== email));
            setTargetEmails(prev => [...prev, email]);
        } else {
            setTargetEmails(prev => prev.filter(e => e !== email));
            setSourceEmails(prev => [...prev, email]);
        }
    };

    const handleExecute = async () => {
        if (!fetchedSource) return toast.error("Please fetch teams first.");
        if (sourceEmails.length === 0 && targetEmails.length === 0) return toast.error("Both teams cannot be empty.");
        
        if (sourceEmails.length === 3) return toast.error("Source team cannot end up with exactly 3 members.");
        if (sourceEmails.length > 4) return toast.error("Source team cannot exceed 4 members.");
        
        if (targetEmails.length === 3) return toast.error("Destination team cannot end up with exactly 3 members.");
        if (targetEmails.length > 4) return toast.error("Destination team cannot exceed 4 members.");

        setLoading(true);
        const loadingToast = toast.loading(action === 'SYNC' ? "Synchronizing teams..." : "Splitting team...");

        try {
            const res = await fetch('/api/admin/team-restructure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    sourceTeamId: fetchedSource.teamId,
                    targetTeamId: action === 'SYNC' ? fetchedTarget.teamId : undefined,
                    finalSourceEmails: sourceEmails,
                    finalTargetEmails: targetEmails
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message, { id: loadingToast });
                if (data.newTeamId) {
                    toast.success(`New Team ID: ${data.newTeamId} | Password: ${data.newPassword}`, { duration: 10000 });
                }
                await refreshTeams();
                resetForm();
            } else {
                toast.error(data.error || "Failed to restructure team", { id: loadingToast });
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSourceTeamId('');
        setTargetTeamId('');
        setFetchedSource(null);
        setFetchedTarget(null);
        setSourceEmails([]);
        setTargetEmails([]);
        setAllMembersMap(new Map());
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 mb-2 px-2">
                <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 shadow-sm border border-teal-100">
                        <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Team Sync</h2>
                        <p className="text-slate-500 text-sm font-medium mt-0.5">Fully synchronize, swap, or split members between two teams.</p>
                    </div>
                </div>
                {fetchedSource && (
                    <button onClick={() => {
                        setFetchedSource(null);
                        setFetchedTarget(null);
                    }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-sm font-bold">
                        <RefreshCcw size={16} /> Reset
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm relative overflow-hidden flex flex-col min-h-[400px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500"></div>
                
                <AnimatePresence mode="wait">
                    {(!fetchedSource || !fetchedTarget) ? (
                        <motion.div 
                            key="input-phase"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-8 max-w-2xl mx-auto w-full mt-6"
                        >
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <button
                                    onClick={() => setAction('SYNC')}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        action === 'SYNC' 
                                        ? 'bg-teal-50/50 border-teal-500 text-teal-700 shadow-sm' 
                                        : 'bg-[#fafafa] border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                    <span className="font-bold">Two-Way Sync</span>
                                </button>
                                <button
                                    onClick={() => setAction('SPLIT')}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        action === 'SPLIT' 
                                        ? 'bg-indigo-50/50 border-indigo-500 text-indigo-700 shadow-sm' 
                                        : 'bg-[#fafafa] border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <SplitSquareHorizontal className="w-5 h-5" />
                                    <span className="font-bold">Split Team</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Team A ID</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={sourceTeamId}
                                            onChange={(e) => setSourceTeamId(e.target.value)}
                                            placeholder="e.g. TRI-101"
                                            className="w-full bg-[#fafafa] border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 uppercase transition-all"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {action === 'SYNC' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Team B ID</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={targetTeamId}
                                                    onChange={(e) => setTargetTeamId(e.target.value)}
                                                    placeholder="e.g. TRI-102"
                                                    className="w-full bg-[#fafafa] border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 uppercase transition-all"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={handleFetchTeams}
                                disabled={isFetching || !sourceTeamId || (action === 'SYNC' && !targetTeamId)}
                                className="w-full mt-10 py-4 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                Continue & Sync Members
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="selection-phase"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col flex-1 h-full p-6"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Two-Way Synchronization</h3>
                                <p className="text-sm text-slate-500">Drag and drop members between the two teams to reorganize them.</p>
                            </div>

                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
                                
                                {/* Source Column */}
                                <div 
                                    className="bg-slate-50/50 rounded-2xl border-2 border-slate-200 border-dashed p-5 flex flex-col transition-colors hover:border-slate-300"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropToSource}
                                >
                                    <div className="mb-4 pb-4 border-b border-slate-200">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Team A</div>
                                        <div className="text-xl font-black text-slate-800 uppercase mt-1">{fetchedSource.teamId}</div>
                                        <div className="text-sm font-medium text-slate-500 truncate">{fetchedSource.team}</div>
                                    </div>
                                    <div className="space-y-3 flex-1 min-h-[150px]">
                                        <AnimatePresence>
                                            {sourceEmails.map((email: string) => {
                                                const member = allMembersMap.get(email);
                                                if (!member) return null;
                                                return (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={email} 
                                                        draggable={true}
                                                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, email)}
                                                        onClick={() => moveMember(email, 'to_target')}
                                                        className="p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-teal-300 hover:shadow-md cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <UserCircle size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-sm text-slate-800 truncate">{member.fullName || member.name}</div>
                                                                <div className="text-xs text-slate-500 truncate">{member.email}</div>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200 transition-colors">
                                                            <ArrowRight size={16} />
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {sourceEmails.length === 0 && (
                                            <div className="h-full min-h-[120px] flex items-center justify-center rounded-xl bg-transparent text-slate-400/50 font-bold text-sm text-center px-4 border-2 border-transparent border-dashed">
                                                Drag members here
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="flex flex-col items-center justify-center gap-2 px-2">
                                    <div className="w-1 h-full bg-slate-100 rounded-full"></div>
                                    <div className="bg-white border-2 border-slate-100 text-slate-400 p-2 rounded-full">
                                        <ArrowRightLeft size={20} />
                                    </div>
                                    <div className="w-1 h-full bg-slate-100 rounded-full"></div>
                                </div>

                                {/* Target Column */}
                                <div 
                                    className="bg-slate-50/50 rounded-2xl border-2 border-slate-200 border-dashed p-5 flex flex-col relative overflow-hidden transition-colors hover:border-slate-300"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropToTarget}
                                >
                                    <div className="mb-4 pb-4 border-b border-slate-200">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {action === 'SYNC' ? 'Team B' : 'New Team (Will be created)'}
                                        </div>
                                        <div className="text-xl font-black text-slate-800 uppercase mt-1">{fetchedTarget.teamId}</div>
                                        <div className="text-sm font-medium text-slate-500 truncate">{fetchedTarget.team}</div>
                                    </div>
                                    
                                    <div className="space-y-3 flex-1 min-h-[150px]">
                                        <AnimatePresence>
                                            {targetEmails.map((email: string) => {
                                                const member = allMembersMap.get(email);
                                                if (!member) return null;
                                                return (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={email} 
                                                        draggable={true}
                                                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, email)}
                                                        onClick={() => moveMember(email, 'to_source')}
                                                        className="p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-teal-300 hover:shadow-md cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group"
                                                    >
                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200 transition-colors">
                                                            <ArrowLeft size={16} />
                                                        </div>
                                                        <div className="flex items-center gap-3 overflow-hidden ml-3 justify-end text-right w-full">
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-sm text-slate-800 truncate">{member.fullName || member.name}</div>
                                                                <div className="text-xs text-slate-500 truncate">{member.email}</div>
                                                            </div>
                                                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <UserCircle size={20} />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {targetEmails.length === 0 && (
                                            <div className="h-full min-h-[120px] flex items-center justify-center rounded-xl bg-transparent text-slate-400/50 font-bold text-sm text-center px-4 border-2 border-transparent border-dashed">
                                                Drag members here
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleExecute}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                                        loading ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 shadow-none' :
                                        'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30' 
                                    }`}
                                >
                                    {loading ? 'Processing...' : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Synchronize Databases
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
