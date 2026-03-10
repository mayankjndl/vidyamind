// ===== Knowledge Graph Builder =====
// Pipeline: Text → Groq LLM Extraction → Structured Knowledge Graph

import { chatCompletion } from "../ai/groq";
import { PROMPTS } from "../ai/prompts";
import { Concept, KnowledgeGraph } from "./types";
import { getMasteryColor } from "../mastery/bkt";

/**
 * Build a knowledge graph from syllabus/textbook text.
 * Uses Groq (Llama 3.3 70B) to extract concepts and prerequisite relationships.
 */
export async function buildKnowledgeGraph(
    text: string,
    subject?: string
): Promise<KnowledgeGraph> {
    const prompt = PROMPTS.EXTRACT_KNOWLEDGE_GRAPH + text.slice(0, 12000); // Token limit safety

    const response = await chatCompletion(
        [
            {
                role: "system",
                content: "You are an expert curriculum designer. Always respond with valid JSON only.",
            },
            { role: "user", content: prompt },
        ],
        { jsonMode: true, temperature: 0.3, maxTokens: 4096 }
    );

    try {
        const parsed = JSON.parse(response);
        const concepts: Concept[] = (parsed.concepts || []).map((c: Concept) => ({
            id: c.id || c.name.toLowerCase().replace(/\s+/g, "_"),
            name: c.name,
            description: c.description || "",
            difficulty: Math.max(1, Math.min(10, c.difficulty || 5)),
            bloomLevel: c.bloomLevel || "understand",
            prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
        }));

        // Validate: remove prerequisite references that don't exist
        const conceptIds = new Set(concepts.map((c) => c.id));
        for (const concept of concepts) {
            concept.prerequisites = concept.prerequisites.filter((pid) =>
                conceptIds.has(pid)
            );
        }

        return {
            id: `kg_${Date.now()}`,
            subject: parsed.subject || subject || "General",
            concepts,
            createdAt: new Date().toISOString(),
        };
    } catch {
        throw new Error("Failed to parse knowledge graph from AI response");
    }
}

/**
 * Convert a KnowledgeGraph to the format expected by react-force-graph.
 */
export function toGraphData(
    kg: KnowledgeGraph,
    masteryMap: Record<string, number> = {}
) {
    const nodes = kg.concepts.map((concept) => {
        const mastery = masteryMap[concept.id] || 0;
        return {
            id: concept.id,
            name: concept.name,
            description: concept.description,
            difficulty: concept.difficulty,
            bloomLevel: concept.bloomLevel,
            mastery,
            val: Math.max(2, concept.difficulty * 1.5), // node size based on difficulty
            color: getMasteryColor(mastery),
        };
    });

    const links = kg.concepts.flatMap((concept) =>
        concept.prerequisites.map((prereqId) => ({
            source: prereqId,
            target: concept.id,
            type: "prerequisite" as const,
        }))
    );

    return { nodes, links };
}
