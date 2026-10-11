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
    """Verify health check endpoint returns 200 with minimal status ok."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


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


def test_safe_extract_client_ip_untrusted_hops():
    """Verify X-Forwarded-For is completely ignored when TRUSTED_PROXY_HOPS=0."""
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"203.0.113.195")],
        "client": ("192.168.1.5", 12345),
    }
    req = Request(scope)
    # When hops=0, returns direct socket client host, ignoring header spoofing
    assert safe_extract_client_ip(req, trusted_hops=0) == "192.168.1.5"


@pytest.mark.asyncio
async def test_ip_rate_limiter_stale_purge():
    """Verify periodic purge of expired IP entries in IPRateLimiter."""
    limiter = IPRateLimiter(max_requests=5, window_seconds=60)
    now = time.time()
    # IP 1: expired entry (timestamp 100 seconds ago)
    limiter._requests["10.0.0.1"] = [now - 100]
    # IP 2: active entry (timestamp right now)
    limiter._requests["10.0.0.2"] = [now]

    purged_count = limiter.purge_stale_entries(cutoff=now - 60)
    assert purged_count == 1
    assert "10.0.0.1" not in limiter._requests
    assert "10.0.0.2" in limiter._requests


@pytest.mark.asyncio
async def test_concurrent_requests_semaphore_race(monkeypatch):
    """
    Verify that two near-simultaneous requests don't queue:
    One acquires the semaphore immediately, and the second receives 429 {"code": "busy"}.
    """
    from unittest.mock import patch

    # Mock generator that holds the simulation open briefly
    async def slow_mock_generator(*args, **kwargs):
        yield {"event": "start", "data": {"status": "started"}}
        await asyncio.sleep(0.3)
        yield {"event": "final_report", "data": {"metrics": {}}}

    monkeypatch.setattr("app.main.run_simulation_generator", slow_mock_generator)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Launch two near-simultaneous requests
        task1 = client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Valid product brief for concurrency race test 1."},
        )
        task2 = client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Valid product brief for concurrency race test 2."},
        )

        res1, res2 = await asyncio.gather(task1, task2)
        statuses = [res1.status_code, res2.status_code]

        # Exactly one must succeed (200 SSE stream) and the other must be rejected (429 busy)
        assert 200 in statuses
        assert 429 in statuses

        busy_res = res1 if res1.status_code == 429 else res2
        assert busy_res.json().get("code") == "busy"

        # After both complete, semaphore must be free
        assert not SIMULATION_SEMAPHORE.locked()


@pytest.mark.asyncio
async def test_daily_counter_increments_exactly_once(monkeypatch):
    """Verify the daily counter increments exactly once per executed run."""
    from app.limiter import daily_limiter

    async def fast_mock_generator(*args, **kwargs):
        yield {"event": "start", "data": {"status": "started"}}
        yield {"event": "final_report", "data": {"metrics": {}}}

    monkeypatch.setattr("app.main.run_simulation_generator", fast_mock_generator)

    initial_runs = daily_limiter._runs_today
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Valid pitch brief testing daily counter increment."},
        )
        assert res.status_code == 200
        assert daily_limiter._runs_today == initial_runs + 1


@pytest.mark.asyncio
async def test_error_sanitization_no_str_exc(monkeypatch):
    """
    Verify that unhandled exceptions are logged server-side and an opaque,
    generic error message with code 'simulation_error' is sent to the client (no str(exc) leakage).
    """
    secret_internal_leak = "INTERNAL_LEAK_SECRET_KEY_DB_TIMEOUT_491823"

    async def crashing_generator(*args, **kwargs):
        raise RuntimeError(secret_internal_leak)
        yield  # make it a generator

    monkeypatch.setattr("app.main.run_simulation_generator", crashing_generator)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Valid brief testing exception message masking."},
        )
        assert res.status_code == 200
        text = res.text

        # The internal exception string must NOT appear in the client response
        assert secret_internal_leak not in text
        # Must contain generic error code and safe message
        assert "simulation_error" in text
        assert "Simulation encountered an unexpected upstream error." in text

        # Semaphore must be freed despite unhandled generator exception
        assert not SIMULATION_SEMAPHORE.locked()


@pytest.mark.asyncio
async def test_record_run_exception_releases_semaphore(monkeypatch):
    """
    Verify that if daily_limiter.record_run() raises an exception between lock
    acquisition and response return, the semaphore is cleanly released and subsequent
    requests are NOT rejected as busy.
    """
    from app.limiter import daily_limiter
    from unittest.mock import AsyncMock

    # Force record_run to raise on the first call
    call_count = 0

    async def flaky_record_run():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise RuntimeError("Database/Disk write failure during quota tracking")
        return 1

    monkeypatch.setattr(daily_limiter, "record_run", flaky_record_run)

    async def fast_mock_generator(*args, **kwargs):
        yield {"event": "start", "data": {"status": "started"}}
        yield {"event": "final_report", "data": {"metrics": {}}}

    monkeypatch.setattr("app.main.run_simulation_generator", fast_mock_generator)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request 1 fails due to record_run raising
        with pytest.raises(RuntimeError, match="Database/Disk write failure"):
            await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "Valid brief where record_run will fail."},
            )

        # Semaphore MUST be released immediately
        assert not SIMULATION_SEMAPHORE.locked()

        # Request 2 must succeed and NOT be rejected with 429 busy
        res2 = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "Valid brief for subsequent request."},
        )
        assert res2.status_code == 200
        assert not SIMULATION_SEMAPHORE.locked()


@pytest.mark.asyncio
async def test_order_of_operations_guards(monkeypatch):
    """
    Verify exact order of operations:
    1. Body validation
    2. Per-IP hourly limit
    3. Daily cap check
    4. Semaphore busy check
    5. Record run
    Rejected requests must NOT take the semaphore or increment the daily quota.
    """
    from app.limiter import daily_limiter, ip_limiter

    initial_runs = daily_limiter._runs_today
    test_ip = "198.51.100.99"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Body validation failure (too short)
        res_body = await client.post(
            "/api/simulate-focus-group",
            json={"product_brief": "short"},
            headers={"x-forwarded-for": test_ip},
        )
        assert res_body.status_code == 422
        assert not SIMULATION_SEMAPHORE.locked()
        assert daily_limiter._runs_today == initial_runs

        # Step 2: Per-IP rate limit exhausted
        ip_limiter._requests[test_ip] = [time.time()] * ip_limiter.max_requests
        try:
            res_ip = await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "Valid length brief for rate limit check."},
                headers={"x-forwarded-for": test_ip},
            )
            assert res_ip.status_code == 429
            assert res_ip.json().get("code") == "rate_limit"
            assert not SIMULATION_SEMAPHORE.locked()
            assert daily_limiter._runs_today == initial_runs
        finally:
            ip_limiter._requests.pop(test_ip, None)

        # Step 3: Daily cap exhausted
        original_max = daily_limiter.max_daily_runs
        try:
            daily_limiter.max_daily_runs = 0
            res_daily = await client.post(
                "/api/simulate-focus-group",
                json={"product_brief": "Valid length brief for daily cap check."},
            )
            assert res_daily.status_code == 429
            assert res_daily.json().get("code") == "daily_cap"
            assert not SIMULATION_SEMAPHORE.locked()
            assert daily_limiter._runs_today == initial_runs
        finally:
            daily_limiter.max_daily_runs = original_max


