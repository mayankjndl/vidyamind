# ===== Knowledge Graph Generation API Route =====
# Endpoint: POST /api/ai/generate-kg
#
# Accepts raw syllabus/textbook text and returns a structured
# knowledge graph with concepts and prerequisite relationships.

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from algorithms.kg_builder import build_knowledge_graph

router = APIRouter()


@router.post("/api/ai/generate-kg")
async def generate_kg(request: Request):
    """
    Generate a knowledge graph from educational text.

    Request body:
        text:    Raw syllabus or textbook content (required, string)
        subject: Optional subject name override

    Response:
        JSON knowledge graph with id, subject, concepts[], createdAt.
    """
    try:
        body = await request.json()
        text = body.get("text")
        subject = body.get("subject")

        # Validate required field
        if not text or not isinstance(text, str):
            return JSONResponse(
                {"error": "Text content is required"},
                status_code=400,
            )

        # Build the knowledge graph (calls LLM internally)
        kg = build_knowledge_graph(text, subject)
        return JSONResponse(kg)

    except Exception as e:
        print(f"KG generation error: {e}")
        return JSONResponse(
            {"error": "Failed to generate knowledge graph"},
            status_code=500,
        )
