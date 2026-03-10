// ===== Study Plan Generation API Route =====
// The LLM generates the schedule (sessions, tips). Readiness scores are
// calculated DETERMINISTICALLY by the server using real math, never by the LLM.

import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/groq";
import { PROMPTS } from "@/lib/ai/prompts";

// ---------------------------------------------------------------------------
// Deterministic readiness model
// ---------------------------------------------------------------------------

function calculateReadiness(
    masteryData: Array<{ concept: string; mastery: number }>,
    totalTopicsInExam: number,
    daysUntilExam: number,
    hoursPerDay: number,
): { startReadiness: number; finalReadiness: number; dailyReadiness: number[] } {
    // Step 1: Current readiness = average mastery across all exam topics
    // Topics not yet studied count as 0% mastery
    const totalMastery = masteryData.reduce((sum, m) => sum + (m.mastery / 100), 0);
    const startReadiness = totalMastery / Math.max(totalTopicsInExam, 1);

    // Step 2: Calculate how much study can realistically improve readiness
    const totalStudyHours = daysUntilExam * hoursPerDay;

    // Average hours needed to deeply master one topic (research-based estimate)
    const HOURS_PER_TOPIC_MASTERY = 15;

    // How many topics can be meaningfully covered in the available time
    const topicsCoverable = totalStudyHours / HOURS_PER_TOPIC_MASTERY;

    // Fraction of syllabus that can be covered (capped at 1.0)
    const coverageFraction = Math.min(topicsCoverable / totalTopicsInExam, 1.0);

    // Step 3: Apply diminishing returns (learning curve)
    // First few hours of study are most productive; returns diminish over time
    // Using logarithmic model: gain = maxPossible * (1 - e^(-k * coverage))
    const k = 2.5; // steepness — higher = faster initial gains
    const effectiveCoverage = 1 - Math.exp(-k * coverageFraction);

    // Maximum possible readiness (even with unlimited time, achieving >95% is rare)
    const MAX_READINESS = 0.92;

    // Final readiness = start + (room to grow × effective coverage)
    const roomToGrow = MAX_READINESS - startReadiness;
    const finalReadiness = Math.min(MAX_READINESS,
        startReadiness + roomToGrow * effectiveCoverage
    );

    // Step 4: Daily readiness progression (smooth curve from start to final)
    const planDays = Math.min(daysUntilExam, 14); // daily values for displayed days
    const dailyReadiness: number[] = [];
    for (let d = 1; d <= planDays; d++) {
        // Fraction of total study time completed by this day
        const dayFraction = d / daysUntilExam;
        // Apply same learning curve to daily progress
        const dayEffective = 1 - Math.exp(-k * coverageFraction * dayFraction);
        const dayReadiness = startReadiness + roomToGrow * dayEffective;
        dailyReadiness.push(Math.round(dayReadiness * 100) / 100);
    }

    return {
        startReadiness: Math.round(startReadiness * 100) / 100,
        finalReadiness: Math.round(finalReadiness * 100) / 100,
        dailyReadiness,
    };
}

