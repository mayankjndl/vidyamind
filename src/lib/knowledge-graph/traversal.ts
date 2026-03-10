// ===== Knowledge Graph Traversal =====
// BFS-based gap diagnosis for learning path optimization

import { Concept, KnowledgeGraph } from "./types";
import { ConceptMastery } from "./types";

/**
 * Find all unmastered prerequisites for a target concept.
 * Uses BFS backwards through prerequisite chain.
 * Returns concepts ordered: deepest prerequisites first.
 */
export function diagnoseGaps(
    kg: KnowledgeGraph,
    targetConceptId: string,
    masteryMap: Record<string, ConceptMastery>,
    masteryThreshold: number = 0.6
): Concept[] {
    const conceptMap = new Map(kg.concepts.map((c) => [c.id, c]));
    const gaps: Concept[] = [];
    const visited = new Set<string>();
    const queue: string[] = [targetConceptId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const concept = conceptMap.get(currentId);
        if (!concept) continue;

        // Check if this concept is unmastered
        const mastery = masteryMap[currentId]?.mastery || 0;
        if (mastery < masteryThreshold && currentId !== targetConceptId) {
            gaps.push(concept);
        }

        // Add prerequisites to queue
        for (const prereqId of concept.prerequisites) {
            if (!visited.has(prereqId)) {
                queue.push(prereqId);
            }
        }
    }

    // Return deepest prerequisites first (reverse BFS order)
    return gaps.reverse();
}

/**
 * Get the optimal learning path to a target concept.
 * Includes unmastered prerequisites in topological order.
 */
export function getLearningPath(
    kg: KnowledgeGraph,
    targetConceptId: string,
    masteryMap: Record<string, ConceptMastery>,
    masteryThreshold: number = 0.6
): Concept[] {
    const gaps = diagnoseGaps(kg, targetConceptId, masteryMap, masteryThreshold);
    const target = kg.concepts.find((c) => c.id === targetConceptId);

    if (target) {
        const targetMastery = masteryMap[targetConceptId]?.mastery || 0;
        if (targetMastery < masteryThreshold) {
            gaps.push(target);
        }
    }

    return gaps;
}

/**
 * Get concepts that depend on the given concept (downstream).
 */
export function getDependents(
    kg: KnowledgeGraph,
    conceptId: string
): Concept[] {
    return kg.concepts.filter((c) => c.prerequisites.includes(conceptId));
}

/**
 * Get immediate prerequisites for a concept.
 */
export function getPrerequisites(
    kg: KnowledgeGraph,
    conceptId: string
): Concept[] {
    const concept = kg.concepts.find((c) => c.id === conceptId);
    if (!concept) return [];

    return concept.prerequisites
        .map((pid) => kg.concepts.find((c) => c.id === pid))
        .filter(Boolean) as Concept[];
}

/**
 * Get suggested next concepts to study based on current mastery.
 * Finds concepts whose prerequisites are all mastered but the concept itself isn't.
 */
export function getSuggestedNext(
    kg: KnowledgeGraph,
    masteryMap: Record<string, ConceptMastery>,
    masteryThreshold: number = 0.6,
    limit: number = 5
): Concept[] {
    return kg.concepts
        .filter((concept) => {
            // Not yet mastered
            const mastery = masteryMap[concept.id]?.mastery || 0;
            if (mastery >= masteryThreshold) return false;

            // All prerequisites are mastered
            return concept.prerequisites.every(
                (pid) => (masteryMap[pid]?.mastery || 0) >= masteryThreshold
            );
        })
        .sort((a, b) => a.difficulty - b.difficulty) // easiest first
        .slice(0, limit);
}
