"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Send, X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HelpPage() {
    const [helpCategory, setHelpCategory] = useState('Team Details Query');
    const [helpTeamId, setHelpTeamId] = useState('');
    const [helpContactName, setHelpContactName] = useState('');
    const [helpContactPhone, setHelpContactPhone] = useState('');
    const [helpText, setHelpText] = useState('');
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

    const handleSubmitSupportTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!helpText.trim()) {
            toast.error('Please describe your issue.');
            return;
        }

        setIsSubmittingHelp(true);
        try {
            const res = await fetch('/api/help-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: helpCategory,
                    teamId: helpTeamId.trim(),
                    contactName: helpContactName.trim(),
                    contactPhone: helpContactPhone.trim(),
                    description: helpText.trim(),
                    source: 'edit_registration'
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Your support request has been logged! Our coordinators will contact you shortly.');
                setHelpText('');
                setHelpTeamId('');
                setHelpContactName('');
                setHelpContactPhone('');
            } else {
                toast.error(data.error || 'Failed to submit query.');
            }
        } catch (error) {
            toast.error('Network error. Please try again later.');
        } finally {
            setIsSubmittingHelp(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-teal-200">
            <div className="w-full max-w-lg">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
                >
                    <div className="bg-white px-6 py-8 relative overflow-hidden border-b border-slate-100">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-4">
                                <HelpCircle size={24} className="text-slate-700" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                                Coordinator Support
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                Need help? Raise a ticket and we'll contact you.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmitSupportTicket} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Issue Category
                                    </label>
                                    <select
                                        value={helpCategory}
                                        onChange={(e) => setHelpCategory(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none text-sm transition-all"
                                    >
                                        <option value="Team Details Query">Team Details Query</option>
                                        <option value="Hackathon Information">Hackathon Information</option>
                                        <option value="Portal Access">Portal Access</option>
                                        <option value="Reporting Issue">Reporting Issue</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Team ID <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TRI12345"
                                        value={helpTeamId}
                                        onChange={(e) => setHelpTeamId(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-300 text-sm transition-all uppercase"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={helpContactName}
                                        onChange={(e) => setHelpContactName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-300 text-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                        Phone No.
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Mobile Number"
                                        value={helpContactPhone}
                                        onChange={(e) => setHelpContactPhone(e.target.value.replace(/\D/g, ''))}
                                        maxLength={10}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-300 text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                                    Describe your issue
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Please describe your problem or question in detail..."
                                    value={helpText}
                                    onChange={(e) => setHelpText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-300 text-sm transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingHelp || !helpText.trim()}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-black hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                            >
                                {isSubmittingHelp ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit Ticket</span>
                                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
                
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
