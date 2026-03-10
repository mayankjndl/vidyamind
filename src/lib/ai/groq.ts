import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function chatCompletion(
    messages: Message[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        jsonMode?: boolean;
    }
) {
    const response = await groq.chat.completions.create({
        model: options?.model || "llama-3.3-70b-versatile",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
    });

    return response.choices[0]?.message?.content || "";
}

export async function streamChatCompletion(
    messages: Message[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
) {
    const stream = await groq.chat.completions.create({
        model: options?.model || "llama-3.3-70b-versatile",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
    });

    return stream;
}

export { groq };
