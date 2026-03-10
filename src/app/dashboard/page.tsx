"use client";

import { motion } from "framer-motion";
import { Brain, BookOpen, FileCheck, Calendar, Upload, Target, Flame, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useKGStore, useMasteryStore } from "@/store/stores";
import { useAuthStore } from "@/store/auth-store";
import { getExamById, buildKGFromExam } from "@/lib/data/exam-syllabi";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { knowledgeGraph, forExamId, isGenerating, setKnowledgeGraph, setGenerating, setError } = useKGStore();
    const { mastery, getExamReadiness, initializeConcepts, setExamDate } = useMasteryStore();
    const { currentUser } = useAuthStore();
    const [textInput, setTextInput] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [mounted, setMounted] = useState(false);
    const autoLoadedRef = useRef(false);
    const router = useRouter();

    const exam = currentUser?.selectedExam ? getExamById(currentUser.selectedExam) : null;

    useEffect(() => { setMounted(true); }, []);

    // Auto-load exam syllabus — uses hardcoded concepts directly (no AI API)
    useEffect(() => {
        if (!mounted || !exam || autoLoadedRef.current) return;

        const examMismatch = knowledgeGraph && forExamId && forExamId !== exam.id;
        const noKG = !knowledgeGraph;

        if (noKG || examMismatch) {
            autoLoadedRef.current = true;
            if (examMismatch) {
                useKGStore.getState().reset();
                useMasteryStore.getState().resetMastery();
            }
            if (exam.examDate) setExamDate(exam.examDate);
            // Build KG directly from hardcoded official syllabus
            const kg = buildKGFromExam(exam);
            setKnowledgeGraph(kg, exam.id);
            initializeConcepts(kg.concepts.map((c) => c.id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, knowledgeGraph, exam]);

    const readiness = getExamReadiness();
    const totalConcepts = knowledgeGraph?.concepts.length || 0;
    const masteredCount = Object.values(mastery).filter((m) => m.mastery >= 0.85).length;
    const learningCount = Object.values(mastery).filter((m) => m.mastery >= 0.4 && m.mastery < 0.85).length;

    // For custom syllabus uploads (still uses AI)
    const handleGenerateKG = useCallback(async (text: string, subject?: string) => {
        if (!text.trim()) return;
        setGenerating(true);
        try {
            const res = await fetch("/api/ai/generate-kg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 12000), subject: subject || "Subject" }) });
            if (!res.ok) throw new Error("Failed");
            const kg = await res.json();
            setKnowledgeGraph(kg, exam?.id);
            initializeConcepts(kg.concepts.map((c: { id: string }) => c.id));
        } catch { setError("Failed to generate knowledge graph. Check your API key."); }
        finally { setGenerating(false); }
    }, [setGenerating, setKnowledgeGraph, setError, initializeConcepts, exam]);

    const handleFileUpload = useCallback(async (file: File) => {
        const text = await file.text();
        handleGenerateKG(text);
    }, [handleGenerateKG]);

    if (!mounted) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                <div><div className="h-7 w-36 rounded-lg" style={{ background: "var(--vm-bg-card)" }} /><div className="h-4 w-56 rounded-lg mt-2" style={{ background: "var(--vm-bg-card)" }} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--vm-bg-card)" }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--vm-text-primary)" }}>Dashboard</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--vm-text-muted)" }}>
                            {exam ? `${exam.icon} Preparing for ${exam.name}` : "Welcome back. Let's continue learning."}
                        </p>
                    </div>
                    {exam?.examDate && (
                        <div className="text-right">
                            <p className="text-[11px]" style={{ color: "var(--vm-text-faint)" }}>Exam Date</p>
                            <p className="text-sm font-semibold" style={{ color: "var(--vm-text-secondary)" }}>
                                {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Exam Readiness", value: `${readiness}%`, icon: Target, detail: readiness > 70 ? "On track" : "Keep studying" },
                    { label: "Concepts Mastered", value: `${masteredCount}/${totalConcepts}`, icon: Brain, detail: `${learningCount} in progress` },
                    { label: "Study Streak", value: "7 days", icon: Flame, detail: "Personal best" },
                    { label: "XP Earned", value: `${Object.values(mastery).reduce((s, m) => s + m.totalAttempts * 10, 0)}`, icon: Sparkles, detail: "Scholar Level" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        whileHover={{ y: -3 }}
                        className="stat-card"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium tracking-wide" style={{ color: "var(--vm-text-muted)" }}>{stat.label}</p>
                                <p className="text-xl font-bold mt-1.5" style={{ color: "var(--vm-text-primary)" }}>{stat.value}</p>
                                <p className="text-[11px] mt-1" style={{ color: "var(--vm-text-faint)" }}>{stat.detail}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center icon-box" style={{ background: "var(--vm-accent-muted)", boxShadow: "0 0 12px rgba(124,140,245,0.06)" }}>
                                <stat.icon className="w-4 h-4" style={{ color: "var(--vm-accent)" }} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload / KG Section */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="lg:col-span-2 glass-card p-6">
                    {knowledgeGraph ? (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-base font-semibold" style={{ color: "var(--vm-text-primary)" }}>{knowledgeGraph.subject}</h2>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--vm-text-muted)" }}>{knowledgeGraph.concepts.length} concepts mapped</p>
                                </div>
                                <Link href="/dashboard/knowledge-graph">
                                    <motion.button whileHover={{ x: 2 }} className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5" style={{ background: "var(--vm-accent-muted)", color: "var(--vm-accent)" }}>
                                        View Graph <ChevronRight className="w-3.5 h-3.5" />
                                    </motion.button>
                                </Link>
                            </div>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {knowledgeGraph.concepts.slice(0, 8).map((concept) => {
                                    const m = mastery[concept.id]?.mastery || 0;
                                    return (
                                        <Link key={concept.id} href={`/dashboard/learn?concept=${concept.id}`}>
                                            <div className="concept-row">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m >= 0.85 ? "var(--vm-mastery-4)" : m >= 0.65 ? "var(--vm-mastery-3)" : m >= 0.4 ? "var(--vm-mastery-2)" : m >= 0.15 ? "var(--vm-mastery-1)" : "var(--vm-mastery-0)", boxShadow: m >= 0.4 ? `0 0 6px ${m >= 0.85 ? "var(--vm-mastery-4)" : m >= 0.65 ? "var(--vm-mastery-3)" : "var(--vm-mastery-2)"}44` : "none" }} />
                                                <span className="text-sm flex-1" style={{ color: "var(--vm-text-secondary)" }}>{concept.name}</span>
                                                <span className="text-[11px]" style={{ color: "var(--vm-text-faint)" }}>{Math.round(m * 100)}%</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            <button onClick={() => { useKGStore.getState().reset(); useMasteryStore.getState().resetMastery(); }} className="mt-4 text-[11px] transition-colors duration-200" style={{ color: "var(--vm-text-faint)" }}>
                                Upload new syllabus
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--vm-text-primary)" }}>Get Started</h2>
                            <p className="text-xs mb-5" style={{ color: "var(--vm-text-muted)" }}>Upload your syllabus or paste content to generate a knowledge graph.</p>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                                className="rounded-xl p-8 text-center cursor-pointer transition-all duration-300"
                                style={{
                                    border: `2px dashed ${dragOver ? "var(--vm-accent)" : "var(--vm-border)"}`,
                                    background: dragOver ? "var(--vm-accent-glow)" : "transparent",
                                }}
                            >
                                <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--vm-text-faint)" }} />
                                <p className="text-sm" style={{ color: "var(--vm-text-muted)" }}>
                                    Drop a file or{" "}
                                    <label className="cursor-pointer font-medium" style={{ color: "var(--vm-accent)" }}>
                                        browse
                                        <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                                    </label>
                                </p>
                                <p className="text-[11px] mt-1" style={{ color: "var(--vm-text-faint)" }}>Supports .txt, .md files</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-[11px] mb-2" style={{ color: "var(--vm-text-faint)" }}>Or paste your syllabus:</p>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Paste your syllabus, course outline, or textbook chapter here..."
                                    className="w-full h-28 rounded-xl p-4 text-sm resize-none focus:outline-none transition-all duration-300"
                                    style={{
                                        background: "var(--vm-bg-primary)",
                                        border: "1px solid var(--vm-border)",
                                        color: "var(--vm-text-secondary)",
                                    }}
                                />
                                <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleGenerateKG(textInput)}
                                    disabled={!textInput.trim() || isGenerating}
                                    className="mt-3 w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    style={{
                                        background: "linear-gradient(135deg, #5c6bc0, #7c4dff)",
                                        color: "rgba(255,255,255,0.9)",
                                        boxShadow: "0 2px 8px rgba(92, 107, 192, 0.2)",
                                    }}
                                >
                                    {isGenerating ? (
                                        <><div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />Generating...</>
                                    ) : (
                                        <><Brain className="w-4 h-4" />Generate Knowledge Graph</>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="space-y-4">
                    <h2 className="text-sm font-semibold tracking-wide" style={{ color: "var(--vm-text-secondary)" }}>Quick Actions</h2>
                    {[
                        { href: "/dashboard/knowledge-graph", icon: Brain, label: "Knowledge Graph", desc: "Explore concept map" },
                        { href: "/dashboard/learn", icon: BookOpen, label: "AI Tutor", desc: "Socratic learning" },
                        { href: "/dashboard/evaluate", icon: FileCheck, label: "Submit Work", desc: "Get rubric feedback" },
                        { href: "/dashboard/planner", icon: Calendar, label: "Study Planner", desc: "Spaced repetition" },
                    ].map((action, i) => (
                        <Link key={action.href} href={action.href}>
                            <motion.div
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.08 }}
                                whileHover={{ y: -2, x: 3 }}
                                className="action-card group"
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center icon-box" style={{ background: "var(--vm-accent-muted)", boxShadow: "0 0 10px rgba(124,140,245,0.05)" }}>
                                    <action.icon className="w-4 h-4" style={{ color: "var(--vm-accent)" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: "var(--vm-text-primary)" }}>{action.label}</p>
                                    <p className="text-[11px]" style={{ color: "var(--vm-text-faint)" }}>{action.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" style={{ color: "var(--vm-text-faint)" }} />
                            </motion.div>
                        </Link>
                    ))}

                    {/* Readiness */}
                    <div className="glass-card p-5">
                        <p className="text-xs font-medium mb-3" style={{ color: "var(--vm-text-muted)" }}>Exam Readiness</p>
                        <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--vm-bg-primary)" }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${readiness}%` }}
                                transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, var(--vm-accent), #a78bfa)" }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px]" style={{ color: "var(--vm-text-faint)" }}>0%</span>
                            <span className="text-sm font-bold" style={{ color: "var(--vm-text-primary)" }}>{readiness}%</span>
                            <span className="text-[10px]" style={{ color: "var(--vm-text-faint)" }}>100%</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
