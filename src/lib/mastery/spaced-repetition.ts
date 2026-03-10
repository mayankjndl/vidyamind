// ===== Enhanced SM-2 Spaced Repetition =====
// Based on SuperMemo SM-2 with BKT integration and exam-date awareness

import { ConceptMastery } from "../knowledge-graph/types";

/**
 * Calculate the next review schedule after a practice session.
 * Integrates BKT mastery level with SM-2 interval calculation.
 */
export function scheduleReview(
    conceptMastery: ConceptMastery,
    newMastery: number,
    examDate?: string | null
): Pick<ConceptMastery, "interval" | "easeFactor" | "nextReviewDate"> {
    let interval = conceptMastery.interval || 1;
    let easeFactor = conceptMastery.easeFactor || 2.5;

    if (newMastery >= 0.85) {
        // Mastered — extend interval
        easeFactor = Math.max(1.3, easeFactor + 0.1);
        if (interval === 1) {
            interval = 3;
        } else if (interval <= 3) {
            interval = 7;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    } else if (newMastery >= 0.6) {
        // Proficient — maintain interval
        interval = Math.max(1, Math.round(interval * 1.0));
    } else if (newMastery >= 0.4) {
        // Learning — reduce interval
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        interval = Math.max(1, Math.round(interval * 0.7));
    } else {
        // Struggling — reset to daily
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        interval = 1;
    }

    // Exam-date compression: if exam is close, compress intervals
    if (examDate) {
        const daysToExam = Math.max(
            0,
            (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysToExam < interval) {
            interval = Math.max(1, Math.floor(daysToExam / 3));
        }
    }

    // Cap interval at 30 days for practical scheduling
    interval = Math.min(interval, 30);

    const nextReviewDate = new Date(
        Date.now() + interval * 24 * 60 * 60 * 1000
    ).toISOString();

    return { interval, easeFactor, nextReviewDate };
}

/**
 * Get concepts due for review today.
 */
export function getDueReviews(
    masteryMap: Record<string, ConceptMastery>
): ConceptMastery[] {
    const now = new Date();
    return Object.values(masteryMap)
        .filter((cm) => {
            if (!cm.nextReviewDate) return cm.totalAttempts > 0; // practiced but never scheduled
            return new Date(cm.nextReviewDate) <= now;
        })
        .sort((a, b) => a.mastery - b.mastery); // weakest first
}

/**
 * Get concepts that are weakest (for priority study).
 */
export function getWeakestConcepts(
    masteryMap: Record<string, ConceptMastery>,
    limit: number = 5
): ConceptMastery[] {
    return Object.values(masteryMap)
        .filter((cm) => cm.mastery < 0.7)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, limit);
}
