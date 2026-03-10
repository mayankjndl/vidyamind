// ===== Bayesian Knowledge Tracing (BKT) =====
// Paper: Corbett & Anderson, 1994 — "Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge"

import { ConceptMastery } from "../knowledge-graph/types";

export interface BKTParams {
    pL0: number; // P(L0) - prior probability of knowing
    pT: number;  // P(T)  - probability of learning after practice
    pG: number;  // P(G)  - probability of guessing correctly
    pS: number;  // P(S)  - probability of slipping (knowing but wrong)
}

// Default BKT parameters (tuned for typical undergraduate content)
const DEFAULT_PARAMS: BKTParams = {
    pL0: 0.1,   // Low prior — assume mostly unknown
    pT: 0.3,    // Moderate learning rate
    pG: 0.25,   // 25% guess rate (4-option MCQ baseline)
    pS: 0.1,    // 10% slip rate
};

/**
 * Update mastery probability after observing a student response.
 * Uses standard BKT update equations.
 */
export function updateMastery(
    currentMastery: number,
    responseCorrect: boolean,
    params: BKTParams = DEFAULT_PARAMS
): number {
    const pL = currentMastery;

    let pLGivenObs: number;

    if (responseCorrect) {
        // P(L_n | correct) = P(correct|L_n) * P(L_n) / P(correct)
        const pCorrectGivenL = 1 - params.pS;
        const pCorrectGivenNotL = params.pG;
        const pCorrect = pCorrectGivenL * pL + pCorrectGivenNotL * (1 - pL);
        pLGivenObs = (pCorrectGivenL * pL) / pCorrect;
    } else {
        // P(L_n | incorrect) = P(incorrect|L_n) * P(L_n) / P(incorrect)
        const pIncorrectGivenL = params.pS;
        const pIncorrectGivenNotL = 1 - params.pG;
        const pIncorrect = pIncorrectGivenL * pL + pIncorrectGivenNotL * (1 - pL);
        pLGivenObs = (pIncorrectGivenL * pL) / pIncorrect;
    }

    // Apply learning: P(L_n+1) = P(L_n|obs) + (1 - P(L_n|obs)) * P(T)
    const newMastery = pLGivenObs + (1 - pLGivenObs) * params.pT;

    // Clamp to [0.01, 0.99] to avoid degenerate states
    return Math.max(0.01, Math.min(0.99, newMastery));
}

/**
 * Apply time-based mastery decay (forgetting curve).
 * Uses exponential decay: P(L, t) = P(L) * e^(-λt)
 * where λ is the decay rate and t is days since last practice.
 */
export function applyMasteryDecay(
    mastery: number,
    daysSinceLastPractice: number,
    decayRate: number = 0.05
): number {
    if (daysSinceLastPractice <= 0) return mastery;

    // Baseline minimum — even forgotten concepts retain some trace
    const baseline = 0.05;
    const decayed = baseline + (mastery - baseline) * Math.exp(-decayRate * daysSinceLastPractice);

    return Math.max(0.01, Math.min(0.99, decayed));
}

/**
 * Calculate exam readiness score.
 * Weighted average of mastery across concepts, weighted by difficulty/importance.
 */
export function calculateExamReadiness(
    masteryMap: Record<string, ConceptMastery>,
    conceptDifficulties: Record<string, number>
): number {
    const entries = Object.entries(masteryMap);
    if (entries.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [conceptId, cm] of entries) {
        const difficulty = conceptDifficulties[conceptId] || 5;
        // Higher difficulty concepts are weighted more
        const weight = difficulty / 10;

        // Apply decay if applicable
        let effectiveMastery = cm.mastery;
        if (cm.lastPracticed) {
            const daysSince = (Date.now() - new Date(cm.lastPracticed).getTime()) / (1000 * 60 * 60 * 24);
            effectiveMastery = applyMasteryDecay(cm.mastery, daysSince);
        }

        weightedSum += effectiveMastery * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
}

/**
 * Get mastery level label and color.
 */
export function getMasteryLevel(mastery: number): {
    label: string;
    color: string;
    bgColor: string;
} {
    if (mastery >= 0.85) return { label: "Mastered", color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.15)" };
    if (mastery >= 0.65) return { label: "Proficient", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.15)" };
    if (mastery >= 0.4) return { label: "Learning", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)" };
    if (mastery >= 0.15) return { label: "Struggling", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.15)" };
    return { label: "New", color: "#374151", bgColor: "rgba(55, 65, 81, 0.15)" };
}

/**
 * Get node color for knowledge graph visualization based on mastery.
 */
export function getMasteryColor(mastery: number): string {
    if (mastery >= 0.85) return "#06b6d4"; // cyan - mastered
    if (mastery >= 0.65) return "#10b981"; // emerald - proficient
    if (mastery >= 0.4) return "#f59e0b";  // amber - learning
    if (mastery >= 0.15) return "#ef4444"; // red - struggling
    return "#374151"; // gray - new
}
