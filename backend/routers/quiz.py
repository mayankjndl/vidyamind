# ===== Quiz Generation API Route =====
# Endpoint: POST /api/ai/quiz
#
# Generates adaptive MCQ quiz questions for a given concept,
# adjusted to the student's mastery level.

import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from services.groq_client import chat_completion
from prompts.templates import PROMPTS

router = APIRouter()


@router.post("/api/ai/quiz")
async def generate_quiz(request: Request):
    """
    Generate adaptive quiz questions for a concept.

    Request body:
        concept:    The topic name (required, e.g. "Kinematics")
        difficulty: Target difficulty level (1-10, default 5)
        mastery:    Student's current mastery (0-1, default 0.1)

    Response:
        JSON with a "questions" array containing 3 MCQ questions.
    """
    try:
        body = await request.json()
        concept = body.get("concept")
        difficulty = body.get("difficulty", 5)
        mastery = body.get("mastery", 0.1)

        # Validate required field
        if not concept:
            return JSONResponse(
                {"error": "Concept is required"},
                status_code=400,
            )

        # Build the prompt from template
        prompt = (
            PROMPTS["GENERATE_QUIZ"]
            .replace("{concept}", concept)
            .replace("{difficulty}", str(difficulty))
            .replace("{mastery}", str(mastery))
        )

        # Call the LLM
        response = chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert quiz generator. Respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            json_mode=True,
            temperature=0.5,
            max_tokens=2000,
        )

        result = json.loads(response)
        return JSONResponse(result)

    except Exception as e:
        print(f"Quiz generation error: {e}")
        return JSONResponse(
            {"error": "Quiz generation failed"},
            status_code=500,
        )
