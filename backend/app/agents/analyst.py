"""Analyst Agent (Reduce phase) synthesizing persona evaluations into an Executive Playbook."""
import asyncio
import logging
import math
import random
import secrets
from typing import Any, List, Optional
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings
from app.models.personas_data import sanitize_brief
from app.models.schema import FinalReport, PersonaEvaluation, SimulationMetrics

logger = logging.getLogger(__name__)


def strip_outer_markdown_fence(text: str) -> str:
    """
    Strips an outer ```markdown or ``` code fence from the text if present,
    leaving any inner code blocks intact.
    """
    if not text:
        return ""
    lines = text.strip().splitlines()
    if len(lines) >= 2:
        first_line = lines[0].strip()
        last_line = lines[-1].strip()
        # If the outer wrapper starts with ``` (or ```markdown, ```md) and ends with ```
        if first_line.startswith("```") and last_line == "```":
            return "\n".join(lines[1:-1]).strip()
    return text.strip()


class AnalystOutput(BaseModel):
    """Structured LLM output for the analyst synthesis."""
    executive_summary: str = Field(..., description="High-level synthesis of product market reception and core narrative")
    playbook_markdown: str = Field(..., description="Actionable objection-handling playbook and pivot strategy formatted in clean Markdown")


def compute_metrics(evaluations: List[PersonaEvaluation]) -> SimulationMetrics:
    """Computes quantitative metrics across the 10 persona evaluations."""
    if not evaluations:
        return SimulationMetrics(
            average_score=0.0,
            buy_ready_count=0,
            total_personas=0,
            min_score=0,
            max_score=0,
            score_spread=0.0,
        )

    scores = [p.score_out_of_10 for p in evaluations]
    n = len(scores)
    avg_score = round(sum(scores) / n, 1)
    buy_ready = sum(1 for p in evaluations if p.buy_readiness)
    min_s = min(scores)
    max_s = max(scores)

    # Standard deviation calculation
    variance = sum((s - avg_score) ** 2 for s in scores) / n
    std_dev = round(math.sqrt(variance), 2)

    return SimulationMetrics(
        average_score=avg_score,
        buy_ready_count=buy_ready,
        total_personas=n,
        min_score=min_s,
        max_score=max_s,
        score_spread=std_dev,
    )


ANALYST_SYSTEM_PROMPT = """You are the Chief Market Research Analyst and Growth Strategist at SynthFocus.
You have observed an intensive focus group of 10 diverse consumer personas reviewing a product pitch.

YOUR GOAL:
Synthesize the quantitative and qualitative feedback into a razor-sharp Executive Playbook.

REQUIREMENTS:
1. 'executive_summary': A direct, punchy 2-3 paragraph breakdown of overall market reception. Highlight who is excited, who is repelled, and the fatal flaw in the current positioning.
2. 'playbook_markdown': A comprehensive, beautifully formatted Markdown playbook with:
   - ## The Demographic Fault Line (Where the pitch succeeded vs failed)
   - ## Top 3 Fatal Objections & How to Neutralize Them
   - ## Tactical Copy & Value-Prop Pivots (Concrete before-and-after copy suggestions to convert the lowest-scoring personas)
   - ## High-Leverage Strategic Recommendations (Pricing, packaging, trust triggers, or feature tweaks)

STYLE AND FORMATTING RULES:
- NO EMOJI: Do NOT use any emoji anywhere in headings, lists, or text. Keep all formatting strictly typographic, clean, and professional.

CRITICAL FACTUALITY & VERIFICATION RULE:
Copy suggestions and value-prop pivots must use ONLY facts directly stated in the brief. Anything that would need new proof, external substantiation, unverified claims (such as third-party lab tests, doctor endorsements, certifications, or clinical studies), OR ANY outside price or market benchmark in suggested copy (e.g. coconut water prices, competitor price comparisons) MUST be explicitly labeled "needs validation" (or "if true") instead of being stated as fact.

Do NOT include pleasantries. Deliver actionable, venture-grade strategic advice."""


