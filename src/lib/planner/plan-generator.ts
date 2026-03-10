// ===== Algorithmic Study Plan Generator =====
// Generates a full day-by-day study plan deterministically.
// No LLM needed — uses spaced repetition scheduling and topic prioritization.

import {
    TrackedSession,
    TrackedDayPlan,
    WeekPlan,
    MonthPlan,
    FullStudyPlan,
    TaskStatus,
} from "@/lib/knowledge-graph/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface TopicInfo {
    name: string;
    mastery: number; // 0-100
    subject: string;
}

export interface PlanConfig {
    topics: TopicInfo[];
    daysUntilExam: number;
    hoursPerDay: number;
    startDate: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_DURATION = 45; // minutes per session
const ACTIVITIES = ["deep_study", "practice", "review", "quiz"] as const;

// Spaced repetition intervals (in days) — when a topic should reappear
const REPEAT_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

/**
 * Generates a full day-by-day study plan and groups it into Month > Week > Day.
 * 
 * Algorithm:
 * 1. Sort topics by mastery (weakest first) to prioritize weak areas
 * 2. Assign each topic an initial "introduction day" evenly across the timeline
 * 3. Schedule spaced repetition reviews at increasing intervals
 * 4. Fill remaining slots with revision of random weak topics
 * 5. Group days into weeks and months
 */
export function generateFullPlan(config: PlanConfig): FullStudyPlan {
    const { topics, daysUntilExam, hoursPerDay, startDate } = config;
    const totalDays = Math.min(daysUntilExam, 180); // cap at 6 months
    const sessionsPerDay = Math.max(1, Math.floor((hoursPerDay * 60) / SESSION_DURATION));

    // Step 1: Sort topics by mastery (weakest first)
    const sortedTopics = [...topics].sort((a, b) => a.mastery - b.mastery);

    // Step 2: Create empty day slots
    const daySlots: TrackedSession[][] = Array.from({ length: totalDays }, () => []);

    // Step 3: Distribute topic introductions evenly across the timeline
    // Use first 60% of time for introductions, leave 40% for review/revision
    const introWindow = Math.max(1, Math.floor(totalDays * 0.6));
    const daysBetweenIntros = Math.max(1, Math.floor(introWindow / sortedTopics.length));

    sortedTopics.forEach((topic, idx) => {
        // Introduction day for this topic
        const introDay = Math.min(idx * daysBetweenIntros, totalDays - 1);

        // Schedule spaced repetition from introduction day
        REPEAT_INTERVALS.forEach((interval, repIdx) => {
            const scheduleDay = introDay + interval;
            if (scheduleDay >= totalDays) return;

            // Determine activity based on repetition number
            const activity = ACTIVITIES[Math.min(repIdx, ACTIVITIES.length - 1)];

            // Determine reason based on activity and topic mastery
            let reason: string;
            if (repIdx === 0) {
                reason = topic.mastery < 30
                    ? "Weak area, foundational concept"
                    : "Building knowledge base";
            } else if (activity === "practice") {
                reason = "Reinforce through practice problems";
            } else if (activity === "review") {
                reason = "Spaced repetition review for retention";
            } else {
                reason = "Assessment to verify understanding";
            }

            daySlots[scheduleDay].push({
                concept: topic.name,
                duration: SESSION_DURATION,
                activity,
                reason,
                status: "pending" as TaskStatus,
            });
        });
    });

    // Step 4: Fill each day to the target session count
    // If a day has too many sessions, trim; if too few, add revision sessions
    const allDays: TrackedDayPlan[] = daySlots.map((sessions, dayIdx) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayIdx);
        const dateStr = date.toISOString().split("T")[0];

        // Trim if over capacity
        let daySessions = sessions.slice(0, sessionsPerDay);

        // Fill remaining slots with revision of weak topics
        while (daySessions.length < sessionsPerDay) {
            // Pick a weak topic that isn't already in today's sessions
            const todayConcepts = new Set(daySessions.map((s) => s.concept));
            const available = sortedTopics.filter((t) => !todayConcepts.has(t.name));
            const pick = available.length > 0
                ? available[dayIdx % available.length]
                : sortedTopics[dayIdx % sortedTopics.length];

            daySessions.push({
                concept: pick.name,
                duration: SESSION_DURATION,
                activity: pick.mastery < 30 ? "deep_study" : "review",
                reason: pick.mastery < 30
                    ? "Extra focus on weak area"
                    : "Revision to maintain retention",
                status: "pending" as TaskStatus,
            });
        }

        return {
            day: dayIdx + 1,
            date: dateStr,
            sessions: daySessions,
        };
    });

    // Step 5: Group into Month > Week > Day hierarchy
    const months = groupIntoHierarchy(allDays);

    // Step 6: Calculate readiness
    const readiness = calculateReadiness(topics.length, totalDays, hoursPerDay, topics);

    // Step 7: Generate honest assessment
    const totalHours = totalDays * hoursPerDay;
    const hoursNeeded = topics.length * 15;
    const coveragePercent = Math.min(100, Math.round((totalHours / hoursNeeded) * 100));

    let honestAssessment: string;
    if (readiness < 0.3) {
        honestAssessment = `With ${totalHours} total study hours across ${totalDays} days, you can cover roughly ${coveragePercent}% of the syllabus depth needed. Focus only on high-weight topics and past-year patterns.`;
    } else if (readiness < 0.6) {
        honestAssessment = `${totalHours} study hours over ${totalDays} days gives you moderate coverage (~${coveragePercent}% of ideal). Prioritize weak areas and use active recall over passive reading.`;
    } else {
        honestAssessment = `${totalHours} study hours over ${totalDays} days is a solid preparation window (~${coveragePercent}% of ideal depth). Consistency and spaced repetition will be key.`;
    }

    // Step 8: Generate tips
    const tips = generateTips(topics, totalDays, hoursPerDay);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays - 1);

    return {
        months,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalDays,
        hoursPerDay,
        predictedFinalReadiness: readiness,
        honestAssessment,
        tips,
    };
}

