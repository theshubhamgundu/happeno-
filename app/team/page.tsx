"use client";

import React from "react";
import Image from "next/image";
import FadeInView from "@/components/FadeInView";


const TEAM_SECTIONS = [
    {
        title: "Dean & HOD",
        members: [
            { name: "Dr. Raja Vikram", role: "Dean - CSE Allied Branches & HOD - CSE", image: "/team/hod/raja vikram.jpeg" },
        ],
    },
    {
        title: "HODs",
        members: [
            { name: "Prof. B.V. Chowdary", role: "HOD - IT", image: "/team/faculty/prof_bv_chowdary.jpg" },
            { name: "Dr. Vadali Srinivas", role: "HOD - AI&DS", image: "/team/hod/vadali srinivas.jpeg" },
        ],
    },
    {
        title: "Faculty Coordinators",
        members: [
            { name: "Mr. L . Balaji", role: "Assistant Professor", image: "/team/faculty/balaji.jpeg" },
            { name: "Mr. T.Sai Lalith Prasad", role: "Assistant Professor", image: "/team/faculty/lalith_new.jpeg" },
            { name: "Mr. MSB Kasyapa", role: "Assistant Professor", image: "/team/faculty/msb_kasyapa.jpeg" },
        ],
    },
    {
        title: "Student Leads & Coordinators",
        members: [
            { name: "Shubham Gundu", image: "/team/students/shubham.webp" },
            { name: "Sriram naidu", image: "/team/students/sriram.jpeg" },
            { name: "Anil marneni", image: "/team/students/anil.jpg" },
            { name: "Pranay kumar goli", image: "/team/students/pranay.jpeg" },
            { name: "Deekshitha chowdary", image: "/team/students/deekshitha.jpg" },
            { name: "Jhansi laxmi", image: "/team/students/jhansi.jpeg" },
            { name: "Rahul guguloth", image: "/team/students/rahul.jpeg" },
            { name: "Prajith", image: "/team/students/prajith.jpeg" },
            { name: "Shashanth", image: "/team/students/shashanth.jpg" },
            { name: "Rithika", image: "/team/students/ritika.jpeg" },
            { name: "Varshitha", image: "/team/students/varshitha.jpeg" },
            { name: "Bhava Pravallika", image: "/team/students/pravallika.jpeg" },
            { name: "Ajay Sai Karnekota", image: "/team/students/Ajay sai karnekota.jpg" },
            { name: "Kowshik Ghanta", image: "/team/students/Kowshik Ghanta.jpg" },
            { name: "Srujan Anirudh", image: "/team/students/srujan_Anirudh.jpg" },
            { name: "Ghayas", image: "/team/students/Ghayas.jpg" },
            { name: "Pranav", image: "/team/students/pranav.jpg" },
            { name: "Devesh", image: "/team/students/devesh.jpeg" },
            { name: "Mahesh", image: "/team/students/mahesh.jpeg" },
            { name: "Hasini Reddy", image: "/team/students/hasini reddy.jpeg" },
            { name: "Pooja Reddy", image: "/team/students/pooja reddy.jpg" },
            { name: "Sreeja Reddy", image: "/team/students/Sreeja Reddy.jpg" },
            { name: "Vishwasree", image: "/team/students/vishwasree.jpeg" },
            { name: "Ajay", image: "/team/students/Ajay.png" },
            { name: "Sameeksha", image: "/team/students/sameeksha.jpeg" },
            { name: "Vinay", image: "/team/students/vinay.jpeg" },
            { name: "Krishna", image: "/team/students/krishna.jpeg" },
            { name: "Manikanta", image: "/team/students/manikanta.jpeg" },
            { name: "Pranathi", image: "/team/students/pranathi.jpeg" },
            { name: "Rishi Venkat", image: "/team/students/rishi_venkat.jpeg" },
            { name: "Anandh Reddy", image: "/team/students/anandh_reddy.jpeg" },
            { name: "Chandrika Sruthi", image: "/team/students/chandrika_sruthi.jpeg" },
        ],
    },
];

const TeamMemberCard = ({ member }: { member: any }) => (
    <div className="group relative">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white/5 border border-white/10 transition-all duration-500 group-hover:border-[#FFEE00]/50 group-hover:shadow-[0_0_30px_rgba(255,238,0,0.15)]">
            <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-top transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0114] via-[#0B0114]/20 to-transparent opacity-80" />

            {/* Name and Role Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-white font-kanit font-bold text-lg leading-tight uppercase italic">{member.name}</h3>
                {member.role && (
                    <p className="text-[#FFEE00] font-poppins text-xs font-semibold uppercase tracking-wider mt-1">{member.role}</p>
                )}
            </div>
        </div>
    </div>
);

export default function TeamPage() {
    return (
        <div className="relative min-h-screen bg-[#0B0114] overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#62009B]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FFEE00]/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <FadeInView>
                    <div className="flex flex-col items-center mb-20">
                        <h1 className="text-white font-kanit font-black text-5xl md:text-7xl uppercase italic tracking-tighter text-center mb-6">
                            Meet the <span className="text-[#FFEE00]">Crew</span>
                        </h1>
                        <div className="w-24 h-1.5 bg-[#FFEE00] rounded-full" />
                        <p className="mt-6 text-white/60 font-poppins text-center max-w-2xl text-lg">
                            The brilliant minds behind <span className="text-white font-bold">TRI-CITY AI HACKATHON</span>. Working tirelessly to bring you the ultimate hackathon experience.
                        </p>
                    </div>
                </FadeInView>

                {/* Team Sections */}
                <div className="space-y-32">
                    {TEAM_SECTIONS.map((section, sIdx) => (
                        <FadeInView key={section.title} delay={sIdx * 0.1}>
                            <section>
                                <div className="flex items-center gap-6 mb-12">
                                    <h2 className="text-white font-kanit font-black text-3xl md:text-4xl uppercase italic tracking-wide">
                                        {section.title}
                                    </h2>
                                    <div className="flex-1 h-[1px] bg-white/10" />
                                </div>

                                <div className={`grid gap-6 ${section.title === "Dean & HOD"
                                    ? "grid-cols-1 max-w-sm mx-auto"
                                    : section.title === "HODs"
                                        ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                                        : section.title === "Faculty Coordinators"
                                            ? "grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto"
                                            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                                    }`}>
                                    {section.members.map((member, mIdx) => (
                                        <TeamMemberCard key={mIdx} member={member} />
                                    ))}
                                </div>
                            </section>
                        </FadeInView>
                    ))}
                </div>
            </div>

            {/* Custom Noise Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/noise.png')]" />
        </div>
    );
}
