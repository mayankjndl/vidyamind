"use client";

import { useKGStore, useMasteryStore } from "@/store/stores";
import { useAuthStore } from "@/store/auth-store";
import { getExamById } from "@/lib/data/exam-syllabi";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { BookOpen, Zap, Target, TrendingUp, ChevronRight, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";

function getMasteryStatus(m: number): { label: string; color: string; bg: string } {
    if (m >= 0.85) return { label: "Mastered", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.1)" };
    if (m >= 0.65) return { label: "Proficient", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
    if (m >= 0.4) return { label: "Learning", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
    if (m >= 0.15) return { label: "Struggling", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
    return { label: "New", color: "#64748b", bg: "rgba(100, 116, 139, 0.08)" };
}

function getMasteryBarColor(m: number): string {
    if (m >= 0.85) return "#06b6d4";
    if (m >= 0.65) return "#10b981";
    if (m >= 0.4) return "#f59e0b";
    if (m >= 0.15) return "#ef4444";
    return "#334155";
}

export default function SyllabusTrackerPage() {
    const { knowledgeGraph } = useKGStore();
    const { mastery } = useMasteryStore();
    const { currentUser } = useAuthStore();
    const exam = currentUser?.selectedExam ? getExamById(currentUser.selectedExam) : null;

    const subjects = useMemo(() => {
        if (!exam) return [];
        return exam.concepts.map((section) => section.subject);
    }, [exam]);

    const [activeSubject, setActiveSubject] = useState<string>("");

    // Set default active subject
    useMemo(() => {
        if (subjects.length > 0 && !activeSubject) setActiveSubject(subjects[0]);
    }, [subjects, activeSubject]);

    // Get topics for active subject
    const activeTopics = useMemo(() => {
        if (!exam || !activeSubject) return [];
        const section = exam.concepts.find((s) => s.subject === activeSubject);
        if (!section) return [];
        return section.topics.map((topic) => {
            const id = topic.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
            const m = mastery[id]?.mastery || 0;
            const lastPracticed = mastery[id]?.lastPracticed;
            const nextReview = mastery[id]?.nextReviewDate;
            return { id, name: topic, mastery: m, lastPracticed, nextReview, ...getMasteryStatus(m) };
        });
    }, [exam, activeSubject, mastery]);

    // Subject-level stats
    const subjectStats = useMemo(() => {
        if (!exam) return {};
        const stats: Record<string, { total: number; mastered: number; learning: number; avgMastery: number }> = {};
        for (const section of exam.concepts) {
            let totalMastery = 0;
            let mastered = 0;
            let learning = 0;
            for (const topic of section.topics) {
                const id = topic.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                const m = mastery[id]?.mastery || 0;
                totalMastery += m;
                if (m >= 0.85) mastered++;
                else if (m >= 0.4) learning++;
            }
            stats[section.subject] = {
                total: section.topics.length,
                mastered,
                learning,
                avgMastery: section.topics.length > 0 ? totalMastery / section.topics.length : 0,
            };
        }
        return stats;
    }, [exam, mastery]);

    // Overall stats
    const overallStats = useMemo(() => {
        const values = Object.values(subjectStats);
        const totalTopics = values.reduce((a, b) => a + b.total, 0);
        const totalMastered = values.reduce((a, b) => a + b.mastered, 0);
        const totalLearning = values.reduce((a, b) => a + b.learning, 0);
        const avgMastery = totalTopics > 0 ? values.reduce((a, b) => a + b.avgMastery * b.total, 0) / totalTopics : 0;
        return { totalTopics, totalMastered, totalLearning, avgMastery };
    }, [subjectStats]);

    if (!knowledgeGraph || !exam) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--vm-text-faint)" }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--vm-text-primary)" }}>No Syllabus Loaded</h2>
                <p className="text-sm mb-6" style={{ color: "var(--vm-text-muted)" }}>Go to the dashboard to set up your exam syllabus.</p>
                <Link href="/dashboard">
                    <button className="px-6 py-3 rounded-xl font-medium text-sm text-white/90"
                        style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)" }}>
                        Go to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--vm-text-primary)" }}>Syllabus Tracker</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--vm-text-muted)" }}>
                        {exam.icon} {exam.name} — {overallStats.totalTopics} chapters
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: "var(--vm-text-primary)" }}>
                            {Math.round(overallStats.avgMastery * 100)}%
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--vm-text-muted)" }}>Overall Mastery</p>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Mastered", value: overallStats.totalMastered, icon: Sparkles, color: "#06b6d4" },
                    { label: "In Progress", value: overallStats.totalLearning, icon: TrendingUp, color: "#f59e0b" },
                    { label: "Not Started", value: overallStats.totalTopics - overallStats.totalMastered - overallStats.totalLearning, icon: Target, color: "#64748b" },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3 }}
                        className="stat-card flex items-center gap-3"
                    >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 icon-box"
                            style={{ background: `${stat.color}15`, color: stat.color, boxShadow: `0 0 10px ${stat.color}15` }}>
                            <stat.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold" style={{ color: "var(--vm-text-primary)" }}>{stat.value}</p>
                            <p className="text-[11px]" style={{ color: "var(--vm-text-muted)" }}>{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Subject Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {subjects.map((subj) => {
                    const stats = subjectStats[subj];
                    const isActive = activeSubject === subj;
                    return (
                        <motion.button
                            key={subj}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            onClick={() => setActiveSubject(subj)}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all relative"
                            style={{
                                background: isActive ? "var(--vm-accent-muted)" : "var(--vm-bg-elevated)",
                                color: isActive ? "var(--vm-accent)" : "var(--vm-text-muted)",
                                border: `1px solid ${isActive ? "rgba(124, 140, 245, 0.15)" : "var(--vm-border)"}`,
                            }}
                        >
                            <span>{subj}</span>
                            {stats && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                                    style={{ background: isActive ? "rgba(124, 140, 245, 0.15)" : "var(--vm-bg-primary)", color: isActive ? "var(--vm-accent)" : "var(--vm-text-faint)" }}>
                                    {stats.total}
                                </span>
                            )}
                            {/* Subject progress mini-bar */}
                            {stats && (
                                <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--vm-bg-primary)" }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${stats.avgMastery * 100}%`, background: isActive ? "var(--vm-accent)" : "var(--vm-text-faint)" }} />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Subject Progress Header */}
            {subjectStats[activeSubject] && (
                <motion.div
                    key={activeSubject + "-header"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: "var(--vm-text-primary)" }}>
                            {activeSubject} Progress
                        </p>
                        <p className="text-sm font-bold" style={{ color: "var(--vm-accent)" }}>
                            {Math.round(subjectStats[activeSubject].avgMastery * 100)}%
                        </p>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--vm-bg-primary)" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${subjectStats[activeSubject].avgMastery * 100}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, #5c6bc0, #7c4dff)" }}
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-[11px]" style={{ color: "var(--vm-text-muted)" }}>
                            <span style={{ color: "#06b6d4" }}>●</span> {subjectStats[activeSubject].mastered} mastered
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--vm-text-muted)" }}>
                            <span style={{ color: "#f59e0b" }}>●</span> {subjectStats[activeSubject].learning} learning
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--vm-text-muted)" }}>
                            <span style={{ color: "#64748b" }}>●</span> {subjectStats[activeSubject].total - subjectStats[activeSubject].mastered - subjectStats[activeSubject].learning} new
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Chapter Cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSubject}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                >
                    {activeTopics.map((topic, i) => (
                        <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -3 }}
                            transition={{ delay: i * 0.02, duration: 0.2 }}
                            className="glass-card p-0 overflow-hidden group"
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                {/* Chapter Number */}
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                    style={{ background: topic.bg, color: topic.color }}>
                                    {i + 1}
                                </div>

                                {/* Chapter Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: "var(--vm-text-primary)" }}>
                                        {topic.name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        {/* Mini Progress Bar */}
                                        <div className="w-24 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                                            style={{ background: "var(--vm-bg-primary)" }}>
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(topic.mastery * 100, topic.mastery > 0 ? 4 : 0)}%`, background: getMasteryBarColor(topic.mastery) }} />
                                        </div>
                                        <span className="text-[11px] font-medium" style={{ color: topic.color }}>
                                            {Math.round(topic.mastery * 100)}%
                                        </span>
                                        {topic.lastPracticed && (
                                            <span className="text-[10px]" style={{ color: "var(--vm-text-faint)" }}>
                                                Last: {new Date(topic.lastPracticed).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex-shrink-0 uppercase tracking-wide"
                                    style={{ background: topic.bg, color: topic.color }}>
                                    {topic.label}
                                </span>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <Link href={`/dashboard/learn?concept=${topic.id}`}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                            style={{ background: "var(--vm-accent-muted)", color: "var(--vm-accent)" }}
                                            title="Learn"
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                        </motion.button>
                                    </Link>
                                    <Link href={`/dashboard/learn?concept=${topic.id}&quiz=true`}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                            style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
                                            title="Quiz"
                                        >
                                            <Zap className="w-3.5 h-3.5" />
                                        </motion.button>
                                    </Link>
                                </div>

                                {/* Arrow */}
                                <Link href={`/dashboard/learn?concept=${topic.id}`}>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
                                        style={{ color: "var(--vm-text-muted)" }} />
                                </Link>
                            </div>

                            {/* Bottom mastery bar accent */}
                            <div className="w-full h-[2px]" style={{ background: "var(--vm-bg-primary)" }}>
                                <div className="h-full transition-all duration-500"
                                    style={{ width: `${topic.mastery * 100}%`, background: topic.color }} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
