// ===== Socratic Tutor API Route (Streaming) =====
import { NextRequest } from "next/server";
import { streamChatCompletion, type Message } from "@/lib/ai/groq";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, concept, context, mastery, language } = body;

        const systemPrompt = PROMPTS.SOCRATIC_TUTOR
            .replace("{concept}", concept || "General")
            .replace("{context}", context || "")
            .replace("{mastery}", String(mastery || 0))
            .replace("{language}", language || "English");

        const allMessages: Message[] = [
            { role: "system", content: systemPrompt },
            ...(messages || []).map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ];

        const stream = await streamChatCompletion(allMessages, {
            temperature: 0.7,
            maxTokens: 2048,
        });

        // Convert Groq SDK stream to Web ReadableStream
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Tutor error:", error);
        return new Response(JSON.stringify({ error: "Tutor failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
