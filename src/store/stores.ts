// ===== Zustand Stores =====
// Central state management for VidyaMind

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    KnowledgeGraph,
    ConceptMastery,
    MasteryState,
    ChatMessage,
    EvaluationResult,
    IntegrityReport,
} from "@/lib/knowledge-graph/types";
import { updateMastery } from "@/lib/mastery/bkt";
import { scheduleReview } from "@/lib/mastery/spaced-repetition";

// ===== Knowledge Graph Store =====
interface KGStore {
    knowledgeGraph: KnowledgeGraph | null;
    forExamId: string | null; // tracks which exam this KG was generated for
    isGenerating: boolean;
    error: string | null;
    setKnowledgeGraph: (kg: KnowledgeGraph, examId?: string) => void;
    setGenerating: (val: boolean) => void;
    setError: (err: string | null) => void;
    reset: () => void;
}

export const useKGStore = create<KGStore>()(
    persist(
        (set) => ({
            knowledgeGraph: null,
            forExamId: null,
            isGenerating: false,
            error: null,
            setKnowledgeGraph: (kg, examId) => set({ knowledgeGraph: kg, forExamId: examId || null, isGenerating: false, error: null }),
            setGenerating: (val) => set({ isGenerating: val }),
            setError: (err) => set({ error: err, isGenerating: false }),
            reset: () => set({ knowledgeGraph: null, forExamId: null, isGenerating: false, error: null }),
        }),
        { name: "vidyamind-kg" }
    )
);

// ===== Mastery Store =====
interface MasteryStore {
    mastery: MasteryState;
    examDate: string | null;
    setExamDate: (date: string | null) => void;
    initializeConcepts: (conceptIds: string[]) => void;
    recordResponse: (conceptId: string, correct: boolean) => void;
    getMastery: (conceptId: string) => number;
    getExamReadiness: () => number;
    resetMastery: () => void;
}

export const useMasteryStore = create<MasteryStore>()(
    persist(
        (set, get) => ({
            mastery: {},
            examDate: null,
            setExamDate: (date) => set({ examDate: date }),
            initializeConcepts: (conceptIds) => {
                const current = get().mastery;
                const updated = { ...current };
                for (const id of conceptIds) {
                    if (!updated[id]) {
                        updated[id] = {
                            conceptId: id,
                            mastery: 0.1, // BKT P(L0)
                            lastPracticed: null,
                            totalAttempts: 0,
                            correctAttempts: 0,
                            interval: 1,
                            easeFactor: 2.5,
                            nextReviewDate: null,
                        };
                    }
                }
                set({ mastery: updated });
            },
            recordResponse: (conceptId, correct) => {
                const state = get();
                const current = state.mastery[conceptId] || {
                    conceptId,
                    mastery: 0.1,
                    lastPracticed: null,
                    totalAttempts: 0,
                    correctAttempts: 0,
                    interval: 1,
                    easeFactor: 2.5,
                    nextReviewDate: null,
                };

                const newMasteryValue = updateMastery(current.mastery, correct);
                const schedule = scheduleReview(current, newMasteryValue, state.examDate);

                const updated: ConceptMastery = {
                    ...current,
                    mastery: newMasteryValue,
                    lastPracticed: new Date().toISOString(),
                    totalAttempts: current.totalAttempts + 1,
                    correctAttempts: current.correctAttempts + (correct ? 1 : 0),
                    ...schedule,
                };

                set({
                    mastery: { ...state.mastery, [conceptId]: updated },
                });
            },
            getMastery: (conceptId) => {
                return get().mastery[conceptId]?.mastery || 0;
            },
            getExamReadiness: () => {
                const { mastery } = get();
                const entries = Object.values(mastery);
                if (entries.length === 0) return 0;
                const avg = entries.reduce((sum, cm) => sum + cm.mastery, 0) / entries.length;
                return Math.round(avg * 100);
            },
            resetMastery: () => set({ mastery: {} }),
        }),
        { name: "vidyamind-mastery" }
    )
);

// ===== Chat Store =====
interface ChatStore {
    messages: ChatMessage[];
    currentConceptId: string | null;
    isLoading: boolean;
    language: string;
    setLanguage: (lang: string) => void;
    setCurrentConcept: (id: string | null) => void;
    addMessage: (msg: ChatMessage) => void;
    setLoading: (val: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
    messages: [],
    currentConceptId: null,
    isLoading: false,
    language: "English",
    setLanguage: (lang) => set({ language: lang }),
    setCurrentConcept: (id) => set({ currentConceptId: id, messages: [] }),
    addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
    setLoading: (val) => set({ isLoading: val }),
    clearMessages: () => set({ messages: [] }),
}));

// ===== Evaluation Store =====
interface EvalStore {
    lastResult: EvaluationResult | null;
    lastIntegrity: IntegrityReport | null;
    isEvaluating: boolean;
    setResult: (result: EvaluationResult) => void;
    setIntegrity: (report: IntegrityReport) => void;
    setEvaluating: (val: boolean) => void;
    reset: () => void;
}

export const useEvalStore = create<EvalStore>()((set) => ({
    lastResult: null,
    lastIntegrity: null,
    isEvaluating: false,
    setResult: (result) => set({ lastResult: result }),
    setIntegrity: (report) => set({ lastIntegrity: report }),
    setEvaluating: (val) => set({ isEvaluating: val }),
    reset: () => set({ lastResult: null, lastIntegrity: null, isEvaluating: false }),
}));

// ===== Study Plan Store =====
import {
    FullStudyPlan,
    TaskStatus,
} from "@/lib/knowledge-graph/types";

interface PlanStore {
    studyPlan: FullStudyPlan | null;
    isGenerating: boolean;
    setPlan: (plan: FullStudyPlan) => void;
    setGenerating: (val: boolean) => void;
    // Update the status of a specific session within the plan hierarchy
    updateSessionStatus: (
        monthIdx: number,
        weekIdx: number,
        dayIdx: number,
        sessionIdx: number,
        status: TaskStatus,
    ) => void;
    reset: () => void;
}

export const usePlanStore = create<PlanStore>()(
    persist(
        (set, get) => ({
            studyPlan: null,
            isGenerating: false,
            setPlan: (plan) => set({ studyPlan: plan, isGenerating: false }),
            setGenerating: (val) => set({ isGenerating: val }),
            updateSessionStatus: (monthIdx, weekIdx, dayIdx, sessionIdx, status) => {
                const plan = get().studyPlan;
                if (!plan) return;

                // Deep clone the months array to avoid mutation
                const months = plan.months.map((m, mi) => {
                    if (mi !== monthIdx) return m;
                    return {
                        ...m,
                        weeks: m.weeks.map((w, wi) => {
                            if (wi !== weekIdx) return w;
                            return {
                                ...w,
                                days: w.days.map((d, di) => {
                                    if (di !== dayIdx) return d;
                                    return {
                                        ...d,
                                        sessions: d.sessions.map((s, si) => {
                                            if (si !== sessionIdx) return s;
                                            return { ...s, status };
                                        }),
                                    };
                                }),
                            };
                        }),
                    };
                });

                set({ studyPlan: { ...plan, months } });
            },
            reset: () => set({ studyPlan: null, isGenerating: false }),
        }),
        { name: "vidyamind-plan" }
    )
);
