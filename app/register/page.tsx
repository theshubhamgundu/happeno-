"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, Send, ArrowLeft, CheckCircle2, Users, User } from "lucide-react";

interface MemberData {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    year: string;
    department: string;
}

function RegisterPageContent() {
    const REGISTRATIONS_OPEN = process.env.NEXT_PUBLIC_REGISTRATIONS_OPEN === 'true';
    const searchParams = useSearchParams();
    const initialMember = {
        fullName: "",
        email: "",
        phone: "",
        college: "",
        year: "",
        department: ""
    };

    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState("");
    const [domain, setDomain] = useState("");
    const [members, setMembers] = useState<MemberData[]>([
        { ...initialMember },
        { ...initialMember },
        { ...initialMember }
    ]);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeDomain, setActiveDomain] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState("");

    // Domains removed — free-text input used instead

    const handleMemberChange = (index: number, field: keyof MemberData, value: string) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setMembers(newMembers);
    };

    const handleInitiateRegistration = async () => {
        const leader = members[0];
        const isLeaderIncomplete = !leader.fullName || !leader.email || !leader.phone || !leader.college || !leader.year || !leader.department;

        if (!teamName || !domain || !transactionId || isLeaderIncomplete) {
            toast.error("Please fill all required fields, including the Team Identity section");
            return;
        }

        const activeMembers = members.filter((m, idx) =>
            idx === 0 || (m.fullName || m.email || m.phone || m.college || m.department)
        );

        const incompleteMember = activeMembers.find(m =>
            !m.fullName || !m.email || !m.phone || !m.college || !m.year || !m.department
        );

        if (incompleteMember) {
            toast.error("Please complete all fields for each additional member or leave them empty");
            return;
        }

        setIsLoading(true);
        try {
            const idRes = await fetch('/api/register-id');
            const idData = await idRes.json();
            if (!idRes.ok || !idData.nextId) throw new Error(idData.error || 'Could not reserve a team ID.');
            const nextTeamId = idData.nextId;

            setTeamId(nextTeamId);

            const regRes = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamName,
                    domain,
                    members: activeMembers,
                    userTransactionId: transactionId,
                    teamId: nextTeamId
                })
            });

            const regData = await regRes.json();

            if (regData.success) {
                setIsSubmitted(true);
                toast.success("Registration submitted! Pending admin approval.");
            } else {
                toast.error(regData.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Setup Error:", error);
            toast.error("Error initiating registration. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!REGISTRATIONS_OPEN && !isSubmitted) {
        return (
            <div className="min-h-screen bg-[#13001F] relative overflow-hidden font-poppins flex items-center justify-center p-4">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#62009B] opacity-20 blur-[120px] rounded-full" />
                    <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#A200FF] opacity-10 blur-[120px] rounded-full" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-[#1A002E]/80 backdrop-blur-xl border-2 border-white/10 rounded-[40px] p-10 md:p-16 text-center shadow-2xl relative"
                >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#FFEE00] rounded-3xl rotate-12 flex items-center justify-center shadow-2xl">
                        <Users className="w-12 h-12 text-[#62009B] -rotate-12" />
                    </div>

                    <h1 className="text-white text-4xl md:text-6xl font-kanit font-black uppercase italic mt-4 mb-6 leading-tight">
                        REGISTRATIONS <br />
                        <span className="text-[#FFEE00]">ARE CLOSED</span>
                    </h1>

                    <p className="text-white/60 text-lg md:text-xl font-poppins mb-10 leading-relaxed max-w-lg mx-auto">
                        The registration portal for <span className="text-[#FFEE00] font-bold italic">TRI-CITY AI HACKATHON</span> is currently closed. Thank you for the overwhelming response!
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-2 bg-white/10 text-white font-kanit font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10">
                            <ArrowLeft className="w-5 h-5" /> BACK TO HOME
                        </Link>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 text-white/30 text-xs uppercase tracking-[0.3em] font-bold">
                        Follow us for more updates
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#13001F] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-[#1A002E] border-2 border-[#FFEE00] rounded-[30px] md:rounded-[40px] p-6 md:p-10 text-center shadow-[0_0_50px_rgba(255,238,0,0.2)]"
                >
                    <CheckCircle2 className="w-20 h-20 text-[#FFEE00] mx-auto mb-6 animate-pulse" />
                    <h2 className="text-white text-3xl font-kanit font-black mb-4 uppercase italic">Registration Submitted!</h2>
                    <p className="text-white/70 font-poppins mb-8 leading-relaxed">
                        Your details for <span className="text-[#FFEE00] font-bold">{teamName}</span> have been sent. <br />
                        <span className="text-xs mt-4 block">Please wait for manual approval by the administrators. You will be notified via email once your team is confirmed.</span>
                    </p>
                    {teamId && <p className="mb-8 break-all font-mono text-sm text-white/70">Team ID: <span className="text-[#FFEE00]">{teamId}</span></p>}
                    <Link href="/" className="inline-block bg-[#FFEE00] text-[#62009B] font-kanit font-black px-10 py-4 rounded-full hover:bg-[#FFD620] transition-transform hover:scale-105 uppercase tracking-widest">
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#13001F] relative overflow-hidden font-poppins pt-8 pb-12 px-3 md:px-4 md:pt-12 md:pb-20">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#62009B] opacity-20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#A200FF] opacity-10 blur-[120px] rounded-full" />
                <Image src="/main_page_bg.svg" alt="" fill className="object-cover opacity-30 mix-blend-overlay" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="inline-flex items-center text-[#FFEE00] font-kanit font-bold group text-sm md:text-base">
                        <ArrowLeft className="mr-2 w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                        BACK TO HOME
                    </Link>
                </div>

                <div className="bg-[#1A002E]/80 backdrop-blur-xl border-2 border-white/10 rounded-[30px] md:rounded-[40px] p-5 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative">
                        <div>
                            <span className="text-[#FFEE00] font-kanit font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[10px] md:text-sm block mb-1">TRI-CITY AI HACKATHON Registration</span>
                            <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-kanit font-black uppercase italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] leading-none md:leading-tight">
                                <span className="text-[#FFEE00]">FILL</span> DETAILS
                            </h1>
                        </div>
                        <div className="w-24 md:w-32 self-end py-6 text-center opacity-90 transition-transform duration-500 hover:scale-110">
                            <span className="font-kanit font-black italic text-2xl md:text-3xl text-[#FFEE00]">TRICITY</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <h3 className="text-[#FFEE00] font-kanit font-bold text-xl mb-4 flex items-center gap-3">
                                        <Users className="w-6 h-6" /> TEAM IDENTITY
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput label="Team Name" name="teamName" value={teamName} onChange={(e: any) => setTeamName(e.target.value)} placeholder="Enter team name" required />
                                        <FormInput label="Transaction ID" name="transactionId" value={transactionId} onChange={(e: any) => setTransactionId(e.target.value)} placeholder="UPI/UTR Number" required />
                                    </div>
                                </div>
                                <div className="relative p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden">
                                    <h3 className="text-[#FFEE00] font-kanit font-bold text-xl mb-6 flex items-center gap-3 relative z-10">CHALLENGE DOMAIN</h3>
                                    <FormInput label="Domain / Track" name="domain" value={domain} onChange={(e: any) => { setDomain(e.target.value); setActiveDomain(e.target.value); }} placeholder="e.g. General" required />
                                </div>
                            </div>

                            {members.map((member, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-[25px] md:rounded-[35px] p-5 md:p-10 relative group mt-8">
                                    <div className="absolute -top-3 -left-2 md:-top-4 md:-left-4 bg-[#FFEE00] text-[#62009B] font-kanit font-black px-4 py-1.5 md:px-6 md:py-2 text-xs md:text-base rounded-xl md:rounded-2xl rotate-[-2deg] shadow-lg flex items-center gap-2">
                                        <User className="w-4 h-4 md:w-5 md:h-5" />
                                        {idx === 0 ? "LEADER" : `MEMBER 0${idx + 1}`}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pt-6">
                                        <FormInput label="Full Name" name={`name-${idx}`} value={member.fullName} onChange={(e: any) => handleMemberChange(idx, "fullName", e.target.value)} placeholder="Full legal name" required={idx === 0} />
                                        <FormInput label="Email" name={`email-${idx}`} type="email" value={member.email} onChange={(e: any) => handleMemberChange(idx, "email", e.target.value)} placeholder="email@example.com" required={idx === 0} />
                                        <FormInput label="Phone" name={`phone-${idx}`} value={member.phone} onChange={(e: any) => handleMemberChange(idx, "phone", e.target.value)} placeholder="+91 00000 00000" required={idx === 0} />
                                        <FormInput label="College" name={`college-${idx}`} value={member.college} onChange={(e: any) => handleMemberChange(idx, "college", e.target.value)} placeholder="College Name" required={idx === 0} />
                                        <FormSelect label="Year" name={`year-${idx}`} value={member.year} onChange={(e: any) => handleMemberChange(idx, "year", e.target.value)} options={["1st Year", "2nd Year", "3rd Year", "4th Year"]} required={idx === 0} />
                                        <FormInput label="Department" name={`dept-${idx}`} value={member.department} onChange={(e: any) => handleMemberChange(idx, "department", e.target.value)} placeholder="e.g. AI & DS" required={idx === 0} />
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={handleInitiateRegistration} disabled={isLoading} className="w-full bg-[#FFEE00] text-[#62009B] font-kanit font-black h-16 md:h-20 rounded-2xl md:rounded-3xl text-xl md:text-2xl flex items-center justify-center gap-3 hover:bg-[#FFD620] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed uppercase shadow-[0_15px_40px_rgba(255,238,0,0.3)]">
                                {isLoading ? <div className="w-8 h-8 border-4 border-[#62009B] border-t-transparent rounded-full animate-spin" /> : <>SUBMIT REGISTRATION <Send className="w-6 h-6" /></>}
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

const FormInput = ({ label, name, value, onChange, type = "text", placeholder, required }: any) => (
    <div className="flex flex-col gap-2">
        <label htmlFor={name} className="text-white/60 font-kanit font-semibold text-[10px] uppercase tracking-wider ml-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full bg-black/20 border-2 border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-white/10 focus:border-[#FFEE00] focus:ring-4 focus:ring-[#FFEE00]/5 transition-all outline-none font-poppins text-base focus:bg-black/40" />
    </div>
);

const FormSelect = ({ label, name, value, onChange, options, placeholder, required }: any) => (
    <div className="flex flex-col gap-2 relative">
        <label htmlFor={name} className="text-white/60 font-kanit font-semibold text-[10px] uppercase tracking-wider ml-1">{label}</label>
        <div className="relative">
            <select id={name} name={name} value={value} onChange={onChange} required={required} className="w-full bg-black/40 border-2 border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#FFEE00] focus:ring-4 focus:ring-[#FFEE00]/5 transition-all outline-none font-poppins text-base appearance-none cursor-pointer pr-10">
                <option value="" disabled className="bg-[#1A002E]">{placeholder || "Select"}</option>
                {options.map((opt: string) => <option key={opt} value={opt} className="bg-[#1A002E]">{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none w-4 h-4" />
        </div>
    </div>
);

const RegisterPage = () => (
    <Suspense fallback={<div className="min-h-screen bg-[#13001F] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#FFEE00] border-t-transparent rounded-full animate-spin" /></div>}>
        <RegisterPageContent />
    </Suspense>
);

export default RegisterPage;
