# ===== Socratic Tutor API Route (SSE Streaming) =====
# Endpoint: POST /api/ai/tutor
#
# This is the only streaming endpoint. It uses Server-Sent Events (SSE)
# to deliver the AI tutor's response token-by-token, matching the
# exact format the frontend expects.

import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from services.groq_client import stream_chat_completion
from prompts.templates import PROMPTS

router = APIRouter()


@router.post("/api/ai/tutor")
async def tutor(request: Request):
    """
    Stream a Socratic tutor response to the student.

    Request body:
        messages:  List of prior chat messages [{role, content}, ...]
        concept:   The topic being studied (e.g. "Kinematics")
        context:   Additional context about the concept
        mastery:   Student's current mastery level (0-1)
        language:  Preferred language (default: English)

    Response:
        SSE stream with `data: {"content": "..."}` events,
        ending with `data: [DONE]`.
    """
    try:
        body = await request.json()
        messages = body.get("messages", [])
        concept = body.get("concept", "General")
        context = body.get("context", "")
        mastery = body.get("mastery", 0)
        language = body.get("language", "English")

        # Build the system prompt from template
        system_prompt = (
            PROMPTS["SOCRATIC_TUTOR"]
            .replace("{concept}", concept)
            .replace("{context}", context)
            .replace("{mastery}", str(mastery))
            .replace("{language}", language)
        )

        # Prepare the full message list (system + conversation history)
        all_messages = [
            {"role": "system", "content": system_prompt},
            *[{"role": m["role"], "content": m["content"]} for m in messages],
        ]

        # Get the streaming response from Groq
        stream = stream_chat_completion(
            all_messages,
            temperature=0.7,
            max_tokens=2048,
        )

        # Generator that yields SSE-formatted chunks
        async def event_stream():
            try:
                for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield f"data: {json.dumps({'content': content})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                print(f"Tutor streaming error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        print(f"Tutor error: {e}")
        return {"error": "Tutor failed"}, 500