// ---------------------------------------------------------------------------
// Grouping: flat days → Month > Week > Day
// ---------------------------------------------------------------------------

function groupIntoHierarchy(allDays: TrackedDayPlan[]): MonthPlan[] {
    const monthMap = new Map<string, TrackedDayPlan[]>();

    // Group days by calendar month
    for (const day of allDays) {
        const d = new Date(day.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
        monthMap.get(monthKey)!.push(day);
    }

    // Convert to MonthPlan[]
    const months: MonthPlan[] = [];
    let monthIdx = 0;

    for (const [monthKey, days] of monthMap) {
        const [year, month] = monthKey.split("-");
        const monthDate = new Date(Number(year), Number(month) - 1, 1);
        const monthLabel = monthDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });

        // Group days within this month into weeks (7-day chunks)
        const weeks: WeekPlan[] = [];
        let weekDays: TrackedDayPlan[] = [];
        let weekIdx = 0;

        for (let i = 0; i < days.length; i++) {
            weekDays.push(days[i]);

            // Close the week every 7 days or at the end of the month
            if (weekDays.length === 7 || i === days.length - 1) {
                weeks.push({
                    weekLabel: `Week ${weekIdx + 1}`,
                    weekIndex: weekIdx,
                    days: weekDays,
                });
                weekDays = [];
                weekIdx++;
            }
        }

        months.push({
            monthLabel,
            monthIndex: monthIdx,
            weeks,
        });
        monthIdx++;
    }

    return months;
}

// ---------------------------------------------------------------------------
// Readiness calculation (deterministic, same model as before)
// ---------------------------------------------------------------------------

function calculateReadiness(
    totalTopics: number,
    totalDays: number,
    hoursPerDay: number,
    topics: TopicInfo[],
): number {
    const totalMastery = topics.reduce((sum, t) => sum + t.mastery / 100, 0);
    const startReadiness = totalMastery / Math.max(totalTopics, 1);

    const totalStudyHours = totalDays * hoursPerDay;
    const HOURS_PER_TOPIC_MASTERY = 15;
    const topicsCoverable = totalStudyHours / HOURS_PER_TOPIC_MASTERY;
    const coverageFraction = Math.min(topicsCoverable / totalTopics, 1.0);

    const k = 2.5;
    const effectiveCoverage = 1 - Math.exp(-k * coverageFraction);
    const MAX_READINESS = 0.92;
    const roomToGrow = MAX_READINESS - startReadiness;

    return Math.round(Math.min(MAX_READINESS, startReadiness + roomToGrow * effectiveCoverage) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Tip generation (deterministic, no LLM)
// ---------------------------------------------------------------------------

function generateTips(topics: TopicInfo[], totalDays: number, hoursPerDay: number): string[] {
    const tips: string[] = [];
    const weakTopics = topics.filter((t) => t.mastery < 30);
    const totalHours = totalDays * hoursPerDay;

    if (totalDays <= 7) {
        tips.push("With very limited time, focus only on the most frequently tested topics from past exams.");
        tips.push("Use active recall (self-quizzing) instead of passive reading — it's 2-3x more effective.");
    } else if (totalDays <= 30) {
        tips.push("You have about a month — dedicate the first 60% to learning new topics and the last 40% to revision.");
        tips.push("Use the Pomodoro technique (25 min study, 5 min break) to maintain focus during long sessions.");
    } else {
        tips.push("With ample preparation time, aim for deep understanding rather than memorization.");
        tips.push("Schedule regular mock tests (every 2 weeks) to identify gaps early.");
    }

    if (weakTopics.length > 0) {
        const weakNames = weakTopics.slice(0, 3).map((t) => t.name).join(", ");
        tips.push(`Your weakest areas are: ${weakNames}. These are prioritized early in your plan.`);
    }

    if (hoursPerDay >= 6) {
        tips.push("With 6+ hours of daily study, take a 15-min break every 90 minutes to prevent burnout.");
    }

    tips.push("Mark completed sessions as you go — tracking progress boosts motivation and keeps you accountable.");

    return tips;
}
