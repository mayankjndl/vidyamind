// ===== Knowledge Graph Types =====

export interface Concept {
    id: string;
    name: string;
    description: string;
    difficulty: number; // 1-10
    bloomLevel: BloomLevel;
    prerequisites: string[]; // concept IDs
}

export type BloomLevel =
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";

export interface KnowledgeGraph {
    id: string;
    subject: string;
    concepts: Concept[];
    createdAt: string;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: "prerequisite";
}

// For react-force-graph
export interface GraphNode {
    id: string;
    name: string;
    description: string;
    difficulty: number;
    bloomLevel: BloomLevel;
    mastery: number; // 0-1
    val: number; // node size
    color: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphEdge[];
}

// ===== Mastery Types =====

export interface ConceptMastery {
    conceptId: string;
    mastery: number; // 0-1, BKT P(L)
    lastPracticed: string | null;
    totalAttempts: number;
    correctAttempts: number;
    // SM-2 spaced repetition
    interval: number; // days until next review
    easeFactor: number;
    nextReviewDate: string | null;
}

export interface MasteryState {
    [conceptId: string]: ConceptMastery;
}

// ===== Quiz Types =====

export interface QuizQuestion {
    id: string;
    type: "mcq" | "short_answer" | "code";
    question: string;
    options?: string[];
    correctIndex?: number;
    explanation: string;
    difficulty: number;
    hint: string;
}

export interface QuizResponse {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
    timeSpent: number; // seconds
}

// ===== Evaluation Types =====

export interface RubricCriterion {
    name: string;
    weight: number;
    description: string;
}

export interface CriterionScore {
    name: string;
    score: number;
    maxScore: number;
    evidence: string;
    suggestion: string;
}

export interface EvaluationResult {
    criteria: CriterionScore[];
    overallScore: number;
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    optimizedVersion?: string;
}

// ===== Integrity Types =====

export interface IntegrityReport {
    originalityScore: number;
    analysis: {
        aiGeneratedRisk: "low" | "medium" | "high";
        styleConsistency: "consistent" | "some_variation" | "significant_variation";
        citationNeeded: Array<{ text: string; reason: string }>;
    };
    suggestions: string[];
    overallNote: string;
}

// ===== Study Plan Types =====

// Status for each study session task
export type TaskStatus = "pending" | "completed" | "revision" | "missed";

export interface StudySession {
    concept: string;
    duration: number; // minutes
    activity: "review" | "practice" | "deep_study" | "quiz";
    reason: string;
}

// A session with tracking status
export interface TrackedSession extends StudySession {
    status: TaskStatus;
}

// A single day in the plan with tracked sessions
export interface TrackedDayPlan {
    day: number;         // global day index (1-indexed)
    date: string;        // "YYYY-MM-DD"
    sessions: TrackedSession[];
}

// A week containing multiple days
export interface WeekPlan {
    weekLabel: string;   // "Week 1", "Week 2", etc.
    weekIndex: number;   // 0-indexed within month
    days: TrackedDayPlan[];
}

// A month containing multiple weeks
export interface MonthPlan {
    monthLabel: string;  // "March 2026"
    monthIndex: number;  // 0-indexed
    weeks: WeekPlan[];
}

// The complete study plan with hierarchy
export interface FullStudyPlan {
    months: MonthPlan[];
    startDate: string;
    endDate: string;
    totalDays: number;
    hoursPerDay: number;
    predictedFinalReadiness: number;
    honestAssessment: string;
    tips: string[];
}

// Legacy alias (used by old code paths)
export interface DayPlan {
    day: number;
    date: string;
    sessions: StudySession[];
    predictedReadinessAfter: number;
}

export interface StudyPlan {
    plan: DayPlan[];
    tips: string[];
    predictedFinalReadiness: number;
    honestAssessment?: string;
    daysUntilExam?: number;
    weeklyOverview?: Array<{
        week: number;
        focus: string;
        strategy: string;
        topics: string[];
    }>;
}

// ===== Chat Types =====

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    conceptId?: string;
    language?: string;
}
