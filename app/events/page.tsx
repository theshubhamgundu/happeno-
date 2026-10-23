"use client"

import React from "react";
import { Calendar, MapPin, Tag, Trophy, Cpu, Code, Globe, ShieldCheck } from "lucide-react";
import FadeInView from "@/components/FadeInView";
import { motion } from "framer-motion";

const PRODUCTS = [
    {
        id: "tricity-main",
        title: "TRI-CITY AI HACKATHON Registration",
        description: "Official entry ticket for the 48-hour national level hackathon. Includes access to workspace, mentors, and all sessions.",
        price: "â‚¹600",
        date: "April 10-11, 2026",
        icon: <Cpu className="w-8 h-8" />,
        color: "#FFEE00",
        type: "Hackathon"
    },
    {
        id: "workshop-tech",
        title: "Tech Innovation Workshop",
        description: "Hands-on training session on building innovative solutions and automation workflows using modern frameworks.",
        price: "₹250",
        date: "April 18, 2026",
        icon: <Code className="w-8 h-8" />,
        color: "#00C8FF",
        type: "Workshop"
    },
    {
        id: "seminar-future",
        title: "Future of Technology",
        description: "A deep dive seminar into emerging technologies and their integration for real-world scaling.",
        price: "₹150",
        date: "April 25, 2026",
        icon: <Globe className="w-8 h-8" />,
        color: "#BA45E8",
        type: "Seminar"
    },
    {
        id: "ctf-event",
        title: "Tech Challenge",
        description: "Intense 6-hour challenge focusing on problem-solving, critical thinking, and technical defense.",
        price: "₹200",
        date: "May 02, 2026",
        icon: <ShieldCheck className="w-8 h-8" />,
        color: "#FF4D4D",
        type: "Competition"
    },
    {
        id: "mentorship-pass",
        title: "Exclusive Mentorship Pass",
        description: "Direct 1-on-1 session with industry veteran mentors during the hackathon for intensive project feedback.",
        price: "â‚¹300",
        date: "May 10, 2026",
        icon: <Trophy className="w-8 h-8" />,
        color: "#4DFF88",
        type: "Session"
    }
];

export default function EventsPage() {
    return (
        <div className="relative flex flex-col w-full min-h-screen bg-[#0B0114] text-white font-sans overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[#62009B] opacity-10 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[#BA45E8] opacity-5 blur-[150px] rounded-full" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-48 pb-20 px-4 md:px-10 container mx-auto text-center">
                <FadeInView>
                    <h1 className="text-[#FFEE00] font-kanit font-black text-6xl md:text-8xl italic uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,238,0,0.3)] leading-none mb-6">
                        OUR <span className="text-white">EVENTS</span> & SERVICES
                    </h1>
                    <p className="text-white/60 font-kanit text-xl max-w-2xl mx-auto uppercase italic tracking-widest">
                        Check out our upcoming specialized workshops, seminars, and competition modules.
                    </p>
                </FadeInView>
            </div>

            {/* Products Grid */}
            <div className="relative z-10 container mx-auto px-4 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PRODUCTS.map((product, idx) => (
                        <FadeInView key={product.id} delay={idx * 0.1}>
                            <div className="group relative bg-white/5 border border-white/10 rounded-[35px] p-8 backdrop-blur-md hover:bg-white/10 transition-all duration-500 overflow-hidden h-full flex flex-col">
                                {/* Accent Glow */}
                                <div
                                    className="absolute -top-10 -right-10 w-32 h-32 opacity-0 group-hover:opacity-20 blur-3xl rounded-full transition-opacity duration-500"
                                    style={{ backgroundColor: product.color }}
                                />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                                            style={{ color: product.color }}
                                        >
                                            {product.icon}
                                        </div>
                                        <span className="bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/5">
                                            {product.type}
                                        </span>
                                    </div>

                                    <h3 className="text-white font-kanit font-black text-2xl uppercase italic mb-3 group-hover:text-[#FFEE00] transition-colors">
                                        {product.title}
                                    </h3>

                                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-grow">
                                        {product.description}
                                    </p>

                                    <div className="space-y-3 mt-auto pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2 text-white/40">
                                            <Calendar size={14} className="text-[#FFEE00]" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{product.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-white">
                                                <Tag size={16} className="text-[#FFEE00]" />
                                                <span className="text-2xl font-kanit font-black italic">{product.price}</span>
                                            </div>
                                            <button className="bg-white/5 hover:bg-white/20 text-white/60 hover:text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all cursor-default">
                                                Sold Separately
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeInView>
                    ))}
                </div>

                {/* Legal Info Section */}
                <div className="mt-32 pt-12 border-t border-white/10 text-center">
                    <FadeInView>
                        <p className="text-white/20 text-xs uppercase tracking-[0.3em] mb-4">
                            Legal Business Entity
                        </p>
                        <h2 className="text-white font-kanit font-black text-2xl md:text-4xl uppercase italic mb-2">
                            SHUBHAM VASANT GUNDU
                        </h2>
                        <p className="text-white/40 text-sm max-w-xl mx-auto">
                            Operating as the primary coordinator and event organizer for HAPPENO HACKATHON. All commercial transactions are processed through the official gateway under this legal registry.
                        </p>
                    </FadeInView>
                </div>
            </div>

            {/* Decorative Footer Logo */}
            <div className="absolute bottom-20 -left-20 opacity-5 pointer-events-none">
                <span className="font-kanit font-black italic text-8xl">HAPPENO</span>
            </div>
        </div>
    );
}
