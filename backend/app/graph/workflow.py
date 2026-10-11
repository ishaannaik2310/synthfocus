"""LangGraph Map-Reduce workflow and streaming execution engine for SynthFocus."""
import asyncio
import json
import logging
import secrets
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional

from langgraph.graph import END, StateGraph

from app.agents.analyst import synthesize_focus_group
from app.agents.evaluator import evaluate_persona
from app.config import get_settings
from app.graph.state import FocusGroupState
from app.models.personas_data import SYNTHETIC_10
from app.models.schema import FinalReport, PersonaEvaluation

logger = logging.getLogger(__name__)


def build_simulation_graph() -> Any:
    """Builds and compiles the LangGraph StateGraph representing the simulation pipeline."""
    graph = StateGraph(FocusGroupState)

    def ingest_node(state: FocusGroupState) -> Dict[str, Any]:
        personas = state.get("personas") or SYNTHETIC_10
        batch_size = state.get("batch_size", 2)
        total_batches = (len(personas) + batch_size - 1) // batch_size
        return {
            "personas": personas,
            "total_batches": total_batches,
            "current_batch_index": 0,
            "evaluations": [],
            "status_message": f"Ingestion complete. {len(personas)} personas loaded into {total_batches} batches.",
        }

    graph.add_node("ingest", ingest_node)
    graph.set_entry_point("ingest")
    graph.add_edge("ingest", END)

    return graph.compile()


async def run_simulation_generator(
    product_brief: str,
    is_disconnected: Optional[Callable[[], Any]] = None,
    llm: Optional[Any] = None,
    sleep_fn: Optional[Callable[[float], Any]] = None,
    batch_size_override: Optional[int] = None,
    batch_sleep_override: Optional[int] = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Executes the Throttled Map-Reduce pipeline yielding SSE event dictionaries.
    
    Adheres strictly to Gemini Free-Tier 15 RPM by micro-batching and enforcing
    sleep intervals between batches.
    """
    settings = get_settings()
    sleep = sleep_fn or asyncio.sleep

    batch_size = batch_size_override if batch_size_override is not None else settings.BATCH_SIZE
    batch_sleep = batch_sleep_override if batch_sleep_override is not None else settings.BATCH_SLEEP_SECONDS
    sim_delimiter = secrets.token_hex(8)

    # 1. Initialize LangGraph compiled state graph
    compiled_graph = build_simulation_graph()
    initial_state = await compiled_graph.ainvoke({
        "product_brief": product_brief,
        "personas": SYNTHETIC_10,
        "batch_size": batch_size,
        "batch_sleep_seconds": batch_sleep,
    })

    personas: List[Dict[str, Any]] = initial_state["personas"]
    total_personas = len(personas)
    total_batches = (total_personas + batch_size - 1) // batch_size
    accumulated_evaluations: List[PersonaEvaluation] = []

    # Yield simulation start event
    yield {
        "event": "start",
        "data": {
            "status": "started",
            "message": f"Simulation initialized. Spawning {total_personas} consumer personas across {total_batches} throttled batches.",
            "total_personas": total_personas,
            "total_batches": total_batches,
            "batch_size": batch_size,
        },
    }

    # 2. Staggered Map Phase: micro-batches with rate-limit sleep
    for batch_idx in range(total_batches):
        # Client disconnect check
        if is_disconnected and await is_disconnected():
            logger.info("Client disconnected before batch %d. Terminating simulation.", batch_idx + 1)
            raise asyncio.CancelledError("Client disconnected")

        start_offset = batch_idx * batch_size
        batch_personas = personas[start_offset : start_offset + batch_size]
        persona_names = ", ".join([p["name"] for p in batch_personas])

        logger.info("Starting Batch %d/%d with personas: %s", batch_idx + 1, total_batches, persona_names)
        yield {
            "event": "batch_start",
            "data": {
                "status": "batch_running",
                "batch_index": batch_idx,
                "total_batches": total_batches,
                "message": f"Polling Batch {batch_idx + 1}/{total_batches}: {persona_names}...",
                "personas": [{"id": p["id"], "name": p["name"], "avatar": p.get("avatar", "👤")} for p in batch_personas],
            },
        }

        # Concurrently evaluate personas within the micro-batch
        tasks = [evaluate_persona(p, product_brief, llm=llm, delimiter_token=sim_delimiter) for p in batch_personas]
        batch_results: List[PersonaEvaluation] = await asyncio.gather(*tasks)

        accumulated_evaluations.extend(batch_results)

        yield {
            "event": "batch_complete",
            "data": {
                "status": "batch_done",
                "batch_index": batch_idx,
                "total_batches": total_batches,
                "personas_evaluated": [res.model_dump() for res in batch_results],
                "message": f"Batch {batch_idx + 1}/{total_batches} completed.",
            },
        }

        # If more batches remain, enforce deterministic sleep to stay below 15 RPM
        is_last_batch = (batch_idx == total_batches - 1)
        if not is_last_batch:
            logger.info("Throttling: Sleeping %ds before next batch to respect Gemini Free-Tier RPM.", batch_sleep)
            yield {
                "event": "throttling",
                "data": {
                    "status": "sleeping",
                    "batch_index": batch_idx,
                    "seconds_remaining": batch_sleep,
                    "message": f"Free-Tier RPM guard: Throttling for {batch_sleep}s before Batch {batch_idx + 2}...",
                },
            }

            # Check client disconnect during sleep intervals (sampled every 1 second)
            sleep_step = 1.0
            elapsed = 0.0
            while elapsed < batch_sleep:
                if is_disconnected and await is_disconnected():
                    logger.info("Client disconnected during sleep. Terminating simulation.")
                    raise asyncio.CancelledError("Client disconnected")
                
                step = min(sleep_step, batch_sleep - elapsed)
                await sleep(step)
                elapsed += step

    # 3. Reduce Phase: Analyst synthesis
    if is_disconnected and await is_disconnected():
        logger.info("Client disconnected before analyst synthesis. Terminating simulation.")
        raise asyncio.CancelledError("Client disconnected")

    yield {
        "event": "analyst_start",
        "data": {
            "status": "analyzing",
            "message": "All 10 personas evaluated. Chief Analyst synthesizing quantitative metrics & objection playbook...",
        },
    }

    final_report: FinalReport = await synthesize_focus_group(
        product_brief=product_brief,
        evaluations=accumulated_evaluations,
        llm=llm,
        delimiter_token=sim_delimiter,
    )

    # Emit the complete final playbook as one event (no token-streaming)
    yield {
        "event": "final_report",
        "data": final_report.model_dump(),
    }
