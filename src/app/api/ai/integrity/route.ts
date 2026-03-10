// ===== Integrity Check API Route =====
import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/groq";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const prompt = PROMPTS.ORIGINALITY_CHECK + text;

        const response = await chatCompletion(
            [
                {
                    role: "system",
                    content: "You are an academic integrity analyst. Be constructive and helpful, never punitive. Respond with valid JSON only.",
                },
                { role: "user", content: prompt },
            ],
            { jsonMode: true, temperature: 0.3, maxTokens: 2000 }
        );

        const result = JSON.parse(response);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Integrity check error:", error);
        return NextResponse.json(
            { error: "Integrity check failed" },
            { status: 500 }
        );
    }
}
