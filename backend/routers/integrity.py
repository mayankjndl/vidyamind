# ===== Integrity Check API Route =====
# Endpoint: POST /api/ai/integrity
#
# Analyzes student text for academic integrity concerns,
# framed as helpful suggestions rather than accusations.

import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from services.groq_client import chat_completion
from prompts.templates import PROMPTS

router = APIRouter()


@router.post("/api/ai/integrity")
async def integrity_check(request: Request):
    """
    Analyze text for academic integrity concerns.

    Request body:
        text: The student's submission text (required)

    Response:
        JSON with originalityScore, analysis, suggestions, overallNote.
    """
    try:
        body = await request.json()
        text = body.get("text")

        # Validate required field
        if not text:
            return JSONResponse(
                {"error": "Text is required"},
                status_code=400,
            )

        # Build the prompt
        prompt = PROMPTS["ORIGINALITY_CHECK"] + text

        # Call the LLM
        response = chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an academic integrity analyst. "
                        "Be constructive and helpful, never punitive. "
                        "Respond with valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            json_mode=True,
            temperature=0.3,
            max_tokens=2000,
        )

        result = json.loads(response)
        return JSONResponse(result)

    except Exception as e:
        print(f"Integrity check error: {e}")
        return JSONResponse(
            {"error": "Integrity check failed"},
            status_code=500,
        )
