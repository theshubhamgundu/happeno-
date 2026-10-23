"use client"

import React from "react";
import Image from "next/image";
import { Mail, MapPin, Phone, Globe, Navigation2, Train, Plane, Bus, User } from "lucide-react";
import FadeInView from "@/components/FadeInView";
import { motion } from "framer-motion";

export default function ContactPage() {
    return (
        <div className="relative flex flex-col w-full min-h-screen bg-[#0B0114] text-white font-sans overflow-x-hidden">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-[#62009B] opacity-10 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#FFEE00] opacity-5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-48 pb-20 px-4 md:px-10 container mx-auto">
                <FadeInView>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl text-center lg:text-left">
                            <h1 className="text-[#FFEE00] font-kanit font-black text-6xl md:text-8xl italic uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,238,0,0.3)] leading-none mb-4">
                                GET IN <span className="text-white">TOUCH</span>
                            </h1>
                            <p className="text-white/60 font-kanit text-xl md:text-2xl tracking-[0.2em] uppercase italic">
                                Happeno Hackathon Platform
                            </p>
                        </div>

                        <div className="w-48 md:w-64 py-10 text-center animate-float">
                            <span className="font-kanit font-black italic text-5xl md:text-7xl text-teal-400">HAPPENO</span>
                            <span className="block mt-2 text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-white/70">Hackathon OS</span>
                        </div>
                    </div>
                </FadeInView>
            </div>

            {/* Main Grid */}
            <div className="relative z-10 container mx-auto px-4 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-6">

                        <FadeInView delay={0.1}>
                            <ContactCard
                                icon={<MapPin className="text-[#FFEE00]" />}
                                title="Platform Support"
                                value="Happeno Hackathon OS, Hyderabad, Telangana, India."
                                color="#FFEE00"
                            />
                        </FadeInView>

                        <FadeInView delay={0.2}>
                            <ContactCard
                                icon={<Mail className="text-[#BA45E8]" />}
                                title="General Inquiry"
                                value="support@happeno.in"
                                subValue="Available 24/7 for support"
                                color="#BA45E8"
                            />
                        </FadeInView>



                    </div>

                    {/* Map Section */}
                    <div className="lg:col-span-2">
                        <FadeInView delay={0.2} className="h-full">
                            <div className="relative group rounded-[35px] overflow-hidden border border-white/10 bg-white/5 p-4 backdrop-blur-md h-full min-h-[520px] flex flex-col">

                                {/* Navigation Badge */}
                                <div className="absolute top-8 left-8 z-20 flex flex-col gap-4">
                                    <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3">
                                        <Navigation2 className="text-[#FFEE00] animate-pulse" />
                                        <div>
                                            <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-1">
                                                Navigation
                                            </p>
                                            <p className="text-white font-kanit font-black italic uppercase">
                                                FIND OUR CAMPUS
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href="https://maps.app.goo.gl/idTrgnPv9C1CkrtNA"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#FFEE00] hover:bg-white text-[#62009B] rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(255,238,0,0.2)] w-fit"
                                    >
                                        Get Directions <Globe size={14} />
                                    </a>
                                </div>

                                {/* Map */}
                                <div className="flex-grow w-full rounded-[25px] overflow-hidden border border-white/5">
                                    <iframe
                                        src="https://www.google.com/maps?q=Hyderabad%2C%20Telangana%2C%20India&output=embed"
                                        className="w-full h-full min-h-[500px] rounded-[25px] grayscale brightness-90 contrast-110 group-hover:grayscale-0 transition duration-500"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>

                            </div>
                        </FadeInView>
                    </div>
                </div>

                {/* Team Coordinators Section */}
                <div className="mt-20">
                    <FadeInView>
                        <h2 className="text-white font-kanit font-black text-3xl md:text-5xl uppercase italic mb-10 text-center md:text-left">
                            COMMUNITY <span className="text-[#FFEE00]">COORDINATORS</span>
                        </h2>
                    </FadeInView>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FadeInView delay={0.1}>
                            <ContactCard
                                icon={<User className="text-[#FFEE00]" />}
                                title="Platform Coordinator"
                                value="SHUBHAM GUNDU"
                                subValue={
                                    <div className="flex flex-col gap-2 mt-3">
                                        <a href="tel:+918698846796" className="flex items-center gap-2 hover:text-[#FFEE00] transition-colors w-fit">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-sm font-bold">+91 86988 46796</span>
                                        </a>
                                        <a href="mailto:support@happeno.in" className="flex items-center gap-2 hover:text-[#FFEE00] transition-colors w-fit">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-sm font-bold lowercase">support@happeno.in</span>
                                        </a>
                                    </div>
                                }
                                color="#FFEE00"
                            />
                        </FadeInView>

                        <FadeInView delay={0.2}>
                            <ContactCard
                                icon={<User className="text-[#00C8FF]" />}
                                title="Student Coordinator"
                                value="GHANTA KOWSHIK"
                                subValue={
                                    <div className="flex flex-col gap-2 mt-3">
                                        <a href="tel:+919652491275" className="flex items-center gap-2 hover:text-[#00C8FF] transition-colors w-fit">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-sm font-bold">+91 96524 91275</span>
                                        </a>
                                    </div>
                                }
                                color="#00C8FF"
                            />
                        </FadeInView>
                    </div>
                </div>

                {/* Transportation Section */}
                <div className="mt-20">
                    <FadeInView>
                        <h2 className="text-white font-kanit font-black text-3xl md:text-5xl uppercase italic mb-10 text-center md:text-left">
                            HOW TO <span className="text-[#BA45E8]">REACH US</span>
                        </h2>
                    </FadeInView>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <TransportCard
                            icon={<Train size={32} />}
                            title="By Train"
                            desc="Secunderabad & Hyderabad (Nampally) stations are approx 35km away. TSRTC buses are regularly available."
                            color="#BA45E8"
                        />

                        <TransportCard
                            icon={<Plane size={32} />}
                            title="By Flight"
                            desc="Rajiv Gandhi International Airport (HYD) is approx 45km away via Outer Ring Road."
                            color="#00C8FF"
                        />

                        <TransportCard
                            icon={<Bus size={32} />}
                            title="By Bus"
                            desc="Frequent TSRTC buses from MGBS & LB Nagar directly to Deshmukhi route."
                            color="#FFEE00"
                        />

                    </div>
                </div>
            </div>



            {/* Decorative Element */}
            <Image
                src="/sideGlass.svg"
                alt="decorative"
                width={800}
                height={500}
                className="absolute -bottom-20 -right-40 opacity-20 rotate-12 pointer-events-none hidden lg:block"
            />
        </div>
    );
}

/* Contact Card */
const ContactCard = ({ icon, title, value, subValue, color }: any) => (
    <div className="group relative bg-white/5 border border-white/10 rounded-[30px] p-8 backdrop-blur-md hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-xl">
        <div
            className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity"
            style={{ backgroundColor: color }}
        />
        <div className="relative z-10 flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {icon}
            </div>
            <div>
                <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-1">{title}</p>
                <p className="text-white font-kanit font-black text-xl md:text-2xl italic leading-tight uppercase mb-2 line-clamp-3">{value}</p>
                {subValue && <div className="text-white/40 text-sm">{subValue}</div>}
            </div>
        </div>
    </div>
);

/* Transport Card */
const TransportCard = ({ icon, title, desc, color }: any) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="bg-white/5 border border-white/10 rounded-[35px] p-8 backdrop-blur-md relative overflow-hidden group shadow-2xl"
    >
        <div className="absolute top-0 left-0 w-full h-1 opacity-40" style={{ backgroundColor: color }} />
        <div className="flex flex-col items-center text-center">
            <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 bg-white/5 border border-white/10 transition-all duration-500 group-hover:scale-125"
                style={{ color }}
            >
                {icon}
            </div>
            <h3 className="text-white font-kanit font-black text-2xl uppercase italic mb-4">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);
