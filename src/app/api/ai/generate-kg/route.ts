// ===== Knowledge Graph Generation API Route =====
import { NextRequest, NextResponse } from "next/server";
import { buildKnowledgeGraph } from "@/lib/knowledge-graph/builder";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, subject } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text content is required" },
                { status: 400 }
            );
        }

        const kg = await buildKnowledgeGraph(text, subject);
        return NextResponse.json(kg);
    } catch (error) {
        console.error("KG generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate knowledge graph" },
            { status: 500 }
        );
    }
}
