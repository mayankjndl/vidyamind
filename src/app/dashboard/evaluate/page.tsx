"use client";

import { useEvalStore } from "@/store/stores";
import { motion } from "framer-motion";
import { useState } from "react";
import { FileCheck, Code, FileText, FlaskConical, Shield, ChevronRight, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

type SubmissionType = "essay" | "code" | "lab";

export default function EvaluatePage() {
    const { lastResult, lastIntegrity, isEvaluating, setResult, setIntegrity, setEvaluating, reset } = useEvalStore();
    const [submission, setSubmission] = useState("");
    const [type, setType] = useState<SubmissionType>("essay");
    const [problem, setProblem] = useState("");
    const [codeLang, setCodeLang] = useState("python");

    const handleEvaluate = async () => {
        if (!submission.trim()) return;
        setEvaluating(true);
        reset();
        try {
            const [evalRes, integrityRes] = await Promise.all([
                fetch("/api/ai/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submission, type, problem, language: codeLang }) }),
                fetch("/api/ai/integrity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: submission }) }),
            ]);
            if (evalRes.ok) setResult(await evalRes.json());
            if (integrityRes.ok) setIntegrity(await integrityRes.json());
        } catch (err) { console.error(err); } finally { setEvaluating(false); }
    };

    const getScoreColor = (score: number, max: number) => {
        const pct = (score / max) * 100;
        if (pct >= 80) return "#10b981";
        if (pct >= 60) return "#f59e0b";
        return "#ef4444";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Evaluate</h1><p className="text-gray-500 text-sm mt-1">Submit essays, code, or lab reports for rubric-aware feedback</p></div>

            <div className="flex gap-6">
                {/* Input Panel */}
                <div className="flex-1 space-y-4">
                    {/* Type Selector */}
                    <div className="flex gap-2">
                        {([{ id: "essay", icon: FileText, label: "Essay" }, { id: "code", icon: Code, label: "Code" }, { id: "lab", icon: FlaskConical, label: "Lab Report" }] as const).map((t) => (
                            <button key={t.id} onClick={() => { setType(t.id); reset(); }} className={`type-tab ${type === t.id ? 'active' : 'inactive'}`}>
                                <t.icon className="w-4 h-4" />{t.label}
                            </button>
                        ))}
                    </div>

                    {/* Code-specific fields */}
                    {type === "code" && (
                        <div className="flex gap-3">
                            <input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Problem statement (optional)" className="flex-1 bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                            <select value={codeLang} onChange={(e) => setCodeLang(e.target.value)} className="bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none">
                                <option value="python">Python</option><option value="javascript">JavaScript</option><option value="java">Java</option><option value="cpp">C++</option>
                            </select>
                        </div>
                    )}

                    {/* Submission Input */}
                    <div className="glass-card p-1">
                        <textarea value={submission} onChange={(e) => setSubmission(e.target.value)} placeholder={type === "code" ? "Paste your code here..." : type === "lab" ? "Paste your lab report..." : "Paste your essay here..."} className="w-full h-80 bg-transparent p-4 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none font-mono" />
                    </div>

                    <button onClick={handleEvaluate} disabled={!submission.trim() || isEvaluating} className="btn-primary w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isEvaluating ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Evaluating...</>) : (<><FileCheck className="w-5 h-5" />Evaluate with Rubric</>)}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="w-96 space-y-4">
                    {lastResult && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Rubric Results</h3>
                                <div className="text-2xl font-bold" style={{ color: getScoreColor(lastResult.overallScore, 100) }}>{lastResult.overallScore}<span className="text-sm text-gray-500">/100</span></div>
                            </div>

                            {/* Criteria Bars */}
                            <div className="space-y-3">
                                {lastResult.criteria.map((c) => (
                                    <div key={c.name}>
                                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{c.name}</span><span style={{ color: getScoreColor(c.score, c.maxScore) }}>{c.score}/{c.maxScore}</span></div>
                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(c.score / c.maxScore) * 100}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: getScoreColor(c.score, c.maxScore) }} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{c.suggestion}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Strengths & Improvements */}
                            {lastResult.strengths?.length > 0 && (
                                <div><p className="text-xs text-emerald-400 font-medium mb-1">✦ Strengths</p>
                                    {lastResult.strengths.map((s, i) => (<p key={i} className="text-xs text-gray-400 ml-3">• {s}</p>))}
                                </div>
                            )}
                            {lastResult.improvements?.length > 0 && (
                                <div><p className="text-xs text-amber-400 font-medium mb-1">⚡ Improvements</p>
                                    {lastResult.improvements.map((s, i) => (<p key={i} className="text-xs text-gray-400 ml-3">• {s}</p>))}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 border-t border-[var(--vm-border)] pt-3">{lastResult.overallFeedback}</p>
                        </motion.div>
                    )}

                    {/* Integrity Report */}
                    {lastIntegrity && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Shield className="w-4 h-4" />Integrity Report</h3>
                                <div className={`text-lg font-bold ${lastIntegrity.originalityScore >= 80 ? "text-emerald-400" : lastIntegrity.originalityScore >= 60 ? "text-amber-400" : "text-red-400"}`}>{lastIntegrity.originalityScore}%</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-[var(--vm-bg-primary)] rounded-lg p-2"><span className="text-gray-500">AI Risk</span><p className={`font-medium capitalize ${lastIntegrity.analysis.aiGeneratedRisk === "low" ? "text-emerald-400" : lastIntegrity.analysis.aiGeneratedRisk === "medium" ? "text-amber-400" : "text-red-400"}`}>{lastIntegrity.analysis.aiGeneratedRisk}</p></div>
                                <div className="bg-[var(--vm-bg-primary)] rounded-lg p-2"><span className="text-gray-500">Style</span><p className="font-medium text-gray-300 capitalize">{lastIntegrity.analysis.styleConsistency?.replace(/_/g, " ")}</p></div>
                            </div>

                            {lastIntegrity.suggestions?.length > 0 && (
                                <div><p className="text-xs text-blue-400 font-medium mb-1">📝 Suggestions</p>
                                    {lastIntegrity.suggestions.map((s, i) => (<p key={i} className="text-xs text-gray-400 ml-3">• {s}</p>))}
                                </div>
                            )}
                            {lastIntegrity.overallNote && <p className="text-xs text-gray-500 italic">{lastIntegrity.overallNote}</p>}
                        </motion.div>
                    )}

                    {!lastResult && !isEvaluating && (
                        <div className="glass-card p-8 text-center"><Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" /><p className="text-gray-500 text-sm">Submit your work to get rubric-aware feedback and integrity analysis</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
