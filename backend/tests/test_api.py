"""Integration tests for FastAPI endpoints, semaphore locking, and input guards."""
import asyncio
import time
import pytest
from httpx import ASGITransport, AsyncClient
from starlette.requests import Request

from app.main import app, SIMULATION_SEMAPHORE
from app.limiter import IPRateLimiter, GlobalDailyQuotaLimiter, safe_extract_client_ip


@pytest.mark.asyncio
async def test_health_check():
    """Verify health check endpoint returns 200 with model info."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "model" in data
        assert "semaphore_available" in data
        assert "daily_quota" in data


@pytest.mark.asyncio
async def test_input_length_validation():
    """Verify that briefs shorter than 10 chars or longer than 5000 chars are rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Too short (< 10 chars)
        res_short = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Too short"},
        )
        assert res_short.status_code == 422

        # Too long (> 5000 chars)
        res_long = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "a" * 5001},
        )
        assert res_long.status_code == 422


@pytest.mark.asyncio
async def test_concurrency_semaphore_locking():
    """
    Verify that when the simulation semaphore is locked by an ongoing run,
    subsequent incoming requests receive a friendly 429 Too Many Requests response.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Manually lock the semaphore to simulate an active focus group simulation
        await SIMULATION_SEMAPHORE.acquire()
        try:
            response = await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "A valid product pitch with plenty of characters to pass validation."},
            )
            assert response.status_code == 429
            data = response.json()
            assert data.get("code") == "busy"
            assert "Simulation engine is currently busy" in data["detail"]
        finally:
            SIMULATION_SEMAPHORE.release()


@pytest.mark.asyncio
async def test_endpoint_429_response_codes():
    """Verify machine-readable 'code' field on 429 responses."""
    from app.limiter import daily_limiter, ip_limiter

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test daily cap 429 code
        original_runs = daily_limiter._runs_today
        original_max = daily_limiter.max_daily_runs
        try:
            daily_limiter.max_daily_runs = 0
            response = await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "Valid product pitch that should hit daily limit."},
            )
            assert response.status_code == 429
            assert response.json().get("code") == "daily_cap"
        finally:
            daily_limiter.max_daily_runs = original_max
            daily_limiter._runs_today = original_runs

        # Test per-IP rate limit 429 code
        test_ip = "192.0.2.1"
        try:
            # Exhaust IP budget
            ip_limiter._requests[test_ip] = [time.time()] * ip_limiter.max_requests
            response = await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "Valid product pitch that should hit ip limit."},
                headers={"x-forwarded-for": test_ip},
            )
            assert response.status_code == 429
            assert response.json().get("code") == "rate_limit"
        finally:
            ip_limiter._requests.pop(test_ip, None)


@pytest.mark.asyncio
async def test_ip_rate_limiter():
    """Verify that exceeding IP rate limit returns 429."""
    limiter = IPRateLimiter(max_requests=2, window_seconds=60)
    test_ip = "192.168.1.100"

    assert await limiter.is_allowed(test_ip) is True
    assert await limiter.is_allowed(test_ip) is True
    assert await limiter.is_allowed(test_ip) is False
    assert await limiter.get_remaining(test_ip) == 0


def test_safe_extract_client_ip_alb():
    """Verify safe IP extraction behind AWS ALB with X-Forwarded-For."""
    # Direct single ALB proxy with client IP
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"203.0.113.195")],
        "client": ("10.0.1.50", 12345),
    }
    req = Request(scope)
    assert safe_extract_client_ip(req, trusted_hops=1) == "203.0.113.195"

    # Spoofed/chained X-Forwarded-For header (ALB appends real client to the end)
    scope_chained = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"1.1.1.1, 203.0.113.195")],
        "client": ("10.0.1.50", 12345),
    }
    req_chained = Request(scope_chained)
    assert safe_extract_client_ip(req_chained, trusted_hops=1) == "203.0.113.195"

    # Fallback when header is missing
    scope_no_header = {
        "type": "http",
        "headers": [],
        "client": ("198.51.100.22", 12345),
    }
    req_no_header = Request(scope_no_header)
    assert safe_extract_client_ip(req_no_header, trusted_hops=1) == "198.51.100.22"


@pytest.mark.asyncio
async def test_global_daily_quota_limiter():
    """Verify GlobalDailyQuotaLimiter caps simulation runs."""
    daily_limiter = GlobalDailyQuotaLimiter(max_daily_runs=2)
    assert await daily_limiter.is_allowed() is True
    await daily_limiter.record_run()
    assert await daily_limiter.is_allowed() is True
    await daily_limiter.record_run()
    assert await daily_limiter.is_allowed() is False
