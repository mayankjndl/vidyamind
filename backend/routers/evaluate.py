# ===== Rubric Evaluation API Route =====
# Endpoint: POST /api/ai/evaluate
#
# Evaluates student submissions (essays, code, lab reports) against
# rubric criteria using the LLM. Returns structured JSON scores.

import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from services.groq_client import chat_completion
from prompts.templates import PROMPTS, DEFAULT_RUBRICS

router = APIRouter()


@router.post("/api/ai/evaluate")
async def evaluate(request: Request):
    """
    Evaluate a student submission against rubric criteria.

    Request body:
        submission: The student's text/code submission (required)
        type:       "essay" | "code" | "lab"
        rubric:     Optional custom rubric (list of criteria)
        problem:    Problem statement (for code type)
        language:   Programming language (for code type)

    Response:
        JSON with criteria scores, overall feedback, strengths, improvements.
    """
    try:
        body = await request.json()
        submission = body.get("submission")
        eval_type = body.get("type", "essay")
        rubric = body.get("rubric")
        problem = body.get("problem", "Not specified")
        language = body.get("language", "Not specified")

        # Validate required field
        if not submission:
            return JSONResponse(
                {"error": "Submission is required"},
                status_code=400,
            )

        # Build the prompt based on submission type
        if eval_type == "code":
            prompt = (
                PROMPTS["CODE_EVALUATION"]
                .replace("{problem}", problem)
                .replace("{language}", language)
                + submission
            )
        else:
            # Use custom rubric or fall back to defaults
            rubric_str = json.dumps(rubric) if rubric else json.dumps(
                DEFAULT_RUBRICS.get("labReport" if eval_type == "lab" else "essay")
            )
            prompt = (
                PROMPTS["RUBRIC_EVALUATION"]
                .replace("{type}", eval_type)
                .replace("{rubric}", rubric_str)
                + submission
            )

        # Call the LLM
        response = chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert academic evaluator. Respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            json_mode=True,
            temperature=0.3,
            max_tokens=3000,
        )

        result = json.loads(response)
        return JSONResponse(result)

    except Exception as e:
        print(f"Evaluation error: {e}")
        return JSONResponse(
            {"error": "Evaluation failed"},
            status_code=500,
        )
