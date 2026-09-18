import { motion, AnimatePresence } from "framer-motion";
import TricityMark from "@/components/TricityMark";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Menu, X, LogOut, User, LayoutDashboard, Award,
    BarChart3, Users, GanttChartSquare, ChevronDown, QrCode, Lock
} from "lucide-react";
import Link from "next/link";
import { useHackathon } from "@/context/HackathonContext";
import { DEMO_PROJECT, DEMO_TEAM_ID } from "@/lib/demo-data";

interface DashboardLayoutProps {
    children: React.ReactNode;
    type: 'team' | 'judge' | 'volunteer' | 'admin';
    title: string;
}

export const DashboardLayout = ({ children, type, title }: DashboardLayoutProps) => {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { hackathonStartDate, projects, isSubmissionLocked } = useHackathon();
    const [timeLeft, setTimeLeft] = useState("00:00:00");
    const [hasStarted, setHasStarted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isSubmissionCurrentlyLocked, setIsSubmissionCurrentlyLocked] = useState(false);

    const displayName = useMemo(() => {
        if (type === 'team') {
            // Updated to match TeamDashboard logic
            let activeTeam;
            if (user?.teamId) {
                activeTeam = projects.find(p => p.teamId === user.teamId || p.id === user.teamId);
            }
            if (!activeTeam && user?.teamId === DEMO_TEAM_ID) {
                activeTeam = DEMO_PROJECT;
            }
            // Fallback only if no specific teamId is set (for demo/testing)
            if (!activeTeam) {
                activeTeam = projects.find(p => p.teamId?.startsWith('VH-')) || projects[0];
            }
            return activeTeam ? activeTeam.team : "Team Name";
        }
        if (type === 'admin') return "Administrator";
        if (type === 'judge') return user?.name || "Judge Panel";
        if (type === 'volunteer') return user?.name || "Volunteer";
        return "User";
    }, [type, projects, user]);

    const menuItems = {
        team: [
            { href: "/dashboard/team", icon: LayoutDashboard, label: "Overview" },
            { href: "/dashboard/team/submissions", icon: Award, label: "Submissions" },
            { href: "/dashboard/team/ticket", icon: QrCode, label: "Digital Ticket" },
        ],
        judge: [
            { href: "/dashboard/judge", icon: LayoutDashboard, label: "Grading Pool" },
        ],
        volunteer: [
            { href: "/dashboard/volunteer", icon: LayoutDashboard, label: "Operations" },
        ],
        admin: [
            { href: "/dashboard/admin", icon: BarChart3, label: "Command" },
            { href: "/dashboard/admin/users", icon: Users, label: "Hacker Directory" },
            { href: "/dashboard/admin/results", icon: GanttChartSquare, label: "Leaderboard" },
        ]
    };

    useEffect(() => {
        if (!isLoading && (!user || user.role !== type)) {
            router.push("/login");
        }
    }, [user, isLoading, type, router]);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (hackathonStartDate === "TBD") return;
            const [year, month, day] = hackathonStartDate.split('-').map(Number);
            const start = new Date(year, month - 1, day, 9, 30, 0);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();

            const startDiff = start.getTime() - now.getTime();
            const endDiff = end.getTime() - now.getTime();

            if (startDiff > 0) {
                // Not started yet
                const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                setTimeLeft(`${dateStr}, ${timeStr}`);
                setHasStarted(false);
                setProgress(0);
                setIsFinished(false);
            } else if (endDiff > 0) {
                // Hacking in progress
                const remaining = endDiff;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining / 1000 / 60) % 60);

                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
                setHasStarted(true);
                setIsFinished(false);

                const total = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                setProgress((elapsed / total) * 100);
            } else {
                // Finished
                setTimeLeft("00:00");
                setHasStarted(true);
                setIsFinished(true);
                setProgress(100);
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [hackathonStartDate]);

    useEffect(() => {
        const checkSubmissionLock = () => {
            const now = new Date();
            const lockTime = new Date("2026-02-27T09:30:00+05:30");
            setIsSubmissionCurrentlyLocked(now < lockTime || isSubmissionLocked);
        };
        checkSubmissionLock();
        const lockTimer = setInterval(checkSubmissionLock, 10000);
        return () => clearInterval(lockTimer);
    }, [isSubmissionLocked]);

    if (isLoading || !user || user.role !== type) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#df6d59] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`dashboard-app dashboard-${type} min-h-screen bg-[#f1eeeb] p-0 text-slate-900 lg:p-3`}>
            <div className="mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-[#faf9f7] lg:min-h-[calc(100vh-24px)] lg:rounded-2xl lg:border lg:border-white lg:shadow-[0_12px_36px_rgba(77,57,48,0.08)] lg:grid lg:grid-cols-[218px_minmax(0,1fr)]">
            <aside className="hidden lg:flex lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white lg:p-3">
                <Link href="/" className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-base font-bold text-white shadow-sm">T</div>
                    <div>
                        <TricityMark compact className="text-lg" />
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[.19em] text-slate-400">Event management</p>
                    </div>
                </Link>

                <div className="mt-6 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Navigation</div>
                <nav className="mt-2 space-y-1">
                    {menuItems[type].map((item: any) => {
                        const isActive = pathname === item.href;
                        return <Link key={item.href} href={item.href} className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${isActive ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-[#f7ece8] hover:text-slate-900"}`}>
                            <span className={`grid h-6 w-6 place-items-center rounded-md ${isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#c85847]"}`}><item.icon size={14} /></span>
                            <span>{item.label}</span>
                            {item.label === "Submissions" && isSubmissionCurrentlyLocked && <Lock size={13} className={isActive ? "ml-auto text-indigo-200" : "ml-auto text-slate-400"} />}
                        </Link>;
                    })}
                </nav>

                <div className="mt-auto rounded-2xl border border-slate-200 bg-[#fafafa] p-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fbe5df] text-[#c85847]"><User size={17} /></div>
                        <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{displayName}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{type} access</p></div>
                    </div>
                    <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-rose-600"><LogOut size={15} /> Sign out</button>
                </div>
            </aside>

            <div className="min-w-0 lg:col-start-2">
                <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md md:px-5">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"><Menu size={20} /></button>
                        <div className="lg:hidden"><p className="text-sm font-black text-[#c85847]">TRICITY</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Workspace</p></div>
                        <div className="hidden lg:block"><p className="text-xs font-semibold text-slate-400">{type.charAt(0).toUpperCase() + type.slice(1)} workspace</p><p className="text-sm font-bold text-slate-700">TriCity AI Hackathon</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-right">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{isFinished ? "Event ended" : hasStarted ? "Time remaining" : "Starts"}</p>
                            <p className={`mt-0.5 font-mono text-sm font-bold ${isFinished ? "text-rose-600" : hasStarted ? "text-emerald-600" : "text-[#c85847]"}`}>{timeLeft}</p>
                        </div>
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fbe5df] text-[#c85847]"><User size={17} /></div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1480px] px-4 py-4 md:px-5 md:py-5">
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#c85847]">{type} portal</p><h1 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-900 md:text-2xl">{title}</h1></div>
                        <p className="max-w-sm text-[13px] leading-5 text-slate-500">Stay informed, complete your tasks, and keep the event moving.</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="dashboard-content min-w-0">{children}</motion.div>
                </main>
            </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="flex h-full w-full max-w-[320px] flex-col rounded-2xl bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 font-bold text-white">T</div><TricityMark compact className="text-xl" /></div><button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-500"><X size={21} /></button></div>
                        <p className="mt-9 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
                        <nav className="mt-3 space-y-1">{menuItems[type].map((item: any) => <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${pathname === item.href ? "bg-teal-600 text-white" : "text-slate-600"}`}><item.icon size={18} />{item.label}</Link>)}</nav>
                        <button onClick={logout} className="mt-auto flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-600"><LogOut size={17} /> Sign out</button>
                    </motion.div>
                </motion.div>}
            </AnimatePresence>
        </div>
    );
};
