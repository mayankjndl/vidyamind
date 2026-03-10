# ===== Groq API Client =====
# Wrapper around the Groq Python SDK for LLM calls.
# Provides two functions: chat_completion (full response) and stream_chat_completion (SSE).

import os
from typing import Optional
from groq import Groq

# ---------------------------------------------------------------------------
# Initialize the Groq client with the API key from environment variables
# ---------------------------------------------------------------------------
_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Default model used across the application
DEFAULT_MODEL = "llama-3.3-70b-versatile"


def chat_completion(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    json_mode: bool = False,
) -> str:
    """
    Send a chat completion request to Groq and return the full response text.

    Args:
        messages:    List of message dicts, each with 'role' and 'content'.
        model:       Which LLM to use (default: llama-3.3-70b-versatile).
        temperature: Sampling temperature (lower = more deterministic).
        max_tokens:  Maximum tokens in the response.
        json_mode:   If True, force the model to output valid JSON.

    Returns:
        The assistant's response as a plain string.
    """
    response = _client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"} if json_mode else None,
    )

    return response.choices[0].message.content or ""


def stream_chat_completion(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
):
    """
    Send a streaming chat completion request to Groq.

    Yields chunks from the Groq SDK stream — each chunk has
    chunk.choices[0].delta.content (may be None for empty chunks).

    Usage:
        for chunk in stream_chat_completion(messages):
            text = chunk.choices[0].delta.content
            if text:
                ...  # send to client
    """
    stream = _client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )

    return stream
