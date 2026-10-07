import { motion, AnimatePresence } from "framer-motion";
import TricityMark from "@/components/TricityMark";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Menu, X, LogOut, User, LayoutDashboard, Award, CalendarDays,
    BarChart3, Users, GanttChartSquare, ChevronRight, QrCode, Lock,
    ShieldCheck, Phone, Coffee, LifeBuoy, Headphones, FileSpreadsheet, ScanLine
} from "lucide-react";
import Link from "next/link";
import { useHackathon } from "@/context/HackathonContext";
import RoleTestSwitcher from "@/components/RoleTestSwitcher";

const adminOperationItems = [
    { href: "/dashboard/admin#entries", section: "entries", icon: Users, label: "Entries" },
    { href: "/dashboard/admin#judges", section: "judges", icon: ShieldCheck, label: "Evaluators" },
    { href: "/dashboard/admin#volunteers", section: "volunteers", icon: Phone, label: "Volunteers" },
    { href: "/dashboard/admin#meals", section: "meals", icon: Coffee, label: "Meals" },
    { href: "/dashboard/admin#helpdesk", section: "helpdesk", icon: Headphones, label: "Help Desk" },
    { href: "/dashboard/admin#exports", section: "exports", icon: FileSpreadsheet, label: "CSV Exports" },
    { href: "/dashboard/admin#checkin", section: "checkin", icon: ScanLine, label: "QR Check-in" },
    { href: "/dashboard/admin#restructure", section: "restructure", icon: Users, label: "Team Restructure" },
    { href: "/dashboard/admin#prescores", section: "prescores", icon: Award, label: "Rabbit Race" },
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
        syncAdminSection();
        window.addEventListener("hashchange", syncAdminSection);
        return () => window.removeEventListener("hashchange", syncAdminSection);
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
            { href: "/dashboard/team/ticket", icon: QrCode, label: "Digital Ticket" },
            { href: "/dashboard/team/timeline", icon: CalendarDays, label: "Timeline" },
            { href: "/dashboard/team", icon: LayoutDashboard, label: "Workspace" },
            { href: "/dashboard/team/submissions", icon: Award, label: "Submissions" },
        ],
        judge: [
            { href: "/dashboard/judge", icon: LayoutDashboard, label: "Evaluation Pool" },
        ],
        volunteer: [
            { href: "/dashboard/volunteer", icon: LayoutDashboard, label: "Scanner & Check-in" },
        ],
        admin: [
            { href: "/dashboard/admin", icon: BarChart3, label: "Command" },
            { href: "/dashboard/admin/users", icon: Users, label: "Hacker Directory" },
            { href: "/dashboard/admin/tickets", icon: LifeBuoy, label: "Mentor Queue" },
            { href: "/dashboard/admin/results", icon: GanttChartSquare, label: "Leaderboard" },
        ]
    };

    useEffect(() => {
        if (!isLoading && (!user || user.role !== type)) {
            router.push("/login");
            return;
        }
        if (!isLoading && type === 'team' && user?.role === 'team') {
            if (user.portalMode === 'edit') router.replace('/edit-registration');
            if (user.portalMode === 'closed') router.replace('/login');
        }
    }, [user, isLoading, type, router]);



    if (isLoading || !user || user.role !== type) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#df6d59] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`dashboard-app dashboard-${type} min-h-screen bg-[#f1eeeb] p-0 text-slate-900`}>

            <div className="p-0 lg:p-3">
            <div className={`mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-[#faf9f7] lg:min-h-[calc(100vh-24px)] lg:rounded-2xl lg:border lg:border-white lg:shadow-[0_12px_36px_rgba(77,57,48,0.08)] ${hasSidebar ? (isSidebarCollapsed ? "lg:grid lg:grid-cols-[68px_minmax(0,1fr)]" : "lg:grid lg:grid-cols-[218px_minmax(0,1fr)]") : "block"}`}>
            {hasSidebar && (
                <aside className={`hidden lg:flex lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white ${isSidebarCollapsed ? "lg:p-2" : "lg:p-3"}`}>
                    <div className={`flex items-center ${isSidebarCollapsed ? "flex-col gap-2" : "justify-between"}`}>
                    <Link href="/" aria-label="TriCity home" className={`flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-base font-bold text-white shadow-sm">T</div>
                        {!isSidebarCollapsed && <div>
                            <TricityMark compact className="text-lg" />
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-[.19em] text-slate-400">Event management</p>
                        </div>}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed(collapsed => !collapsed)}
                        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ChevronRight size={17} className={`transition-transform ${isSidebarCollapsed ? "" : "rotate-180"}`} />
                    </button>
                    </div>

                    {!isSidebarCollapsed && <div className="mt-6 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Navigation</div>}
                    <nav className={`mt-2 space-y-1 ${isSidebarCollapsed ? "mt-5" : ""}`}>
                        {menuItems[type].map((item: any) => {
                            const isActive = pathname === item.href;
                            return <Link key={item.href} href={item.href} title={isSidebarCollapsed ? item.label : undefined} aria-label={isSidebarCollapsed ? item.label : undefined} className={`group flex items-center gap-2.5 rounded-lg py-2 text-xs font-semibold transition ${isSidebarCollapsed ? "justify-center px-2" : "px-2.5"} ${isActive ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-[#f7ece8] hover:text-slate-900"}`}>
                                <span className={`grid h-6 w-6 place-items-center rounded-md ${isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#c85847]"}`}><item.icon size={14} /></span>
                                {!isSidebarCollapsed && <span>{item.label}</span>}
                                {!isSidebarCollapsed && item.label === "Submissions" && effectiveSubmissionLocked && <Lock size={13} className={isActive ? "ml-auto text-indigo-200" : "ml-auto text-slate-400"} />}
                            </Link>;
                        })}
                    </nav>

                    {type === "admin" && <div className="mt-5">
                        {!isSidebarCollapsed && <div className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Manage event operations</div>}
                        <nav className="space-y-1" aria-label="Manage event operations">
                            {adminOperationItems.map(item => {
                                const isActive = pathname === "/dashboard/admin" && activeAdminSection === item.section;
                                return <Link
                                    key={item.section}
                                    href={item.href}
                                    onClick={() => window.dispatchEvent(new CustomEvent("admin-section-change", { detail: item.section }))}
                                    title={isSidebarCollapsed ? item.label : undefined}
                                    aria-label={isSidebarCollapsed ? item.label : undefined}
                                    className={`group flex items-center gap-2.5 rounded-lg py-2 text-xs font-semibold transition ${isSidebarCollapsed ? "justify-center px-2" : "ml-2 px-2.5"} ${isActive ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-[#f7ece8] hover:text-slate-900"}`}
                                >
                                    <span className={`grid h-6 w-6 place-items-center rounded-md ${isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#c85847]"}`}><item.icon size={14} /></span>
                                    {!isSidebarCollapsed && <span>{item.label}</span>}
                                </Link>;
                            })}
                        </nav>
                    </div>}

                    <div className={`mt-auto rounded-2xl border border-slate-200 bg-[#fafafa] ${isSidebarCollapsed ? "p-1.5" : "p-3"}`}>
                        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fbe5df] text-[#c85847]"><User size={17} /></div>
                            {!isSidebarCollapsed && <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{displayName}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{type} access</p></div>}
                        </div>
                    </div>
                </aside>
            )}

            <div className={`min-w-0 ${hasSidebar ? "lg:col-start-2" : ""}`}>
                <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md md:px-5">
                    <div className="flex items-center gap-3">
                        {hasSidebar ? (
                            <>
                                <button onClick={() => setIsMobileMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"><Menu size={20} /></button>
                                <div className="lg:hidden"><p className="text-sm font-black text-[#c85847]">TRICITY</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Workspace</p></div>
                                <div className="hidden lg:block"><p className="text-xs font-semibold text-slate-400">{type.charAt(0).toUpperCase() + type.slice(1)} workspace</p><p className="text-sm font-bold text-slate-700">TriCity AI Hackathon</p></div>
                            </>
                        ) : (
                            <Link href="/" aria-label="TriCity home" className="flex items-center gap-2.5 rounded-xl transition hover:opacity-85">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-base font-bold text-white shadow-sm">T</div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 tracking-tight leading-none">TriCity AI</p>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                                        {type === 'judge' ? 'Evaluator Portal' : type === 'volunteer' ? 'Volunteer Scanner' : 'Portal'}
                                    </p>
                                </div>
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!hasSidebar && (
                            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-[#fafafa] px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                <User size={14} className="text-[#c85847]" />
                                <span className="truncate max-w-[150px]">{displayName}</span>
                            </div>
                        )}
                        <button
                            onClick={logout}
                            aria-label="Sign out"
                            title="Sign out"
                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:px-3"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                        {hasSidebar && (
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fbe5df] text-[#c85847]"><User size={17} /></div>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1480px] px-4 py-4 md:px-5 md:py-5">
                    {type !== "admin" && !hideHeader && <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#c85847]">{type === 'judge' ? 'evaluator' : type} portal</p><h1 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-900 md:text-2xl">{title}</h1></div>
                        <p className="max-w-sm text-[13px] leading-5 text-slate-500">{subtitle || "Stay informed, complete your tasks, and keep the event moving."}</p>
                    </div>}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="dashboard-content min-w-0">{children}</motion.div>
                </main>
            </div>
            </div>
            </div>

            <AnimatePresence>
                {hasSidebar && isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} onClick={(event) => event.stopPropagation()} className="flex h-full w-full max-w-[320px] flex-col rounded-2xl bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 font-bold text-white">T</div><TricityMark compact className="text-xl" /></div><button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-slate-500"><X size={21} /></button></div>
                        <p className="mt-9 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
                        <nav className="mt-3 space-y-1">{menuItems[type].map((item: any) => <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${pathname === item.href ? "bg-teal-600 text-white" : "text-slate-600"}`}><item.icon size={18} />{item.label}</Link>)}</nav>
                        {type === "admin" && <div className="mt-6">
                            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Manage event operations</p>
                            <nav className="space-y-1" aria-label="Manage event operations">
                                {adminOperationItems.map(item => <Link key={item.section} href={item.href} onClick={() => { window.dispatchEvent(new CustomEvent("admin-section-change", { detail: item.section })); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${pathname === "/dashboard/admin" && activeAdminSection === item.section ? "bg-teal-600 text-white" : "text-slate-600"}`}><item.icon size={18} />{item.label}</Link>)}
                            </nav>
                        </div>}
                    </motion.div>
                </motion.div>}
            </AnimatePresence>
        </div>
    );
};
