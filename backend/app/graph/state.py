"""LangGraph State definition for the Throttled Map-Reduce pipeline."""
from typing import Any, Dict, List, Optional, TypedDict

from app.models.schema import FinalReport, PersonaEvaluation


class FocusGroupState(TypedDict, total=False):
    """Global state passed across LangGraph nodes."""
    product_brief: str
    personas: List[Dict[str, Any]]
    batch_size: int
    batch_sleep_seconds: int
    current_batch_index: int
    total_batches: int
    current_batch_evaluations: List[PersonaEvaluation]
    evaluations: List[PersonaEvaluation]
    final_report: Optional[FinalReport]
    status_message: str
