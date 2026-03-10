"use client";

import { useKGStore, useMasteryStore, useChatStore } from "@/store/stores";
import { useAuthStore } from "@/store/auth-store";
import { EXAMS } from "@/lib/data/exam-syllabi";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { Send, Mic, MicOff, BookOpen, Brain, Globe, Sparkles, HelpCircle, ChevronDown, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Link from "next/link";

function LearnContent() {
    const searchParams = useSearchParams();
    const conceptId = searchParams.get("concept");
    const { knowledgeGraph } = useKGStore();
    const { mastery, recordResponse } = useMasteryStore();
    const { messages, addMessage, isLoading, setLoading, language, setLanguage } = useChatStore();
    const { currentUser } = useAuthStore();
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quiz, setQuiz] = useState<{ questions: Array<{ id: string; question: string; options: string[]; correctIndex: number; explanation: string; hint: string }> } | null>(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const kgConcept = knowledgeGraph?.concepts.find((c) => c.id === conceptId);

    // Get the exam data to know subject grouping + ordering
    const exam = useMemo(() => currentUser?.selectedExam ? EXAMS.find((e) => e.id === currentUser.selectedExam) : undefined, [currentUser?.selectedExam]);

    // If no KG concept found, create a virtual concept from exam data so tutor still works
    const concept = kgConcept || (conceptId && exam ? (() => {
        for (const section of exam.concepts) {
            for (const topicName of section.topics) {
                const examId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                if (examId === conceptId) {
                    return { id: examId, name: topicName, description: `${topicName} — ${section.subject}`, difficulty: 5, bloomLevel: "understand" as const, prerequisites: [] as string[] };
                }
            }
        }
        return undefined;
    })() : undefined);
    const conceptMastery = mastery[conceptId || ""]?.mastery || 0;

    // Show ALL exam topics (same as roadmap), grouped by subject.
    // For each topic, try to find a matching KG concept for the link ID.
    const subjectGroups = useMemo(() => {
        if (!exam) {
            // No exam selected — fall back to showing KG concepts in a flat group
            if (!knowledgeGraph) return [];
            const topics = knowledgeGraph.concepts.map((c) => ({
                id: c.id, name: c.name, mastery: mastery[c.id]?.mastery || 0, found: true,
            }));
            return [{ subject: "Topics", topics, avgMastery: 0 }];
        }

        // Normalize for fuzzy name comparison
        const norm = (s: string) =>
            s.toLowerCase().replace(/[,()]/g, "").replace(/\band\b/g, "").replace(/\s+/g, " ").trim();

        return exam.concepts.map((section) => {
            const topics = section.topics.map((topicName) => {
                // Generate the canonical exam topic ID
                const examTopicId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

                // Try to find a matching KG concept (exact ID first, then fuzzy name)
                let kgMatch = knowledgeGraph?.concepts.find((c) => c.id === examTopicId);
                if (!kgMatch && knowledgeGraph) {
                    const tBase = norm(topicName.split("(")[0]);
                    kgMatch = knowledgeGraph.concepts.find((c) => {
                        const cNorm = norm(c.name);
                        return cNorm === tBase || tBase.includes(cNorm) || cNorm.includes(tBase);
                    });
                }

                // Use KG concept ID if matched, otherwise use exam ID (virtual concept)
                const id = kgMatch?.id || examTopicId;
                const m = mastery[id]?.mastery || 0;
                return { id, name: topicName, mastery: m, found: !!kgMatch };
            });

            const avgM = topics.reduce((a, t) => a + t.mastery, 0) / (topics.length || 1);
            return { subject: section.subject, topics, avgMastery: avgM };
        });
    }, [exam, knowledgeGraph, mastery]);

    // Filter topics by search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return subjectGroups;
        const q = searchQuery.toLowerCase();
        return subjectGroups.map((group) => ({
            ...group,
            topics: group.topics.filter((t) => t.name.toLowerCase().includes(q)),
        })).filter((g) => g.topics.length > 0);
    }, [subjectGroups, searchQuery]);

    // When searching, auto-expand all subjects that have matching topics
    const effectiveExpanded = useMemo(() => {
        if (searchQuery.trim()) {
            const expanded: Record<string, boolean> = {};
            filteredGroups.forEach((g) => { expanded[g.subject] = true; });
            return expanded;
        }
        return expandedSubjects;
    }, [searchQuery, filteredGroups, expandedSubjects]);

    const toggleSubject = (subject: string) => {
        setExpandedSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
    };

    // Mastery color helper
    const getMasteryDot = (m: number) => {
        const color = m >= 0.85 ? "#06b6d4" : m >= 0.65 ? "#10b981" : m >= 0.4 ? "#f59e0b" : m >= 0.15 ? "#ef4444" : "#374151";
        const glow = m >= 0.4 ? `0 0 6px ${color}44` : "none";
        return { backgroundColor: color, boxShadow: glow };
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMsg = { id: `msg_${Date.now()}`, role: "user" as const, content: text, timestamp: new Date().toISOString() };
        addMessage(userMsg);
        setInput("");
        setLoading(true);
        try {
            const response = await fetch("/api/ai/tutor", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })), concept: concept?.name || "General", context: concept?.description || "", mastery: conceptMastery, language }),
            });
            if (!response.body) throw new Error("No stream");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";
            const assistantId = `msg_${Date.now()}_a`;
            addMessage({ id: assistantId, role: "assistant", content: "", timestamp: new Date().toISOString() });
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
                for (const line of lines) {
                    const data = line.replace("data: ", "");
                    if (data === "[DONE]") continue;
                    try { const parsed = JSON.parse(data); fullContent += parsed.content; useChatStore.setState((s) => ({ messages: s.messages.map((m) => m.id === assistantId ? { ...m, content: fullContent } : m) })); } catch { }
                }
            }
        } catch { addMessage({ id: `msg_${Date.now()}_e`, role: "assistant", content: "I encountered an error. Please try again.", timestamp: new Date().toISOString() }); } finally { setLoading(false); }
    }, [isLoading, messages, concept, conceptMastery, language, addMessage, setLoading]);

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

    const generateQuiz = async () => {
        if (!concept) return;
        setShowQuiz(true); setCurrentQ(0); setQuizAnswered(null);
        try {
            const res = await fetch("/api/ai/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ concept: concept.name, difficulty: concept.difficulty, mastery: conceptMastery }) });
            setQuiz(await res.json());
        } catch { setQuiz(null); }
    };

    const handleVoice = () => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Voice not supported"); return; }
        const SR = (window as Record<string, unknown>).webkitSpeechRecognition || (window as Record<string, unknown>).SpeechRecognition;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SR as any)();
        recognition.lang = language === "Hindi" ? "hi-IN" : "en-US";
        recognition.interimResults = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); sendMessage(t); setIsRecording(false); };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        setIsRecording(true); recognition.start();
    };

    if (!knowledgeGraph) {
        return (<div className="text-center py-20"><BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2">Start Learning</h2><p className="text-gray-500 mb-6">Upload a syllabus first.</p><Link href="/dashboard"><button className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600">Go to Dashboard</button></Link></div>);
    }

    return (
        <div className="max-w-full mx-auto h-[calc(100vh-6rem)] flex gap-6">
            {/* ── Concept Sidebar (grouped by subject, roadmap order) ── */}
            <div className="w-72 glass-card p-0 flex flex-col overflow-hidden flex-shrink-0">
                {/* Search Bar */}
                <div className="p-3 border-b border-[var(--vm-border)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Subject Groups */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredGroups.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-gray-500">No topics found</p>
                        </div>
                    )}
                    {filteredGroups.map((group) => {
                        const isExpanded = effectiveExpanded[group.subject] || false;
                        return (
                            <div key={group.subject} className="rounded-xl overflow-hidden">
                                {/* Subject Header (clickable to expand/collapse) */}
                                <button
                                    onClick={() => toggleSubject(group.subject)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04] group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={getMasteryDot(group.avgMastery)} />
                                        <span className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                                            {group.subject}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] text-gray-500 font-medium">{group.topics.length}</span>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </button>

                                {/* Topics (animated expand/collapse) */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-3 pr-1 pb-2 space-y-0.5">
                                                {group.topics.map((topic) => {
                                                    const isActive = topic.id === conceptId;
                                                    return (
                                                        <Link key={topic.id} href={`/dashboard/learn?concept=${topic.id}`}>
                                                            <div
                                                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 cursor-pointer
                                                                    ${isActive
                                                                        ? "bg-blue-500/12 border border-blue-500/15"
                                                                        : "hover:bg-white/[0.03] border border-transparent"
                                                                    }`}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={getMasteryDot(topic.mastery)} />
                                                                <span className={`text-xs truncate ${isActive ? "text-blue-400 font-medium" : "text-gray-400"}`}>
                                                                    {topic.name}
                                                                </span>
                                                            </div>
                                                        </Link>
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
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--vm-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
                        <div><h2 className="text-sm font-semibold text-white">{concept?.name || "Select a concept"}</h2><p className="text-xs text-gray-500">Mastery: {Math.round(conceptMastery * 100)}%</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-lg px-3 py-1.5 text-xs text-gray-300 cursor-pointer focus:outline-none focus:border-blue-500/50">
                            <option value="English">🇬🇧 English</option><option value="Hindi">🇮🇳 Hindi</option><option value="Tamil">🇮🇳 Tamil</option><option value="Telugu">🇮🇳 Telugu</option><option value="Marathi">🇮🇳 Marathi</option>
                        </select>
                        <button onClick={generateQuiz} className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Quiz</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {messages.length === 0 && concept && (
                        <div className="text-center py-10">
                            <Sparkles className="w-10 h-10 text-blue-500/50 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Ask about <span className="text-blue-400">{concept.name}</span></p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {[`Explain ${concept.name} simply`, `Give me an example`, `Why is this important?`].map((q) => (
                                    <button key={q} onClick={() => sendMessage(q)} className="suggestion-chip">{q}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-[var(--vm-bg-card)] text-gray-300 rounded-bl-md border border-[var(--vm-border)]"}`}>
                                {msg.role === "assistant" ? (<div className="markdown-content prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content || "..."}</ReactMarkdown></div>) : (<p>{msg.content}</p>)}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                        <div className="flex justify-start"><div className="bg-[var(--vm-bg-card)] rounded-2xl px-4 py-3 border border-[var(--vm-border)]"><div className="flex gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></div></div></div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {showQuiz && quiz?.questions[currentQ] && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-5 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-amber-400 text-xs font-medium mb-2">Q{currentQ + 1}/{quiz.questions.length}</p>
                        <p className="text-white text-sm mb-3">{quiz.questions[currentQ].question}</p>
                        <div className="space-y-2">
                            {quiz.questions[currentQ].options.map((opt, i) => (
                                <button key={i} onClick={() => { if (quizAnswered !== null) return; setQuizAnswered(i); if (conceptId) recordResponse(conceptId, i === quiz.questions[currentQ].correctIndex); }} disabled={quizAnswered !== null} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${quizAnswered === null ? "bg-white/5 text-gray-300 hover:bg-white/10" : i === quiz.questions[currentQ].correctIndex ? "bg-emerald-500/20 text-emerald-400" : i === quizAnswered ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-500"}`}>{String.fromCharCode(65 + i)}. {opt}</button>
                            ))}
                        </div>
                        {quizAnswered !== null && (<div className="mt-3"><p className="text-xs text-gray-400">{quiz.questions[currentQ].explanation}</p><button onClick={() => { if (currentQ < quiz.questions.length - 1) { setCurrentQ(p => p + 1); setQuizAnswered(null); } else setShowQuiz(false); }} className="mt-2 px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-xs">{currentQ < quiz.questions.length - 1 ? "Next →" : "Finish"}</button></div>)}
                    </motion.div>
                )}

                <div className="px-5 py-4 border-t border-[var(--vm-border)]">
                    <div className="flex items-end gap-3">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={concept ? `Ask about ${concept.name}...` : "Select a concept..."} disabled={!concept} rows={1} className="flex-1 bg-[var(--vm-bg-primary)] border border-[var(--vm-border)] rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500/50 disabled:opacity-50" style={{ minHeight: 44, maxHeight: 120 }} />
                        <button onClick={handleVoice} className={`p-3 rounded-xl border transition-all ${isRecording ? "bg-red-500/20 border-red-500/30 text-red-400" : "border-[var(--vm-border)] text-gray-500 hover:text-white"}`}>{isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                        <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50"><Send className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LearnPage() {
    return <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}><LearnContent /></Suspense>;
}