// ---------------------------------------------------------------------------
// API handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { masteryData = [], examDate, hoursPerDay = 4, weakAreas = [] } = body;

        // Calculate exact days until exam
        let daysUntilExam = 30;
        try {
            const examDt = new Date(examDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            daysUntilExam = Math.max(1, Math.ceil((examDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        } catch { /* keep default */ }

        // Estimate total topics from mastery data or use a reasonable default
        const totalTopicsInExam = Math.max(masteryData.length, 20);

        // Calculate deterministic readiness
        const readiness = calculateReadiness(masteryData, totalTopicsInExam, daysUntilExam, hoursPerDay);

        // Determine plan format based on timeline
        let planInstruction: string;
        if (daysUntilExam <= 14) {
            planInstruction = `Generate a day-by-day plan for ALL ${daysUntilExam} days.`;
        } else if (daysUntilExam <= 60) {
            const weeks = Math.floor(daysUntilExam / 7);
            planInstruction = `There are ${daysUntilExam} days (${weeks} weeks). Generate detailed first 7 days, then weekly overview for remaining ${weeks - 1} weeks.`;
        } else {
            const months = Math.floor(daysUntilExam / 30);
            planInstruction = `There are ${daysUntilExam} days (~${months} months). Generate detailed first 7 days, then monthly phase summaries.`;
        }

        // Session constraints
        const totalMinutesPerDay = hoursPerDay * 60;
        const sessionsPerDay = Math.floor(totalMinutesPerDay / 45);
        const todayStr = new Date().toISOString().split("T")[0];

        // Build prompt — tell LLM NOT to generate readiness numbers (we'll override them)
        let prompt = PROMPTS.STUDY_PLAN
            .replace("{masteryData}", JSON.stringify(masteryData))
            .replace("{examDate}", examDate || "Not set")
            .replace("{hoursPerDay}", String(hoursPerDay))
            .replace("{weakAreas}", JSON.stringify(weakAreas));

        prompt += `\n\n=== HARD CONSTRAINTS ===
- DAYS UNTIL EXAM: ${daysUntilExam} days (from ${todayStr} to ${examDate})
- ${planInstruction}
- HOURS PER DAY: ${hoursPerDay} hours = ${totalMinutesPerDay} minutes
- Each day MUST have ~${sessionsPerDay} sessions of 45 min each to fill ${totalMinutesPerDay} minutes.
- DO NOT calculate readiness numbers — set all readiness values to 0.
- FOCUS on creating a smart SESSION SCHEDULE and useful TIPS.
${daysUntilExam > 14 ? `
- IMPORTANT: In addition to the "plan" array (first 7 detailed days), also include a
  "weeklyOverview" array for the remaining weeks. Each entry should be:
  { "week": 2, "focus": "Subject/area focus this week", "strategy": "Brief strategy description", "topics": ["topic1", "topic2", "topic3"] }
  Generate entries for ALL remaining weeks until the exam.` : ""}`;

        const response = await chatCompletion(
            [
                {
                    role: "system",
                    content: "You are an expert study planner. Respond with valid JSON only. Fill sessions to match the hours per day. Do NOT try to calculate readiness — set all readiness values to 0.",
                },
                { role: "user", content: prompt },
            ],
            { jsonMode: true, temperature: 0.4, maxTokens: 4096 }
        );

        const result = JSON.parse(response);

        // Override LLM readiness with our deterministic values
        result.predictedFinalReadiness = readiness.finalReadiness;
        if (result.plan && Array.isArray(result.plan)) {
            result.plan.forEach((day: { predictedReadinessAfter?: number }, i: number) => {
                day.predictedReadinessAfter = readiness.dailyReadiness[i] ?? readiness.finalReadiness;
            });
        }

        // Add metadata so frontend knows the timeline
        result.daysUntilExam = daysUntilExam;

        // Generate honest assessment based on real math
        const totalHours = daysUntilExam * hoursPerDay;
        const hoursNeeded = totalTopicsInExam * 15;
        const coveragePercent = Math.min(100, Math.round((totalHours / hoursNeeded) * 100));
        if (readiness.finalReadiness < 0.3) {
            result.honestAssessment = `With ${totalHours} total study hours across ${daysUntilExam} days, you can cover roughly ${coveragePercent}% of the syllabus depth needed. This timeline is very tight — focus only on high-weight topics and past-year patterns.`;
        } else if (readiness.finalReadiness < 0.6) {
            result.honestAssessment = `${totalHours} study hours over ${daysUntilExam} days gives you moderate coverage (~${coveragePercent}% of ideal). Prioritize weak areas and use active recall over passive reading.`;
        } else {
            result.honestAssessment = `${totalHours} study hours over ${daysUntilExam} days is a solid preparation window (~${coveragePercent}% of ideal depth). Consistency and spaced repetition will be key to retention.`;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Study plan error:", error);
        return NextResponse.json(
            { error: "Study plan generation failed" },
            { status: 500 }
        );
    }
}

