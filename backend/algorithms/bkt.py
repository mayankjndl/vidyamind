# ===== Bayesian Knowledge Tracing (BKT) =====
# Paper: Corbett & Anderson, 1994
# "Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge"
#
# This module implements the core BKT algorithm for estimating student mastery,
# plus time-based forgetting (exponential decay) and exam readiness scoring.

import math
from dataclasses import dataclass


# ---------------------------------------------------------------------------
# BKT parameters
# ---------------------------------------------------------------------------

@dataclass
class BKTParams:
    """Parameters for the Bayesian Knowledge Tracing model."""

    p_l0: float = 0.1    # P(L0)  — prior probability of already knowing
    p_t: float  = 0.3    # P(T)   — probability of learning after practice
    p_g: float  = 0.25   # P(G)   — probability of guessing correctly
    p_s: float  = 0.1    # P(S)   — probability of slipping (knows but wrong)


# Default parameters tuned for typical undergraduate content
DEFAULT_PARAMS = BKTParams()


# ---------------------------------------------------------------------------
# Core BKT update
# ---------------------------------------------------------------------------

def update_mastery(
    current_mastery: float,
    response_correct: bool,
    params: BKTParams = DEFAULT_PARAMS,
) -> float:
    """
    Update mastery probability after observing a student response.

    Uses the standard BKT update equations:
      - If correct:  P(L|correct) = P(correct|L) * P(L) / P(correct)
      - If incorrect: P(L|incorrect) = P(incorrect|L) * P(L) / P(incorrect)
    Then applies learning:  P(L_new) = P(L|obs) + (1 - P(L|obs)) * P(T)

    Args:
        current_mastery:  Current P(L) estimate, between 0 and 1.
        response_correct: Whether the student answered correctly.
        params:           BKT model parameters.

    Returns:
        Updated mastery probability, clamped to [0.01, 0.99].
    """
    p_l = current_mastery

    if response_correct:
        p_correct_given_l     = 1 - params.p_s
        p_correct_given_not_l = params.p_g
        p_correct = p_correct_given_l * p_l + p_correct_given_not_l * (1 - p_l)
        p_l_given_obs = (p_correct_given_l * p_l) / p_correct
    else:
        p_incorrect_given_l     = params.p_s
        p_incorrect_given_not_l = 1 - params.p_g
        p_incorrect = p_incorrect_given_l * p_l + p_incorrect_given_not_l * (1 - p_l)
        p_l_given_obs = (p_incorrect_given_l * p_l) / p_incorrect

    # Apply learning transition
    new_mastery = p_l_given_obs + (1 - p_l_given_obs) * params.p_t

    # Clamp to avoid degenerate states
    return max(0.01, min(0.99, new_mastery))


# ---------------------------------------------------------------------------
# Forgetting curve (exponential decay)
# ---------------------------------------------------------------------------

def apply_mastery_decay(
    mastery: float,
    days_since_last_practice: float,
    decay_rate: float = 0.05,
) -> float:
    """
    Apply time-based mastery decay using an exponential forgetting curve.

    Formula: P(L, t) = baseline + (P(L) - baseline) * e^(-λ * t)

    Args:
        mastery:                  Current mastery before decay.
        days_since_last_practice: Number of days since the student last practiced.
        decay_rate:               Lambda (λ) — higher = faster forgetting.

    Returns:
        Decayed mastery value, clamped to [0.01, 0.99].
    """
    if days_since_last_practice <= 0:
        return mastery

    baseline = 0.05  # Even forgotten concepts retain a trace
    decayed = baseline + (mastery - baseline) * math.exp(-decay_rate * days_since_last_practice)

    return max(0.01, min(0.99, decayed))


# ---------------------------------------------------------------------------
# Exam readiness score
# ---------------------------------------------------------------------------

def calculate_exam_readiness(
    mastery_map: dict,
    concept_difficulties: dict,
) -> float:
    """
    Calculate an overall exam readiness score (0-100).

    Weighted average of mastery across concepts, where higher-difficulty
    concepts receive proportionally more weight.

    Args:
        mastery_map:          Dict of concept_id -> {"mastery": float, "lastPracticed": str|None, ...}
        concept_difficulties: Dict of concept_id -> difficulty (1-10).

    Returns:
        Readiness score from 0 to 100.
    """
    if not mastery_map:
        return 0.0

    weighted_sum = 0.0
    total_weight = 0.0

    for concept_id, cm in mastery_map.items():
        difficulty = concept_difficulties.get(concept_id, 5)
        weight = difficulty / 10.0

        effective_mastery = cm.get("mastery", 0)

        # Apply decay if we know when the student last practiced
        last_practiced = cm.get("lastPracticed")
        if last_practiced:
            from datetime import datetime
            try:
                last_dt = datetime.fromisoformat(last_practiced.replace("Z", "+00:00"))
                days_since = (datetime.now(last_dt.tzinfo) - last_dt).total_seconds() / 86400
                effective_mastery = apply_mastery_decay(effective_mastery, days_since)
            except (ValueError, TypeError):
                pass  # If date parsing fails, use raw mastery

        weighted_sum += effective_mastery * weight
        total_weight += weight

    return (weighted_sum / total_weight) * 100 if total_weight > 0 else 0.0


# ---------------------------------------------------------------------------
# Mastery labels and colors (for optional server-side use)
# ---------------------------------------------------------------------------

def get_mastery_color(mastery: float) -> str:
    """Return a hex color representing the mastery level."""
    if mastery >= 0.85:
        return "#06b6d4"  # cyan — mastered
    if mastery >= 0.65:
        return "#10b981"  # emerald — proficient
    if mastery >= 0.4:
        return "#f59e0b"  # amber — learning
    if mastery >= 0.15:
        return "#ef4444"  # red — struggling
    return "#374151"      # gray — new
