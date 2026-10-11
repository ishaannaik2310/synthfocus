from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SimulationRequest(BaseModel):
    """Payload sent by the frontend to start a simulation."""
    product_brief: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Landing page copy, pitch deck text, or product concept."
    )


class PersonaEvaluation(BaseModel):
    """Structured evaluation output produced by a persona agent."""
    persona_id: str = Field(..., description="Unique identifier for the persona")
    persona_name: str = Field(..., description="Display name of the persona")
    score_out_of_10: int = Field(..., ge=0, le=10, description="Score from 0 (hate) to 10 (love)")
    primary_objection: str = Field(..., description="The single biggest friction point or blocker")
    one_sentence_critique: str = Field(..., description="Ruthless, in-character 1-sentence hot take")
    buy_readiness: bool = Field(..., description="True if persona would purchase/convert today")
    key_frustrations: List[str] = Field(default_factory=list, description="Specific elements that triggered friction")
    trigger_words: List[str] = Field(default_factory=list, description="Words or claims that provoked skepticism or joy")

    @field_validator("score_out_of_10", mode="before")
    @classmethod
    def clamp_and_round_score(cls, v):
        try:
            val = round(float(v))
            return max(0, min(10, val))
        except (ValueError, TypeError):
            return 5


class SimulationMetrics(BaseModel):
    """Quantitative aggregations across all persona evaluations."""
    average_score: float = Field(..., description="Mean score across all 10 personas (0.0 to 10.0)")
    buy_ready_count: int = Field(..., ge=0, le=10, description="Total personas with buy_readiness=True")
    total_personas: int = Field(default=10, description="Total number of evaluated personas")
    min_score: int = Field(..., ge=0, le=10, description="Lowest score received")
    max_score: int = Field(..., ge=0, le=10, description="Highest score received")
    score_spread: float = Field(..., description="Statistical standard deviation of scores")


class FinalReport(BaseModel):
    """Executive output produced by the Analyst Agent reduce phase."""
    metrics: SimulationMetrics
    executive_summary: str = Field(..., description="High-level analysis of product market reception")
    playbook_markdown: str = Field(..., description="Actionable objection-handling playbook in Markdown")
    persona_results: List[PersonaEvaluation]
    disclaimer: str = Field(
        default="SynthFocus produces synthetic AI-generated simulations for market research exploration, not real human market data."
    )


class SSEEventData(BaseModel):
    """Standard payload format for Server-Sent Events."""
    status: str
    message: str
    batch_index: Optional[int] = None
    total_batches: Optional[int] = None
    seconds_remaining: Optional[int] = None
    personas_evaluated: Optional[List[PersonaEvaluation]] = None
    final_report: Optional[FinalReport] = None
