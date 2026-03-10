"use client";

import { useKGStore, useMasteryStore, usePlanStore } from "@/store/stores";
import { useAuthStore } from "@/store/auth-store";
import { EXAMS } from "@/lib/data/exam-syllabi";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import { Calendar, Clock, Target, Zap, Brain, RefreshCw, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getDueReviews, getWeakestConcepts } from "@/lib/mastery/spaced-repetition";
import { generateFullPlan, TopicInfo } from "@/lib/planner/plan-generator";
import { TaskStatus, TrackedSession, TrackedDayPlan } from "@/lib/knowledge-graph/types";

// ---------------------------------------------------------------------------
// Status helpers — derive colors for days, weeks, months
// ---------------------------------------------------------------------------

type AggregateStatus = "pending" | "completed" | "partial" | "attention";

/** Get aggregate status from a list of TaskStatus values */
function getAggregateStatus(statuses: TaskStatus[]): AggregateStatus {
    if (statuses.length === 0) return "pending";
    const all = new Set(statuses);
    if (all.size === 1 && all.has("completed")) return "completed";
    if (all.has("completed") && !all.has("missed") && !all.has("revision")) return "completed";
    if (all.has("missed") || all.has("revision")) return "attention";
    if (all.has("completed")) return "partial";
    return "pending";
}

/** Glowy dot color based on status */
function statusDotClass(status: AggregateStatus): string {
    switch (status) {
        case "completed": return "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]";
        case "attention": return "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]";
        case "partial": return "bg-blue-400 shadow-[0_0_8px_2px_rgba(96,165,250,0.6)]";
        default: return "bg-gray-500 shadow-[0_0_4px_1px_rgba(107,114,128,0.3)]";
    }
}

