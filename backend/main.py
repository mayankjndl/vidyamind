# ===== VidyaMind Python Backend =====
# FastAPI application entry point.
#
# Start the server with:
#   cd backend
#   uvicorn main:app --reload --port 8000
#
# All routes are mounted under /api/ai/* to match the
# exact paths the Next.js frontend expects.

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load environment variables from .env file
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Add the backend directory to Python's module search path
# so that imports like 'from services.groq_client import ...' work correctly.
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Import all routers
# ---------------------------------------------------------------------------
from routers import tutor, evaluate, quiz, generate_kg, integrity, study_plan

# ---------------------------------------------------------------------------
# Create the FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="VidyaMind API",
    description="Python backend for VidyaMind — Cognitive Learning OS",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS middleware
# Allow the Next.js frontend (localhost:3000) to call this backend.
# In production, restrict 'origins' to your actual domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register all API routers
# ---------------------------------------------------------------------------
app.include_router(tutor.router)         # POST /api/ai/tutor
app.include_router(evaluate.router)      # POST /api/ai/evaluate
app.include_router(quiz.router)          # POST /api/ai/quiz
app.include_router(generate_kg.router)   # POST /api/ai/generate-kg
app.include_router(integrity.router)     # POST /api/ai/integrity
app.include_router(study_plan.router)    # POST /api/ai/study-plan


# ---------------------------------------------------------------------------
# Health check endpoint
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Simple health check to verify the backend is running."""
    return {"status": "ok", "service": "VidyaMind Python Backend"}
