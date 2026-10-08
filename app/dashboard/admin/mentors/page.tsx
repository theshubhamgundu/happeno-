"use client";

import React, { useState } from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { UsersRound, Search, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';

const MENTORS = [
    { name: "Seeyana Samreen", phone: "8074316979" },
    { name: "Abdul Rayyan", phone: "9032336004" },
    { name: "Ishtiyaq Ahmed Syed", phone: "8186923980" },
    { name: "Mukesh Penta", phone: "9391223518" },
    { name: "Raghu Eddu", phone: "8317552630" },
    { name: "Sameer Mohammad", phone: "6300728130" },
    { name: "Abbu saikiran", phone: "6301576935" },
    { name: "Adigoppula Ganesh", phone: "9390125875" },
    { name: "Muneera", phone: "9553946731" },
    { name: "G.sreeja", phone: "9014492664" },
    { name: "E.Raghu", phone: "8317552630" },
];

export default function MentorsPage() {
    const [search, setSearch] = useState('');

    const filteredMentors = MENTORS.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) || 
        m.phone.includes(search)
    );

    return (
        <DashboardLayout type="admin" title="Mentors Directory">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <UsersRound size={24} className="text-[#df6d59]" />
                        Official Mentors
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Directory of registered mentors and coordinators.
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search mentors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#df6d59] focus:ring-1 focus:ring-[#df6d59] transition-all"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No.</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMentors.length > 0 ? (
                                filteredMentors.map((mentor, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={index}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                <User size={14} />
                                            </div>
                                            {mentor.name}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            <a href={`tel:${mentor.phone}`} className="flex items-center gap-2 hover:text-[#df6d59] transition-colors w-fit">
                                                <Phone size={14} className="text-slate-400" />
                                                {mentor.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
                                            </a>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-sm text-slate-500">
                                        No mentors found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
