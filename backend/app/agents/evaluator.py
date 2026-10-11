"""Persona Evaluator agent using Google Gemini with structured outputs & 429/503 backoff."""
import asyncio
import json
import logging
import random
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings
from app.models.personas_data import format_evaluation_prompt
from app.models.schema import PersonaEvaluation

logger = logging.getLogger(__name__)


def _is_rate_limit_error(exc: Exception) -> bool:
    """Detects 429 Resource Exhausted or 503 high demand transient errors."""
    err_str = str(exc).lower()
    return any(k in err_str for k in ("429", "resource_exhausted", "rate limit", "quota", "503", "unavailable", "high demand"))


def get_llm(model_override: Optional[str] = None) -> ChatGoogleGenerativeAI:
    """Instantiates the Gemini chat model with the configured API key and model name."""
    settings = get_settings()
    model_name = model_override or settings.GEMINI_MODEL
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.GOOGLE_API_KEY,
        max_retries=0,  # We manage our own deterministic exponential backoff
    )


async def evaluate_persona(
    persona: Dict[str, Any],
    product_brief: str,
    llm: Optional[Any] = None,
    delimiter_token: Optional[str] = None,
) -> PersonaEvaluation:
    """
    Evaluates a single persona against a product brief.
    Includes exponential backoff for 429 and transient 503 responses.
    """
    settings = get_settings()
    prompt_text = format_evaluation_prompt(persona, product_brief, delimiter_token=delimiter_token)

    if llm is None:
        llm = get_llm()

    structured_llm = llm.with_structured_output(PersonaEvaluation)

    attempt = 0
    backoff = settings.INITIAL_BACKOFF_SECONDS

    while True:
        try:
            logger.info("Evaluating persona: %s (attempt %d)", persona["name"], attempt + 1)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt_text)])

            # If result is already a PersonaEvaluation instance
            if isinstance(result, PersonaEvaluation):
                return result

            # If returned as a dict
            if isinstance(result, dict):
                return PersonaEvaluation(**result)

            # If returned as a raw JSON string
            if isinstance(result, str):
                cleaned = result.strip().removeprefix("```json").removesuffix("```").strip()
                return PersonaEvaluation.model_validate_json(cleaned)

            raise ValueError(f"Unexpected response type from LLM: {type(result)}")

        except Exception as exc:
            attempt += 1
            is_transient = _is_rate_limit_error(exc)

            if is_transient and attempt <= settings.MAX_RETRIES:
                jitter = random.uniform(0.5, 1.5)
                wait_time = (backoff * (2 ** (attempt - 1))) + jitter
                logger.warning(
                    "Rate limit / capacity backoff for persona %s. Waiting %.2fs (attempt %d/%d). Error: %s",
                    persona["name"],
                    wait_time,
                    attempt,
                    settings.MAX_RETRIES,
                    exc,
                )
                await asyncio.sleep(wait_time)
                continue

            logger.error("Error evaluating persona %s: %s", persona["name"], exc)
            return PersonaEvaluation(
                persona_id=persona["id"],
                persona_name=persona["name"],
                score_out_of_10=5,
                primary_objection="Evaluation service rate-limit encountered during simulation.",
                one_sentence_critique=f"I couldn't complete my full review due to an evaluation timeout, but I am skeptical of this concept's claims.",
                buy_readiness=False,
                key_frustrations=["API rate-limit interruption"],
                trigger_words=[],
            )
