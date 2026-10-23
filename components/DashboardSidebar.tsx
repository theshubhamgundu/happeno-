"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Award,
    ClipboardCheck,
    ShieldCheck,
    ChevronRight,
    User,
    QrCode,
    BarChart3,
    LifeBuoy,
    Zap,
    GanttChartSquare,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HappenoMark from "@/components/HappenoMark";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/context/HackathonContext";
import { useMemo } from "react";

interface SidebarItemProps {
    href: string;
    icon: any;
    label: string;
    active: boolean;
    isCollapsed?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ href, icon: Icon, label, active, isCollapsed, onClick }: SidebarItemProps) => (
    <Link href={href} onClick={onClick}>
        <motion.div
            whileHover={{ x: isCollapsed ? 0 : 5, scale: isCollapsed ? 1.1 : 1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                ? "bg-slate-900 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
            title={isCollapsed ? label : ""}
        >
            <Icon size={20} className={isCollapsed ? "" : "shrink-0"} />
            {!isCollapsed && <span className="font-medium truncate">{label}</span>}
            {active && !isCollapsed && (
                <motion.div
                    layoutId="sidebar-active-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"
                />
            )}
        </motion.div>
    </Link>
);

interface DashboardSidebarProps {
    type: 'team' | 'judge' | 'volunteer' | 'admin';
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const DashboardSidebar = ({ type, isOpen, onClose, isCollapsed, onToggleCollapse }: DashboardSidebarProps) => {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { projects } = useHackathon();

    const displayName = useMemo(() => {
        if (type === 'team') {
            const activeTeam = projects.find(p => p.teamId?.startsWith('VH-')) || projects[0];
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
        ],
        judge: [
            { href: "/dashboard/judge", icon: LayoutDashboard, label: "Grading Pool" },
        ],
        volunteer: [
            { href: "/dashboard/volunteer", icon: LayoutDashboard, label: "Operations" },
        ],
        admin: [
            { href: "/dashboard/admin", icon: BarChart3, label: "Analytics" },
            { href: "/dashboard/admin/users", icon: Users, label: "Roles" },
            { href: "/dashboard/admin/tickets", icon: LifeBuoy, label: "Tickets" },
            { href: "/dashboard/admin/deadlines", icon: Zap, label: "Deadline" },
            { href: "/dashboard/admin/results", icon: GanttChartSquare, label: "Results" },
        ]
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                animate={{ width: isCollapsed ? 80 : 240 }}
                className={`
                    fixed top-0 left-0 z-50 h-screen bg-[#0B0114]/95 backdrop-blur-xl border-r border-white/10 flex flex-col p-4 md:p-6 transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
                `}
            >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-12 px-2`}>
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(15,118,110,0.5)] overflow-hidden bg-[#0f766e]">
                                <span className="text-white">H</span>
                            </div>
                            <HappenoMark compact className="text-2xl" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(15,118,110,0.5)] overflow-hidden bg-[#0f766e]">
                            <span className="text-white">H</span>
                        </div>
                    )}
                    {/* Close Button for Mobile */}
                    <button onClick={onClose} className="md:hidden p-2 text-white/60 hover:text-white">
                        <X size={24} />
                    </button>
                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden md:flex absolute -right-3 top-12 w-6 h-6 bg-slate-900 rounded-full items-center justify-center text-white border border-white/20 shadow-lg hover:scale-110 transition-transform"
                    >
                        <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }}>
                            <ChevronRight size={14} />
                        </motion.div>
                    </button>
                </div>

                <nav className="flex-grow space-y-2">
                    {!isCollapsed && (
                        <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase mb-4 px-4">
                            Menu
                        </div>
                    )}
                    {menuItems[type].map((item) => (
                        <SidebarItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            active={pathname === item.href}
                            isCollapsed={isCollapsed}
                            onClick={onClose}
                        />
                    ))}
                </nav>

                <div className="mt-auto space-y-2">
                    <div className={`p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 group cursor-pointer hover:border-slate-800/50 transition-all ${isCollapsed ? "px-0 flex justify-center border-none bg-transparent" : ""}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shrink-0">
                                <User size={20} />
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold truncate max-w-[120px]">{displayName}</span>
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest">{type}</span>
                                    </div>
                                    <ChevronRight size={14} className="ml-auto text-white/20 group-hover:text-white transition-colors" />
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5 ${isCollapsed ? "justify-center px-0" : ""}`}
                        title={isCollapsed ? "Sign Out" : ""}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </motion.div>
        </>
    );
};
