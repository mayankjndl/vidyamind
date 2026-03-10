// ===== Quiz Generation API Route =====
import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/groq";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { concept, difficulty, mastery } = body;

        if (!concept) {
            return NextResponse.json({ error: "Concept is required" }, { status: 400 });
        }

        const prompt = PROMPTS.GENERATE_QUIZ
            .replace("{concept}", concept)
            .replace("{difficulty}", String(difficulty || 5))
            .replace("{mastery}", String(mastery || 0.1));

        const response = await chatCompletion(
            [
                {
                    role: "system",
                    content: "You are an expert quiz generator. Respond with valid JSON only.",
                },
                { role: "user", content: prompt },
            ],
            { jsonMode: true, temperature: 0.5, maxTokens: 2000 }
        );

        const result = JSON.parse(response);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Quiz generation error:", error);
        return NextResponse.json(
            { error: "Quiz generation failed" },
            { status: 500 }
        );
    }
}
