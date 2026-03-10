// ===== Rubric Evaluation API Route =====
import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/groq";
import { PROMPTS, DEFAULT_RUBRICS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { submission, type, rubric, problem, language } = body;

        if (!submission) {
            return NextResponse.json({ error: "Submission is required" }, { status: 400 });
        }

        let prompt: string;

        if (type === "code") {
            prompt = PROMPTS.CODE_EVALUATION
                .replace("{problem}", problem || "Not specified")
                .replace("{language}", language || "Not specified")
                + submission;
        } else {
            const rubricStr = rubric
                ? JSON.stringify(rubric)
                : JSON.stringify(
                    type === "lab"
                        ? DEFAULT_RUBRICS.labReport
                        : DEFAULT_RUBRICS.essay
                );
            prompt = PROMPTS.RUBRIC_EVALUATION
                .replace("{type}", type || "essay")
                .replace("{rubric}", rubricStr)
                + submission;
        }

        const response = await chatCompletion(
            [
                {
                    role: "system",
                    content: "You are an expert academic evaluator. Respond with valid JSON only.",
                },
                { role: "user", content: prompt },
            ],
            { jsonMode: true, temperature: 0.3, maxTokens: 3000 }
        );

        const result = JSON.parse(response);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Evaluation error:", error);
        return NextResponse.json(
            { error: "Evaluation failed" },
            { status: 500 }
        );
    }
}
