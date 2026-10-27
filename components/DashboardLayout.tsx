"use client";

import { motion, AnimatePresence } from "framer-motion";
import HappenoMark from "@/components/HappenoMark";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Menu, X, LogOut, User, LayoutDashboard, Award, CalendarDays,
    BarChart3, Users, GanttChartSquare, ChevronRight, QrCode, Lock,
    ShieldCheck, Phone, Coffee, LifeBuoy, Headphones, FileSpreadsheet, ScanLine, Key, ScrollText, Target, UsersRound, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useHackathon } from "@/context/HackathonContext";
import RoleTestSwitcher from "@/components/RoleTestSwitcher";

const adminOperationItems = [
    { href: "/dashboard/admin#entries", section: "entries", icon: Users, label: "Entries" },
    { href: "/dashboard/admin#judges", section: "judges", icon: ShieldCheck, label: "Evaluators" },
    { href: "/dashboard/admin#volunteers", section: "volunteers", icon: Phone, label: "Volunteers" },
    { href: "/dashboard/admin#addons", section: "addons", icon: Coffee, label: "Addons" },
    { href: "/dashboard/admin#helpdesk", section: "helpdesk", icon: Headphones, label: "Help Desk" },
    { href: "/dashboard/admin#exports", section: "exports", icon: FileSpreadsheet, label: "CSV Exports" },
    { href: "/dashboard/admin#checkin", section: "checkin", icon: ScanLine, label: "QR Check-in" },
    { href: "/dashboard/admin#restructure", section: "restructure", icon: Users, label: "Team Restructure" },
    { href: "/dashboard/admin/reviews", section: "reviews", icon: Award, label: "Submissions & Reviews" },
    { href: "/dashboard/admin#certificates", section: "certificates", icon: Award, label: "Certificates & Feedback" },
    { href: "/dashboard/admin/mentors", section: "mentors", icon: UsersRound, label: "Mentors" },
];

interface DashboardLayoutProps {
    children: React.ReactNode;
    type: 'team' | 'judge' | 'volunteer' | 'admin';
    title: string;
    subtitle?: string;
    hideSidebar?: boolean;
    hideHeader?: boolean;
}

