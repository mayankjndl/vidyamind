"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Brain,
    BookOpen,
    FileCheck,
    Calendar,
    ChevronLeft,
    Sparkles,
    LogOut,
    Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { getExamById } from "@/lib/data/exam-syllabi";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/knowledge-graph", label: "Syllabus Tracker", icon: Brain },
    { href: "/dashboard/roadmap", label: "Roadmap", icon: Map },
    { href: "/dashboard/learn", label: "Learn", icon: BookOpen },
    { href: "/dashboard/evaluate", label: "Evaluate", icon: FileCheck },
    { href: "/dashboard/planner", label: "Study Planner", icon: Calendar },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useAuthStore();
    const sidebarWidth = collapsed ? 68 : 240;
    const exam = currentUser?.selectedExam ? getExamById(currentUser.selectedExam) : null;

    const handleLogout = () => {
        logout();
        router.push("/auth");
    };

    return (
        <motion.aside
            animate={{ width: sidebarWidth }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[var(--vm-bg-secondary)] overflow-hidden"
            style={{
                borderRight: "1px solid var(--vm-border)",
                boxShadow: "4px 0 24px rgba(0, 0, 0, 0.3)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0" style={{ borderBottom: "1px solid var(--vm-border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)", boxShadow: "0 2px 8px rgba(92, 107, 192, 0.25)" }}
                >
                    <Sparkles className="w-4 h-4 text-white/90" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h1 className="text-base font-bold leading-tight">
                                <span style={{ color: "var(--vm-text-primary)" }}>Vidya</span>
                                <span className="gradient-text">Mind</span>
                            </h1>
                            <p className="text-[10px] leading-tight" style={{ color: "var(--vm-text-muted)" }}>
                                Cognitive Learning OS
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* User Info */}
            {currentUser && !collapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-3 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--vm-border)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--vm-accent-muted)", color: "var(--vm-accent)" }}
                        >
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--vm-text-primary)" }}>{currentUser.name}</p>
                            {exam && (
                                <p className="text-[10px] truncate" style={{ color: "var(--vm-text-muted)" }}>
                                    {exam.icon} {exam.shortName}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: 2, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer relative sidebar-link",
                                    "transition-colors duration-200",
                                    isActive
                                        ? "text-[var(--vm-accent)]"
                                        : "text-[var(--vm-text-muted)] hover:text-[var(--vm-text-secondary)]"
                                )}
                                style={isActive ? {
                                    background: "var(--vm-accent-muted)",
                                    boxShadow: "inset 0 0 0 1px rgba(124, 140, 245, 0.08), 0 0 12px rgba(124, 140, 245, 0.04)",
                                } : {}}
                            >
                                <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-[var(--vm-accent)]")} />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                        style={{ background: "var(--vm-accent)" }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: Logout + Collapse */}
            <div className="flex-shrink-0" style={{ borderTop: "1px solid var(--vm-border)" }}>
                {!collapsed && (
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium transition-colors"
                        style={{ color: "var(--vm-text-muted)" }}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                )}
                <div className="p-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggle}
                        className="flex items-center justify-center w-full py-2 rounded-lg transition-colors duration-200"
                        style={{ color: "var(--vm-text-muted)" }}
                    >
                        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronLeft className="w-4 h-4" />
                        </motion.div>
                    </motion.button>
                </div>
            </div>
        </motion.aside>
    );
}
