# ===== Enhanced SM-2 Spaced Repetition =====
# Based on the SuperMemo SM-2 algorithm with BKT integration
# and exam-date-aware interval compression.

from datetime import datetime, timedelta


def schedule_review(
    current_interval: int,
    current_ease_factor: float,
    new_mastery: float,
    exam_date: str | None = None,
) -> dict:
    """
    Calculate the next review schedule after a practice session.

    Combines SM-2 interval logic with the student's BKT mastery level.
    If an exam date is approaching, intervals are compressed to ensure
    adequate coverage before the exam.

    Args:
        current_interval:    Days until the current review was due (default 1).
        current_ease_factor: SM-2 ease factor (default 2.5).
        new_mastery:         Updated BKT mastery level (0-1) after practice.
        exam_date:           Optional ISO date string for the upcoming exam.

    Returns:
        Dict with keys: interval, easeFactor, nextReviewDate
    """
    interval = current_interval or 1
    ease_factor = current_ease_factor or 2.5

    # ---- Adjust interval and ease factor based on mastery level ----

    if new_mastery >= 0.85:
        # Mastered — extend the review interval
        ease_factor = max(1.3, ease_factor + 0.1)
        if interval == 1:
            interval = 3
        elif interval <= 3:
            interval = 7
        else:
            interval = round(interval * ease_factor)

    elif new_mastery >= 0.6:
        # Proficient — maintain current interval
        interval = max(1, round(interval * 1.0))

    elif new_mastery >= 0.4:
        # Learning — shorten interval slightly
        ease_factor = max(1.3, ease_factor - 0.15)
        interval = max(1, round(interval * 0.7))

    else:
        # Struggling — reset to daily review
        ease_factor = max(1.3, ease_factor - 0.2)
        interval = 1

    # ---- Exam-date compression ----
    # If the exam is sooner than the interval, compress to fit
    if exam_date:
        try:
            exam_dt = datetime.fromisoformat(exam_date.replace("Z", "+00:00"))
            days_to_exam = max(0, (exam_dt - datetime.now(exam_dt.tzinfo)).total_seconds() / 86400)
            if days_to_exam < interval:
                interval = max(1, int(days_to_exam / 3))
        except (ValueError, TypeError):
            pass  # If date parsing fails, skip compression

    # Cap at 30 days
    interval = min(interval, 30)

    next_review_date = (datetime.utcnow() + timedelta(days=interval)).isoformat() + "Z"

    return {
        "interval": interval,
        "easeFactor": ease_factor,
        "nextReviewDate": next_review_date,
    }


def get_due_reviews(mastery_map: dict) -> list[dict]:
    """
    Get concepts that are due for review today.

    A concept is due if:
    - It has a nextReviewDate in the past, OR
    - It has been practiced at least once but was never scheduled.

    Returns:
        List of concept mastery dicts, sorted weakest-first.
    """
    now = datetime.utcnow()
    due = []

    for concept_id, cm in mastery_map.items():
        next_review = cm.get("nextReviewDate")
        if not next_review:
            # Practiced but never scheduled → due
            if cm.get("totalAttempts", 0) > 0:
                due.append(cm)
        else:
            try:
                review_dt = datetime.fromisoformat(next_review.replace("Z", "+00:00"))
                if review_dt <= now.replace(tzinfo=review_dt.tzinfo):
                    due.append(cm)
            except (ValueError, TypeError):
                pass

    # Sort by mastery ascending (weakest concepts first)
    due.sort(key=lambda c: c.get("mastery", 0))
    return due


def get_weakest_concepts(mastery_map: dict, limit: int = 5) -> list[dict]:
    """
    Get the weakest concepts that need priority study.

    Args:
        mastery_map: Dict of concept_id -> mastery data.
        limit:       Maximum number of concepts to return.

    Returns:
        List of up to `limit` concept mastery dicts, sorted weakest-first.
    """
    weak = [
        cm for cm in mastery_map.values()
        if cm.get("mastery", 0) < 0.7
    ]
    weak.sort(key=lambda c: c.get("mastery", 0))
    return weak[:limit]