export const DashboardLayout = ({ children, type, title, subtitle, hideSidebar, hideHeader }: DashboardLayoutProps) => {
    const hasSidebar = type !== 'judge' && type !== 'volunteer' && !hideSidebar;
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeAdminSection, setActiveAdminSection] = useState("entries");
    const { hackathonStartDate, projects, isSubmissionLocked } = useHackathon();

    const IS_HACKATHON_STARTED = new Date() >= new Date('2026-10-10T08:00:00+05:30');
    const effectiveSubmissionLocked = isSubmissionLocked || !IS_HACKATHON_STARTED;


    useEffect(() => {
        const syncAdminSection = () => setActiveAdminSection(window.location.hash.slice(1) || "entries");
        const handleCustomEvent = (e: Event) => setActiveAdminSection((e as CustomEvent).detail);

        syncAdminSection();
        window.addEventListener("hashchange", syncAdminSection);
        window.addEventListener("admin-section-change", handleCustomEvent);

        return () => {
            window.removeEventListener("hashchange", syncAdminSection);
            window.removeEventListener("admin-section-change", handleCustomEvent);
        };
    }, [pathname]);

    const displayName = useMemo(() => {
        if (type === 'team') {
            const activeTeam = projects.find(project => project.teamId === user?.teamId || project.id === user?.teamId);
            return activeTeam ? activeTeam.team : "Team Name";
        }
        if (type === 'admin') return "Administrator";
        if (type === 'judge') return user?.name || "Evaluator Panel";
        if (type === 'volunteer') return user?.name || "Volunteer";
        return "User";
    }, [type, projects, user]);

    const menuItems = {
        team: [
            { href: "/dashboard/team", icon: LayoutDashboard, label: "Workspace" },
            { href: "/dashboard/team/ticket", icon: QrCode, label: "Digital Ticket" },
            { href: "/dashboard/team/timeline", icon: CalendarDays, label: "Timeline" },
            { href: "/dashboard/team/rules", icon: ScrollText, label: "Rules & Guidelines" },
            { href: "/dashboard/team/help", icon: Headphones, label: "Need Help?" },
            { href: "/dashboard/team/submissions", icon: Award, label: "Submissions" },
            { href: "/dashboard/team/contributions", icon: UsersRound, label: "Team Contributions" },
            { href: "/dashboard/team/evaluation-criteria", icon: Target, label: "Evaluation Criteria" },
            { href: "/dashboard/team/certificate", icon: Award, label: "Certificates" },
            { href: "/dashboard/team/communications", icon: MessageCircle, label: "Updates" },
        ],
        judge: [
            { href: "/dashboard/judge", icon: LayoutDashboard, label: "Evaluation Pool" },
        ],
        volunteer: [
            { href: "/dashboard/volunteer", icon: LayoutDashboard, label: "Scanner & Check-in" },
        ],
        admin: [
            { href: "/dashboard/admin", icon: BarChart3, label: "Command" },
            { href: "/dashboard/admin/reviews", icon: Award, label: "Submissions & Reviews" },
            { href: "/dashboard/admin/users", icon: Users, label: "Hacker Directory" },
            { href: "/dashboard/admin/tickets", icon: LifeBuoy, label: "Help Requests" },
            { href: "/dashboard/admin/results", icon: GanttChartSquare, label: "Leaderboard" },
        ]
    };

    useEffect(() => {
        if (!isLoading && (!user || user.role !== type)) {
            router.push("/login");
            return;
        }
    }, [user, isLoading, type, router]);



    if (isLoading || !user || user.role !== type) {
        return (
            <div className="min-h-screen bg-[#ede8f5] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-black border-t-[#f7cb46] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`dashboard-app dashboard-${type} min-h-screen bg-[#ede8f5] p-0 text-black font-sans`}>
            <div className={`w-full min-h-screen bg-[#ede8f5] ${hasSidebar ? (isSidebarCollapsed ? "lg:grid lg:grid-cols-[68px_minmax(0,1fr)]" : "lg:grid lg:grid-cols-[240px_minmax(0,1fr)]") : "block"}`}>
                {hasSidebar && (
                    <aside className={`hidden lg:flex lg:flex-col lg:border-r-2 lg:border-black lg:bg-white ${isSidebarCollapsed ? "lg:p-2" : "lg:p-3"}`}>
                        <div className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-2" : "justify-between"}`}>
                            <Link href="/" aria-label="Happeno home" className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-[#ffdc8b] ${isSidebarCollapsed ? "justify-center" : ""}`}>
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f7cb46] text-base font-black text-black shadow-[2px_2px_0px_#000] border-2 border-black">H</div>
                                {!isSidebarCollapsed && <div>
                                    <HappenoMark compact className="text-base text-black font-black" />
                                    <p className="mt-0.5 text-[8px] font-black uppercase tracking-[.2em] text-neutral-600">Hackathon</p>
                                </div>}
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed(collapsed => !collapsed)}
                                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white border-2 border-black text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                            >
                                <ChevronRight size={15} className={`transition-transform duration-200 ${isSidebarCollapsed ? "" : "rotate-180"}`} />
                            </button>
                        </div>

                        {!isSidebarCollapsed && <div className="mt-5 px-3 text-[10px] font-black uppercase tracking-[.2em] text-neutral-600">Navigation</div>}
                        <nav className={`mt-2 space-y-1 ${isSidebarCollapsed ? "mt-4" : ""}`}>
                            {menuItems[type].map((item: any) => {
                                const isActive = pathname === item.href;
                                return <Link 
                                    key={item.href} 
                                    href={item.href} 
                                    title={isSidebarCollapsed ? item.label : undefined} 
                                    aria-label={isSidebarCollapsed ? item.label : undefined} 
                                    className={`group relative flex items-center gap-2.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                                        isSidebarCollapsed ? "justify-center px-2" : "px-3"
                                    } ${
                                        isActive 
                                            ? "bg-[#ffdc8b] text-black border-2 border-black shadow-[3px_3px_0px_#000] font-black" 
                                            : "text-neutral-800 hover:text-black hover:bg-[#ffdc8b]/40 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_#000]"
                                    }`}
                                >
                                    <span className="grid h-6 w-6 place-items-center rounded-md text-black">
                                        <item.icon size={16} />
                                    </span>
                                    {!isSidebarCollapsed && <span>{item.label}</span>}
                                    {!isSidebarCollapsed && (item.label === "Submissions" || item.label === "Sponsor APIs") && effectiveSubmissionLocked && (
                                        <Lock size={13} className={isActive ? "ml-auto text-black" : "ml-auto text-neutral-500"} />
                                    )}
                                </Link>;
                            })}
                        </nav>

                        {type === "admin" && <div className="mt-5">
                            {!isSidebarCollapsed && <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.16em] text-neutral-600">Manage event operations</div>}
                            <nav className="space-y-1" aria-label="Manage event operations">
                                {adminOperationItems.map(item => {
                                    const isActive = pathname === "/dashboard/admin" && activeAdminSection === item.section;
                                    return <Link
                                        key={item.section}
                                        href={item.href}
                                        onClick={() => window.dispatchEvent(new CustomEvent("admin-section-change", { detail: item.section }))}
                                        title={isSidebarCollapsed ? item.label : undefined}
                                        aria-label={isSidebarCollapsed ? item.label : undefined}
                                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 text-xs font-bold transition-all ${
                                            isSidebarCollapsed ? "justify-center px-2" : "ml-2 px-2.5"
                                        } ${
                                            isActive 
                                                ? "bg-[#99e885] text-black border-2 border-black shadow-[3px_3px_0px_#000] font-black" 
                                                : "text-neutral-800 hover:text-black hover:bg-[#ffdc8b]/40 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_#000]"
                                        }`}
                                    >
                                        <span className="grid h-6 w-6 place-items-center rounded-md text-black">
                                            <item.icon size={15} />
                                        </span>
                                        {!isSidebarCollapsed && <span>{item.label}</span>}
                                    </Link>;
                                })}
                            </nav>
                        </div>}

                        <div className={`mt-auto rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] ${isSidebarCollapsed ? "p-1.5" : "p-2.5"}`}>
                            <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#99e885] border-2 border-black text-black font-black shadow-[1.5px_1.5px_0px_#000]"><User size={15} /></div>
                                {!isSidebarCollapsed && <div className="min-w-0"><p className="truncate text-xs font-black text-black">{displayName}</p><p className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">{type} access</p></div>}
                            </div>
                        </div>
                    </aside>
                )}

                <div className={`min-w-0 ${hasSidebar ? "lg:col-start-2" : ""}`}>
                    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b-2 border-black bg-white px-4 md:px-6 shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center gap-3">
                            {hasSidebar ? (
                                <>
                                    <button onClick={() => setIsMobileMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border-2 border-black bg-[#f7cb46] text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] lg:hidden"><Menu size={18} /></button>
                                    <div className="lg:hidden"><p className="text-sm font-black text-black">HAPPENO</p><p className="text-[8px] font-black uppercase tracking-wider text-neutral-600">Workspace</p></div>
                                    <div className="hidden lg:block">
                                        <p className="text-[11px] font-bold text-neutral-600">{type.charAt(0).toUpperCase() + type.slice(1)} workspace</p>
                                        <p className="text-xs font-black text-black leading-tight">Happeno Hackathon</p>
                                    </div>
                                </>
                            ) : (
                                <Link href="/" aria-label="Happeno home" className="flex items-center gap-2.5 rounded-xl transition hover:opacity-90">
                                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f7cb46] text-base font-black text-black shadow-[2px_2px_0px_#000] border-2 border-black">H</div>
                                    <div>
                                        <p className="text-sm font-black text-black tracking-tight leading-none">Happeno OS</p>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 mt-0.5">
                                            {type === 'judge' ? 'Evaluator Portal' : type === 'volunteer' ? 'Volunteer Scanner' : 'Portal'}
                                        </p>
                                    </div>
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {!hasSidebar && (
                                <div className="hidden sm:flex items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
                                    <User size={13} className="text-black" />
                                    <span className="truncate max-w-[150px]">{displayName}</span>
                                </div>
                            )}
                            <button
                                onClick={logout}
                                aria-label="Sign out"
                                title="Sign out"
                                className="flex h-8 items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#fe90e8] hover:bg-[#fe90e8]/85 px-3 text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                <LogOut size={14} />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                            {hasSidebar && (
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#99e885] border-2 border-black text-black font-black shadow-[1.5px_1.5px_0px_#000]"><User size={15} /></div>
                            )}
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 md:px-6 md:py-6">
                        {type !== "admin" && !hideHeader && <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b-3 border-black pb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-block rounded-md border-2 border-black bg-[#f7cb46] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[.18em] text-black shadow-[2px_2px_0px_#000]">
                                        {type === 'judge' ? 'evaluator' : type} portal
                                    </span>
                                    <span className="rounded-md border-2 border-black bg-[#fe90e8] px-2 py-0.5 text-[10px] font-mono font-black text-black shadow-[1.5px_1.5px_0px_#000]">
                                        ✦ 2026
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-black md:text-4xl font-sans">{title}</h1>
                            </div>
                            <div className="max-w-md text-xs font-bold leading-relaxed text-black bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000] relative">
                                <span className="absolute -top-2 right-4 bg-[#c0f7fe] border border-black text-[9px] font-black px-1.5 py-0.2 rounded shadow-[1px_1px_0px_#000]">NOTICE</span>
                                {subtitle || "Stay informed, complete your tasks, and keep the event moving."}
                            </div>
                        </div>}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="dashboard-content min-w-0">{children}</motion.div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {hasSidebar && isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="flex h-full w-full max-w-[320px] flex-col rounded-2xl bg-[#ede8f5] border-3 border-black p-5 shadow-[6px_6px_0px_#000] text-black">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f7cb46] border-2 border-black font-black text-black shadow-[2px_2px_0px_#000]">H</div>
                                <HappenoMark compact className="text-xl text-black font-black" />
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-black hover:bg-neutral-200 border-2 border-black shadow-[2px_2px_0px_#000]"><X size={18} /></button>
                        </div>
                        <p className="mt-8 px-2 text-[10px] font-black uppercase tracking-[.18em] text-neutral-600">Workspace</p>
                        <nav className="mt-2.5 space-y-1.5">{menuItems[type].map((item: any) => {
                            const isActive = pathname === item.href;
                            const isLocked = (item.label === "Submissions" || item.label === "Sponsor APIs") && effectiveSubmissionLocked;
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                                    isActive 
                                        ? "bg-[#ffdc58] text-black border-2 border-black shadow-[3px_3px_0px_#000] font-black" 
                                        : "text-neutral-800 hover:text-black hover:bg-[#fff9db] border-2 border-transparent hover:border-black"
                                }`}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                    {isLocked && <Lock size={13} className="ml-auto text-neutral-600" />}
                                </Link>
                            );
                        })}</nav>
                        {type === "admin" && <div className="mt-6">
                            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.16em] text-neutral-600">Manage event operations</p>
                            <nav className="space-y-1.5" aria-label="Manage event operations">
                                {adminOperationItems.map(item => <Link key={item.section} href={item.href} onClick={() => { window.dispatchEvent(new CustomEvent("admin-section-change", { detail: item.section })); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all ${pathname === "/dashboard/admin" && activeAdminSection === item.section ? "bg-[#bef264] text-black border-2 border-black shadow-[3px_3px_0px_#000] font-black" : "text-neutral-800 hover:text-black hover:bg-[#fff9db] border-2 border-transparent hover:border-black"}`}><item.icon size={16} />{item.label}</Link>)}
                            </nav>
                        </div>}
                    </motion.div>
                </motion.div>}
            </AnimatePresence>
        </div>
    );
};
