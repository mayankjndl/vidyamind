# ===== Knowledge Graph Builder =====
# Pipeline: Text → Groq LLM Extraction → Validated Knowledge Graph
#
# Takes raw syllabus/textbook text, sends it to the LLM with an extraction
# prompt, then validates and cleans the output into a proper knowledge graph.

import json
import re
import time

from services.groq_client import chat_completion
from prompts.templates import PROMPTS
from algorithms.bkt import get_mastery_color


def build_knowledge_graph(text: str, subject: str | None = None) -> dict:
    """
    Build a knowledge graph from syllabus or textbook text.

    Steps:
    1. Send text (capped at 12k chars) to Groq with the extraction prompt.
    2. Parse the JSON response into a list of concepts.
    3. Validate: ensure all prerequisite IDs reference real concepts.
    4. Return a structured KnowledgeGraph dict.

    Args:
        text:    Raw educational content / syllabus text.
        subject: Optional subject name override.

    Returns:
        A dict with keys: id, subject, concepts, createdAt
    """
    # Prepare the prompt (cap text to avoid token overflow)
    prompt = PROMPTS["EXTRACT_KNOWLEDGE_GRAPH"] + text[:12_000]

    # Call Groq LLM
    response = chat_completion(
        messages=[
            {
                "role": "system",
                "content": "You are an expert curriculum designer. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        json_mode=True,
        temperature=0.3,
        max_tokens=4096,
    )

    # Parse the LLM output
    try:
        parsed = json.loads(response)
    except json.JSONDecodeError:
        raise ValueError("Failed to parse knowledge graph from AI response")

    # Normalize each concept
    raw_concepts = parsed.get("concepts", [])
    concepts = []
    for c in raw_concepts:
        concept_id = c.get("id") or _to_snake_case(c.get("name", ""))
        concepts.append({
            "id": concept_id,
            "name": c.get("name", ""),
            "description": c.get("description", ""),
            "difficulty": max(1, min(10, c.get("difficulty", 5))),
            "bloomLevel": c.get("bloomLevel", "understand"),
            "prerequisites": c.get("prerequisites", []) if isinstance(c.get("prerequisites"), list) else [],
        })

    # Validate: remove prerequisite IDs that don't match any concept
    valid_ids = {c["id"] for c in concepts}
    for concept in concepts:
        concept["prerequisites"] = [
            pid for pid in concept["prerequisites"]
            if pid in valid_ids
        ]

    return {
        "id": f"kg_{int(time.time() * 1000)}",
        "subject": parsed.get("subject") or subject or "General",
        "concepts": concepts,
        "createdAt": _iso_now(),
    }


def to_graph_data(kg: dict, mastery_map: dict | None = None) -> dict:
    """
    Convert a KnowledgeGraph dict to the format expected by react-force-graph.

    Args:
        kg:          A knowledge graph dict (from build_knowledge_graph).
        mastery_map: Optional dict of concept_id -> mastery (0-1).

    Returns:
        Dict with 'nodes' and 'links' lists.
    """
    mastery_map = mastery_map or {}

    nodes = []
    for concept in kg.get("concepts", []):
        mastery = mastery_map.get(concept["id"], 0)
        nodes.append({
            "id": concept["id"],
            "name": concept["name"],
            "description": concept["description"],
            "difficulty": concept["difficulty"],
            "bloomLevel": concept["bloomLevel"],
            "mastery": mastery,
            "val": max(2, concept["difficulty"] * 1.5),
            "color": get_mastery_color(mastery),
        })

    links = []
    for concept in kg.get("concepts", []):
        for prereq_id in concept.get("prerequisites", []):
            links.append({
                "source": prereq_id,
                "target": concept["id"],
                "type": "prerequisite",
            })

    return {"nodes": nodes, "links": links}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_snake_case(name: str) -> str:
    """Convert a human-readable name to snake_case."""
    cleaned = re.sub(r"[^a-z0-9]+", "_", name.lower())
    return cleaned.strip("_")


def _iso_now() -> str:
    """Return the current UTC time as an ISO 8601 string."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
