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
            <div className="min-h-screen bg-[#06000D] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06000D] text-white">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0114]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    {/* Left: Branding & Role */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(147,51,234,0.5)] overflow-hidden bg-black transition-transform group-hover:scale-110">
                                <span className="text-[#FFEE00]">T</span>
                            </div>
                            <div className="flex flex-col">
                                <TricityMark compact className="text-xl" />
                                <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-1">{type} PANEL</span>
                            </div>
                        </Link>

                        {/* Desktop Menu Items */}
                        <div className="hidden md:flex items-center gap-1">
                            {menuItems[type].map((item: any) => (
                                <Link key={item.href} href={item.href}>
                                    <div className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 group ${pathname === item.href ? "bg-purple-600/20 text-purple-400" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                                        <item.icon size={18} className={pathname === item.href ? "text-purple-400" : "group-hover:scale-110 transition-transform"} />
                                        <span className="font-medium text-sm flex items-center gap-2">
                                            {item.label}
                                            {item.label === "Submissions" && isSubmissionCurrentlyLocked && (
                                                <Lock size={12} className="text-white/40 group-hover:text-purple-400 transition-colors" />
                                            )}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right: Timer & User Profile */}
                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className="hidden sm:flex flex-col items-end px-4 border-r border-white/10 mr-2 min-w-[120px]">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1 text-right w-full">
                                {isFinished ? "Event Ended" : hasStarted ? "Time Remaining" : "Starts In"}
                            </span>
                            <span className={`text-lg font-mono font-bold leading-none ${isFinished ? "text-red-400" : hasStarted ? "text-green-500" : "text-purple-400"}`}>
                                {timeLeft}
                            </span>
                            {hasStarted && !isFinished && (
                                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-linear-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown (Simplified for layout) */}
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-sm font-bold leading-none">{displayName}</span>
                                <button onClick={logout} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest mt-1 transition-colors">Sign Out</button>
                            </div>
                            {/* Avatar â€” hidden on mobile */}
                            <div className="hidden md:flex w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                                <User size={20} />
                            </div>
                            {/* Mobile Hamburger */}
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-white/10 bg-[#0B0114] overflow-hidden"
                        >
                            <div className="p-4 space-y-2">
                                {menuItems[type].map((item: any) => (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className={`p-4 rounded-xl flex items-center gap-3 ${pathname === item.href ? "bg-purple-600 text-white" : "bg-white/5 text-white/60"}`}>
                                            <item.icon size={20} />
                                            <span className="font-medium flex items-center gap-2">
                                                {item.label}
                                                {item.label === "Submissions" && isSubmissionCurrentlyLocked && (
                                                    <Lock size={14} className="text-white/40" />
                                                )}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                <button
                                    onClick={logout}
                                    className="w-full p-4 rounded-xl flex items-center gap-3 bg-red-500/10 text-red-500"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content Area */}
            <main className="pt-20 lg:pt-24 pb-8 lg:pb-4 px-4 md:px-8 max-w-[1600px] mx-auto relative flex flex-col">
                {/* Background Decorative Elements */}
                <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-pink-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <header className="mb-6 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-kanit font-black italic uppercase tracking-tight text-white/90">
                        {title}
                    </h1>
                    <div className="h-1 w-20 bg-purple-600 mt-2 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.6)]" />
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-grow min-h-0 overflow-y-auto pr-2 custom-scrollbar"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};