async def synthesize_focus_group(
    product_brief: str,
    evaluations: List[PersonaEvaluation],
    llm: Optional[Any] = None,
    delimiter_token: Optional[str] = None,
) -> FinalReport:
    """
    Runs the Reduce step of the Map-Reduce pipeline.
    Synthesizes all persona outputs into an executive report with retry handling.
    """
    settings = get_settings()
    metrics = compute_metrics(evaluations)
    clean_brief = sanitize_brief(product_brief)
    token = delimiter_token or secrets.token_hex(8)
    start_delim = f"<<<PRODUCT_BRIEF_{token}>>>"
    end_delim = f"<<<END_PRODUCT_BRIEF_{token}>>>"

    # Format personas summary for analyst prompt
    eval_summaries = []
    for ev in evaluations:
        eval_summaries.append(
            f"- {ev.persona_name}: Score {ev.score_out_of_10}/10 | Buy: {ev.buy_readiness}\n"
            f"  Objection: {ev.primary_objection}\n"
            f"  Critique: \"{ev.one_sentence_critique}\"\n"
            f"  Frustrations: {', '.join(ev.key_frustrations) if ev.key_frustrations else 'None'}"
        )
    formatted_evals = "\n".join(eval_summaries)

    prompt = f"""PRODUCT BRIEF EVALUATED:
{start_delim}
{clean_brief}
{end_delim}

QUANTITATIVE SUMMARY:
- Total Personas: {metrics.total_personas}
- Average Score: {metrics.average_score}/10
- Buy-Ready Count: {metrics.buy_ready_count}/{metrics.total_personas}
- Score Range: {metrics.min_score} to {metrics.max_score} (Spread / Std Dev: {metrics.score_spread})

INDIVIDUAL PERSONA EVALUATIONS:
{formatted_evals}

Generate the Executive Summary and Tactical Playbook now in strict JSON format matching the schema."""

    if llm is None:
        from app.agents.evaluator import get_llm
        llm = get_llm()

    structured_llm = llm.with_structured_output(AnalystOutput)
    attempt = 0
    backoff = settings.INITIAL_BACKOFF_SECONDS

    while True:
        try:
            logger.info("Running Analyst reduce synthesis (attempt %d)", attempt + 1)
            result = await structured_llm.ainvoke([
                HumanMessage(content=f"{ANALYST_SYSTEM_PROMPT}\n\n{prompt}")
            ])

            if isinstance(result, AnalystOutput):
                summary = result.executive_summary
                playbook = strip_outer_markdown_fence(result.playbook_markdown)
            elif isinstance(result, dict):
                summary = result.get("executive_summary", "")
                playbook = strip_outer_markdown_fence(result.get("playbook_markdown", ""))
            else:
                summary = "Focus group evaluation completed."
                playbook = "Strategic playbook synthesis unavailable."

            return FinalReport(
                metrics=metrics,
                executive_summary=summary,
                playbook_markdown=playbook,
                persona_results=evaluations,
            )

        except Exception as exc:
            attempt += 1
            from app.agents.evaluator import _is_rate_limit_error
            if _is_rate_limit_error(exc) and attempt <= settings.MAX_RETRIES:
                jitter = random.uniform(0.5, 1.5)
                wait_time = (backoff * (2 ** (attempt - 1))) + jitter
                logger.warning("Rate limit hit during Analyst synthesis. Backing off for %.2fs", wait_time)
                await asyncio.sleep(wait_time)
                continue

            logger.error("Analyst synthesis failed: %s. Using deterministic fallback.", exc)
            fallback_playbook = (
                "## Market Reception Overview\n\n"
                f"- **Average Appeal:** {metrics.average_score}/10\n"
                f"- **Immediate Conversion:** {metrics.buy_ready_count}/{metrics.total_personas}\n\n"
                "## Key Demands from Lowest-Scoring Personas\n\n"
                "Review individual persona objections in the matrix to resolve friction on pricing, trust signals, and messaging clarity."
            )
            return FinalReport(
                metrics=metrics,
                executive_summary=(
                    f"The product received an average score of {metrics.average_score}/10 with {metrics.buy_ready_count} "
                    f"out of {metrics.total_personas} personas ready to purchase. The response revealed significant divergence "
                    f"across demographics with a score spread of {metrics.score_spread}."
                ),
                playbook_markdown=strip_outer_markdown_fence(fallback_playbook),
                persona_results=evaluations,
            )
