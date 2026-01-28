from typing import TypedDict


class ConfidenceMetric(TypedDict):
    avg_confidence: float | None
    min_confidence: float | None
    max_confidence: float | None
    count: int