/** Glowy dot for individual session status */
function sessionDotClass(status: TaskStatus): string {
    switch (status) {
        case "completed": return "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]";
        case "revision": return "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]";
        case "missed": return "bg-red-400 shadow-[0_0_8px_2px_rgba(248,113,113,0.6)]";
        default: return "bg-gray-600 shadow-[0_0_4px_1px_rgba(107,114,128,0.2)]";
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlannerPage() {
    const { knowledgeGraph } = useKGStore();
    const { currentUser } = useAuthStore();
    const { mastery, examDate, setExamDate, getExamReadiness } = useMasteryStore();
    const { studyPlan, isGenerating, setPlan, setGenerating, updateSessionStatus } = usePlanStore();
    const [hoursPerDay, setHoursPerDay] = useState(4);
    const readiness = getExamReadiness();

    // Collapse state: which months/weeks/days are expanded
    const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 0: true });
    const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ "0-0": true });
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({ "0-0-0": true });

    const dueReviews = getDueReviews(mastery);
    const weakConcepts = getWeakestConcepts(mastery, 5);

    const conceptNameMap: Record<string, string> = {};
    knowledgeGraph?.concepts.forEach((c) => { conceptNameMap[c.id] = c.name; });

    // Get exam info for topic list
    const exam = useMemo(
        () => currentUser?.selectedExam ? EXAMS.find((e) => e.id === currentUser.selectedExam) : undefined,
        [currentUser?.selectedExam]
    );

    // Calculate days until exam
    const daysUntilExam = useMemo(() => {
        if (!examDate) return 0;
        try {
            const dt = new Date(examDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return Math.max(0, Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        } catch { return 0; }
    }, [examDate]);

    // Check if timeline exceeds 6-month cap
    const isOverCap = daysUntilExam > 180;

    // Set exam date to 180 days from today
    const setTo180Days = useCallback(() => {
        const d = new Date();
        d.setDate(d.getDate() + 180);
        setExamDate(d.toISOString().split("T")[0]);
    }, [setExamDate]);

    // Build topic list from exam data + mastery
    const topicList = useMemo((): TopicInfo[] => {
        if (!exam) {
            // Fallback: use KG concepts
            if (!knowledgeGraph) return [];
            return knowledgeGraph.concepts.map((c) => ({
                name: c.name,
                mastery: Math.round((mastery[c.id]?.mastery || 0.1) * 100),
                subject: "General",
            }));
        }
        // Use all exam topics
        const topics: TopicInfo[] = [];
        for (const section of exam.concepts) {
            for (const topicName of section.topics) {
                const topicId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                topics.push({
                    name: topicName,
                    mastery: Math.round((mastery[topicId]?.mastery || 0.1) * 100),
                    subject: section.subject,
                });
            }
        }
        return topics;
    }, [exam, knowledgeGraph, mastery]);

    // Generate plan using the algorithmic generator (instant, no API call)
    const generatePlan = useCallback(() => {
        if (topicList.length === 0 || !examDate || isOverCap) return;
        setGenerating(true);

        // Use setTimeout to let the UI show the loading state
        setTimeout(() => {
            const plan = generateFullPlan({
                topics: topicList,
                daysUntilExam: Math.min(daysUntilExam, 180),
                hoursPerDay,
                startDate: new Date(),
            });
            setPlan(plan);

            // Reset expansion state — first month and first week expanded
            setExpandedMonths({ 0: true });
            setExpandedWeeks({ "0-0": true });
            setExpandedDays({ "0-0-0": true });
        }, 100);
    }, [topicList, examDate, isOverCap, daysUntilExam, hoursPerDay, setGenerating, setPlan]);

    // Toggle helpers
    const toggleMonth = (mi: number) =>
        setExpandedMonths((prev) => ({ ...prev, [mi]: !prev[mi] }));
    const toggleWeek = (mi: number, wi: number) =>
        setExpandedWeeks((prev) => ({ ...prev, [`${mi}-${wi}`]: !prev[`${mi}-${wi}`] }));
    const toggleDay = (mi: number, wi: number, di: number) =>
        setExpandedDays((prev) => ({ ...prev, [`${mi}-${wi}-${di}`]: !prev[`${mi}-${wi}-${di}`] }));

    // Cycle session status: pending → completed → revision → missed → pending
    const cycleStatus = (mi: number, wi: number, di: number, si: number, current: TaskStatus) => {
        const order: TaskStatus[] = ["pending", "completed", "revision", "missed"];
        const next = order[(order.indexOf(current) + 1) % order.length];
        updateSessionStatus(mi, wi, di, si, next);
    };

    // ---------- No KG fallback ----------
    if (!knowledgeGraph) {
        return (
            <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Study Planner</h2>
                <p className="text-gray-500 mb-6">Upload a syllabus first to get a personalized study plan.</p>
                <Link href="/dashboard"><button className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600">Go to Dashboard</button></Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Study Planner</h1><p className="text-gray-500 text-sm mt-1">Spaced repetition scheduling &amp; exam readiness insights</p></div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: "Exam Readiness", value: `${readiness}%`, icon: Target, color: readiness >= 70 ? "#10b981" : readiness >= 40 ? "#f59e0b" : "#ef4444" },
                    { label: "Due Reviews", value: String(dueReviews.length), icon: RefreshCw, color: "#f59e0b" },
                    { label: "Weak Areas", value: String(weakConcepts.length), icon: Zap, color: "#ef4444" },
                    { label: "Total Concepts", value: String(topicList.length), icon: Brain, color: "#3b82f6" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -3 }} className="stat-card flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-box" style={{ backgroundColor: s.color + "22", boxShadow: `0 0 10px ${s.color}15` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                        <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-lg font-bold text-white">{s.value}</p></div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Config */}
                <div className="space-y-4">
                    <div className="glass-card p-5 space-y-4">
                        <h3 className="font-semibold text-white text-sm">Plan Settings</h3>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Exam Date</label>
                            <input type="date" value={examDate || ""} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Hours per day: {hoursPerDay}</label>
                            <input type="range" min={1} max={12} value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} className="w-full accent-blue-500" />
                        </div>
                        {examDate && daysUntilExam > 0 && !isOverCap && (
                            <button onClick={generatePlan} disabled={isGenerating} className="btn-primary w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                                {isGenerating ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>) : (<><Calendar className="w-4 h-4" />Generate Study Plan</>)}
                            </button>
                        )}
                    </div>

                    {/* Exam Readiness Gauge */}
                    <div className="glass-card p-5">
                        <h3 className="font-semibold text-white text-sm mb-4">Exam Readiness</h3>
                        <div className="relative w-32 h-32 mx-auto">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
                                <motion.circle cx="50" cy="50" r="40" fill="none" stroke={readiness >= 70 ? "#10b981" : readiness >= 40 ? "#f59e0b" : "#ef4444"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${readiness * 2.51} 251`} initial={{ strokeDasharray: "0 251" }} animate={{ strokeDasharray: `${readiness * 2.51} 251` }} transition={{ duration: 1 }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-white">{readiness}%</span>
                                <span className="text-[10px] text-gray-500">Ready</span>
                            </div>
                        </div>
                        {examDate && <p className="text-center text-xs text-gray-500 mt-3">Exam: {new Date(examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                    </div>

                    {/* Due Reviews */}
                    <div className="glass-card p-5">
                        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-amber-400" />Due for Review</h3>
                        {dueReviews.length === 0 ? (<p className="text-xs text-gray-500">No reviews due today! 🎉</p>) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {dueReviews.slice(0, 5).map((r) => (
                                    <Link key={r.conceptId} href={`/dashboard/learn?concept=${r.conceptId}`}>
                                        <div className="concept-row">
                                            <span className="text-xs text-gray-300">{conceptNameMap[r.conceptId] || r.conceptId}</span>
                                            <span className="text-xs text-gray-600 ml-auto">{Math.round(r.mastery * 100)}%</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Study Plan Display */}
                <div className="lg:col-span-2">
                    {/* 6+ month cap message */}
                    {isOverCap && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                                <h3 className="font-semibold text-white">Exam Too Far Away</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Your exam is <strong className="text-white">{daysUntilExam} days</strong> (~{Math.round(daysUntilExam / 30)} months) from now.
                                We can generate detailed day-by-day plans for up to <strong className="text-white">6 months (180 days)</strong>.
                            </p>
                            <div className="glass-card p-4 bg-blue-500/5 border border-blue-500/20">
                                <p className="text-xs text-blue-300 font-medium mb-2">💡 What to do now:</p>
                                <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                                    <li>If <strong className="text-gray-300">preparing lightly</strong>: focus on building fundamentals in Physics and Chemistry first</li>
                                    <li>If <strong className="text-gray-300">preparing seriously</strong>: set the date to 180 days and get a full detailed plan</li>
                                </ul>
                            </div>
                            <button onClick={() => { setTo180Days(); }} className="btn-primary w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm">
                                <Calendar className="w-4 h-4" />
                                Set to 180 Days &amp; Generate Plan
                            </button>
                        </motion.div>
                    )}

                    {/* No plan yet */}
                    {!studyPlan && !isOverCap && (
                        <div className="glass-card p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Set your exam date and generate a detailed day-by-day study plan</p>
                        </div>
                    )}

                    {/* The plan */}
                    {studyPlan && !isOverCap && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-white">Your Study Plan</h3>
                                <span className={`text-xs font-medium ${studyPlan.predictedFinalReadiness >= 0.6 ? "text-emerald-400" : studyPlan.predictedFinalReadiness >= 0.3 ? "text-amber-400" : "text-red-400"}`}>
                                    Predicted readiness: {Math.round(studyPlan.predictedFinalReadiness * 100)}%
                                </span>
                            </div>

                            {/* Honest Assessment */}
                            <div className="glass-card p-4 border-l-2 border-amber-500/50 bg-amber-500/5">
                                <p className="text-xs text-amber-300/90 font-medium mb-1">⚠️ Reality Check</p>
                                <p className="text-xs text-gray-400 leading-relaxed">{studyPlan.honestAssessment}</p>
                            </div>

                            {/* Plan meta */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{studyPlan.totalDays} days</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{studyPlan.hoursPerDay}h/day</span>
                                <span>{studyPlan.startDate} → {studyPlan.endDate}</span>
                            </div>

                            {/* Status legend */}
                            <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${sessionDotClass("pending")}`} />Pending</span>
                                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${sessionDotClass("completed")}`} />Completed</span>
                                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${sessionDotClass("revision")}`} />Revision</span>
                                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${sessionDotClass("missed")}`} />Missed</span>
                            </div>

                            {/* Month > Week > Day hierarchy */}
                            <div className="space-y-2">
                                {studyPlan.months.map((month, mi) => {
                                    // Aggregate month status from all sessions
                                    const monthStatuses = month.weeks.flatMap((w) => w.days.flatMap((d) => d.sessions.map((s) => s.status)));
                                    const monthAgg = getAggregateStatus(monthStatuses);
                                    const isMonthOpen = !!expandedMonths[mi];

                                    return (
                                        <div key={mi} className="glass-card overflow-hidden">
                                            {/* Month header */}
                                            <button onClick={() => toggleMonth(mi)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {isMonthOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                    <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass(monthAgg)}`} />
                                                    <h4 className="text-sm font-semibold text-white">{month.monthLabel}</h4>
                                                </div>
                                                <span className="text-[10px] text-gray-600">{month.weeks.reduce((a, w) => a + w.days.length, 0)} days</span>
                                            </button>

                                            {/* Month content */}
                                            <AnimatePresence>
                                                {isMonthOpen && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                        <div className="px-4 pb-3 space-y-1">
                                                            {month.weeks.map((week, wi) => {
                                                                const weekStatuses = week.days.flatMap((d) => d.sessions.map((s) => s.status));
                                                                const weekAgg = getAggregateStatus(weekStatuses);
                                                                const isWeekOpen = !!expandedWeeks[`${mi}-${wi}`];

                                                                return (
                                                                    <div key={wi} className="border border-[var(--vm-border)] rounded-xl overflow-hidden">
                                                                        {/* Week header */}
                                                                        <button onClick={() => toggleWeek(mi, wi)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                {isWeekOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                                                                                <span className={`w-2 h-2 rounded-full ${statusDotClass(weekAgg)}`} />
                                                                                <span className="text-xs font-medium text-gray-300">{week.weekLabel}</span>
                                                                            </div>
                                                                            <span className="text-[10px] text-gray-600">{week.days.length} days</span>
                                                                        </button>

                                                                        {/* Week content */}
                                                                        <AnimatePresence>
                                                                            {isWeekOpen && (
                                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                                                                    <div className="px-3 pb-2 space-y-1">
                                                                                        {week.days.map((day, di) => {
                                                                                            const dayStatuses = day.sessions.map((s) => s.status);
                                                                                            const dayAgg = getAggregateStatus(dayStatuses);
                                                                                            const isDayOpen = !!expandedDays[`${mi}-${wi}-${di}`];
                                                                                            const dayDate = new Date(day.date);
                                                                                            const dayLabel = dayDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

                                                                                            return (
                                                                                                <div key={di} className="border border-[var(--vm-border)] rounded-lg overflow-hidden bg-[var(--vm-bg-primary)]/50">
                                                                                                    {/* Day header */}
                                                                                                    <button onClick={() => toggleDay(mi, wi, di)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors">
                                                                                                        <div className="flex items-center gap-2.5">
                                                                                                            {isDayOpen ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                                                                                                            <span className={`w-2 h-2 rounded-full ${statusDotClass(dayAgg)}`} />
                                                                                                            <span className="text-xs text-gray-400">Day {day.day}</span>
                                                                                                            <span className="text-[10px] text-gray-600">{dayLabel}</span>
                                                                                                        </div>
                                                                                                        <span className="text-[10px] text-gray-600">{day.sessions.length} sessions</span>
                                                                                                    </button>

                                                                                                    {/* Day sessions */}
                                                                                                    <AnimatePresence>
                                                                                                        {isDayOpen && (
                                                                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.12 }} className="overflow-hidden">
                                                                                                                <div className="px-3 pb-2 space-y-1">
                                                                                                                    {day.sessions.map((session, si) => (
                                                                                                                        <div key={si} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                                                                                                                            {/* Status dot — click to cycle */}
                                                                                                                            <button
                                                                                                                                onClick={() => cycleStatus(mi, wi, di, si, session.status)}
                                                                                                                                className={`w-3 h-3 rounded-full flex-shrink-0 ${sessionDotClass(session.status)} transition-all hover:scale-125 cursor-pointer`}
                                                                                                                                title={`Status: ${session.status} (click to change)`}
                                                                                                                            />
                                                                                                                            {/* Activity badge */}
                                                                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${session.activity === "deep_study" ? "bg-blue-500/15 text-blue-400" :
                                                                                                                                    session.activity === "practice" ? "bg-emerald-500/15 text-emerald-400" :
                                                                                                                                        session.activity === "quiz" ? "bg-amber-500/15 text-amber-400" :
                                                                                                                                            "bg-purple-500/15 text-purple-400"
                                                                                                                                }`}>{session.duration}m</span>
                                                                                                                            {/* Session info */}
                                                                                                                            <div className="flex-1 min-w-0">
                                                                                                                                <p className={`text-xs truncate ${session.status === "completed" ? "text-gray-500 line-through" : "text-gray-300"}`}>{session.concept}</p>
                                                                                                                                <p className="text-[10px] text-gray-600 capitalize truncate">{session.activity.replace(/_/g, " ")}</p>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    ))}
                                                                                                                </div>
                                                                                                            </motion.div>
                                                                                                        )}
                                                                                                    </AnimatePresence>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tips */}
                            {studyPlan.tips?.length > 0 && (
                                <div className="glass-card p-5">
                                    <h4 className="text-sm font-semibold text-white mb-2">💡 Study Tips</h4>
                                    {studyPlan.tips.map((tip, i) => (<p key={i} className="text-xs text-gray-400 mb-1">• {tip}</p>))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
