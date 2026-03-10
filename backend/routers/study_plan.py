# ===== Study Plan Generation API Route =====
# Endpoint: POST /api/ai/study-plan
#
# Creates an optimal daily study plan based on mastery data,
# exam date, and available study hours.

import json
from datetime import datetime, date

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from services.groq_client import chat_completion
from prompts.templates import PROMPTS

router = APIRouter()


@router.post("/api/ai/study-plan")
async def generate_study_plan(request: Request):
    """
    Generate a personalized study plan.

    Request body:
        masteryData: Dict of concept mastery levels
        examDate:    Exam date in ISO format (or "Not set")
        hoursPerDay: Available study hours per day (default 4)
        weakAreas:   List of weak concept names

    Response:
        JSON with plan[], tips[], predictedFinalReadiness, honestAssessment.
    """
    try:
        body = await request.json()
        mastery_data = body.get("masteryData", {})
        exam_date_str = body.get("examDate", "Not set")
        hours_per_day = body.get("hoursPerDay", 4)
        weak_areas = body.get("weakAreas", [])

        # Calculate days until exam so the LLM knows the exact timeline
        days_until_exam = 30  # default if date parsing fails
        try:
            exam_dt = datetime.fromisoformat(exam_date_str.replace("Z", ""))
            delta = exam_dt.date() - date.today()
            days_until_exam = max(1, delta.days)
        except Exception:
            pass

        # Determine plan format based on timeline length
        # Short (≤14 days): day-by-day plan
        # Medium (15-60 days): plan first 7 days + weekly overview for remaining
        # Long (>60 days): plan first 7 days + monthly phases
        if days_until_exam <= 14:
            plan_days = days_until_exam
            plan_instruction = f"Generate a detailed day-by-day plan for ALL {plan_days} days."
        elif days_until_exam <= 60:
            plan_days = days_until_exam
            weeks = days_until_exam // 7
            plan_instruction = (
                f"There are {days_until_exam} days until the exam ({weeks} weeks).\n"
                f"Generate a detailed plan for the first 7 days, then provide a weekly \n"
                f"overview for the remaining {weeks - 1} weeks (each week as a single \n"
                f"entry with key focus areas and expected readiness)."
            )
        else:
            plan_days = days_until_exam
            months = days_until_exam // 30
            plan_instruction = (
                f"There are {days_until_exam} days until the exam (~{months} months).\n"
                f"Generate a detailed plan for the first 7 days, then provide monthly \n"
                f"phase summaries for the remaining time (each month as an entry with \n"
                f"focus subjects, strategy, and expected readiness progression)."
            )

        # Calculate total study hours and session constraint
        total_minutes_per_day = hours_per_day * 60
        sessions_per_day = total_minutes_per_day // 45  # ~45 min per session

        # Build the prompt from template with extra constraints
        prompt = (
            PROMPTS["STUDY_PLAN"]
            .replace("{masteryData}", json.dumps(mastery_data))
            .replace("{examDate}", exam_date_str)
            .replace("{hoursPerDay}", str(hours_per_day))
            .replace("{weakAreas}", json.dumps(weak_areas))
        )

        # Append explicit constraints about days and hours
        prompt += (
            f"\n\n=== HARD CONSTRAINTS (DO NOT IGNORE) ===\n"
            f"- DAYS UNTIL EXAM: {days_until_exam} days (from today {date.today().isoformat()} to {exam_date_str})\n"
            f"- {plan_instruction}\n"
            f"- HOURS PER DAY: {hours_per_day} hours = {total_minutes_per_day} minutes\n"
            f"- Each day MUST have enough sessions to FILL {total_minutes_per_day} minutes total.\n"
            f"  That means approximately {sessions_per_day} sessions of 45 minutes each per day.\n"
            f"  DO NOT generate only 2-3 sessions when {sessions_per_day} are needed.\n"
            f"- The predictedReadinessAfter for each day must INCREASE monotonically.\n"
            f"- predictedFinalReadiness must reflect {days_until_exam} days of study, not just 7.\n"
        )

        # Call the LLM
        response = chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert study planner using spaced repetition science. "
                        "Respond with valid JSON only. "
                        "You must respect the HOURS PER DAY and DAYS UNTIL EXAM constraints exactly."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            json_mode=True,
            temperature=0.4,
            max_tokens=4096,
        )

        result = json.loads(response)
        return JSONResponse(result)

    except Exception as e:
        print(f"Study plan error: {e}")
        return JSONResponse(
            {"error": "Study plan generation failed"},
            status_code=500,
        )
