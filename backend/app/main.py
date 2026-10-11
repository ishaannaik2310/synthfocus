"""FastAPI application entry point for SynthFocus."""
import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.config import get_settings
from app.graph.workflow import run_simulation_generator
from app.limiter import daily_limiter, ip_limiter, safe_extract_client_ip
from app.models.schema import SimulationRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("synthfocus.api")

app = FastAPI(
    title="SynthFocus API",
    description="Stateless Synthetic AI Focus Group Simulator powered by Gemini and LangGraph",
    version="1.0.0",
)

# CORS configuration driven by CORS_ORIGINS setting (default: http://localhost:3000,http://127.0.0.1:3000)
_settings = get_settings()
_cors_origins = [origin.strip() for origin in _settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global concurrency lock to strictly protect free-tier rate limits (1 simulation at a time)
SIMULATION_SEMAPHORE = asyncio.Semaphore(1)


@app.get("/api/health")
async def health_check():
    """Health check endpoint for container orchestration and ALB health probes."""
    settings = get_settings()
    quota_status = await daily_limiter.get_status()
    return {
        "status": "healthy",
        "engine": "SynthFocus",
        "model": settings.GEMINI_MODEL,
        "batch_size": settings.BATCH_SIZE,
        "batch_sleep_seconds": settings.BATCH_SLEEP_SECONDS,
        "semaphore_available": not SIMULATION_SEMAPHORE.locked(),
        "daily_quota": quota_status,
    }


@app.post("/api/simulate-focus-group")
async def simulate_focus_group_stream(request: Request, payload: SimulationRequest):
    """
    Main focus group simulation endpoint.
    Exclusively streams Server-Sent Events (SSE) via sse-starlette.
    
    Guards:
    1. Input length capped (10 - 5000 chars via Pydantic).
    2. Safe client IP extraction from X-Forwarded-For behind ALB.
    3. Global daily quota check (120 runs/day to safeguard 1,500 RPD).
    4. Per-IP rate limiting (hourly budget).
    5. Global concurrency semaphore (returns 429 if engine is currently busy).
    6. Client disconnect cancellation.
    7. SSE heartbeats and proxy header X-Accel-Buffering: no.
    """
    settings = get_settings()
    client_ip = safe_extract_client_ip(request, trusted_hops=settings.TRUSTED_PROXY_HOPS)

    # 1. Global Daily Quota Check
    if not await daily_limiter.is_allowed():
        logger.warning("Global daily quota reached. Rejecting simulation request from IP: %s", client_ip)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "code": "daily_cap",
                "detail": (
                    f"Global daily simulation quota reached ({settings.MAX_DAILY_SIMULATIONS} runs/day to safeguard "
                    "Gemini Free-Tier 1,500 RPD limit). Resets at the next UTC calendar day boundary (midnight UTC)."
                ),
            },
        )

    # 2. Per-IP Hourly Rate Limiting
    allowed = await ip_limiter.is_allowed(client_ip)
    if not allowed:
        logger.warning("Hourly rate limit exceeded for IP: %s", client_ip)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "code": "rate_limit",
                "detail": f"Hourly rate limit exceeded ({settings.RATE_LIMIT_SIMULATIONS_PER_HOUR} simulations/hr). Please try again later.",
            },
        )

    # 3. Concurrency Semaphore Check
    if SIMULATION_SEMAPHORE.locked():
        logger.warning("Simulation rejected: Engine busy. IP: %s", client_ip)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "code": "busy",
                "detail": (
                    "Simulation engine is currently busy running another focus group. "
                    "To safeguard zero-cost Gemini API rate limits, SynthFocus runs one focus group at a time. "
                    "Please wait approximately 60-90 seconds and try again."
                ),
            },
        )

    async def sse_event_publisher() -> AsyncGenerator[dict, None]:
        acquired = await SIMULATION_SEMAPHORE.acquire()
        logger.info("Simulation lock acquired by IP: %s", client_ip)
        await daily_limiter.record_run()
        try:
            generator = run_simulation_generator(
                product_brief=payload.product_brief,
                is_disconnected=request.is_disconnected,
            )
            async for event in generator:
                yield {
                    "event": event["event"],
                    "data": json.dumps(event["data"]),
                }

        except asyncio.CancelledError:
            logger.info("Simulation cancelled due to client disconnect. IP: %s", client_ip)
        except Exception as exc:
            logger.error("Unhandled error in simulation generator: %s", exc, exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({
                    "status": "error",
                    "message": f"Simulation failed: {str(exc)}",
                }),
            }
        finally:
            if acquired:
                SIMULATION_SEMAPHORE.release()
                logger.info("Simulation lock released by IP: %s", client_ip)

    return EventSourceResponse(
        sse_event_publisher(),
        ping=15,  # Send SSE comment heartbeat every 15s to keep connections alive
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
