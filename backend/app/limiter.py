"""In-memory rate limiters for client IPs and global daily simulation quotas."""
from collections import defaultdict
from datetime import datetime, timezone
import ipaddress
import logging
import time
from typing import Dict, List, Optional
import asyncio
from fastapi import Request

logger = logging.getLogger(__name__)


def safe_extract_client_ip(request: Request, trusted_hops: int = 1) -> str:
    """
    Safely extracts the originating client IP from X-Forwarded-For when behind a reverse proxy/ALB.

    Proxy Behavior:
    - If trusted_hops <= 0 (e.g. running directly or in local dev without a trusted reverse proxy):
      The X-Forwarded-For header is completely ignored to prevent client IP spoofing.
      Returns the direct connecting host from request.client.host.
    - If trusted_hops >= 1 (e.g. behind AWS Application Load Balancer):
      AWS ALB appends the connecting client IP to the right of X-Forwarded-For:
      X-Forwarded-For: [client_ip, proxy_1, ...]
      Picks the IP at index -trusted_hops (e.g. -1 for single ALB hop).
      Validates each IP with `ipaddress.ip_address` to prevent header injection or malformed strings.
      Falls back to `request.client.host` if absent or invalid.
    """
    if trusted_hops > 0:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            parts = [p.strip() for p in xff.split(",") if p.strip()]
            valid_ips: List[str] = []
            for part in parts:
                try:
                    ip_obj = ipaddress.ip_address(part)
                    valid_ips.append(str(ip_obj))
                except ValueError:
                    logger.warning("Invalid IP address detected in X-Forwarded-For header: %s", part)

            if valid_ips:
                target_index = -min(trusted_hops, len(valid_ips))
                return valid_ips[target_index]

    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


class IPRateLimiter:
    """Sliding window rate limiter per client IP address with periodic stale entry purging."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 3600, purge_interval_seconds: int = 300):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.purge_interval_seconds = purge_interval_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._last_purge = time.time()
        self._lock = asyncio.Lock()

    def purge_stale_entries(self, cutoff: Optional[float] = None) -> int:
        """Purges stale IP entries. Returns count of purged keys. Useful for periodic cleanup and testing."""
        effective_cutoff = cutoff if cutoff is not None else (time.time() - self.window_seconds)
        stale_keys = [
            ip for ip, timestamps in self._requests.items()
            if not [ts for ts in timestamps if ts > effective_cutoff]
        ]
        for ip in stale_keys:
            del self._requests[ip]
        return len(stale_keys)

    async def is_allowed(self, ip: str) -> bool:
        """Checks if the given IP address is allowed to proceed."""
        async with self._lock:
            now = time.time()
            cutoff = now - self.window_seconds

            # Periodically purge stale entries across the map
            if now - self._last_purge >= self.purge_interval_seconds:
                self.purge_stale_entries(cutoff)
                self._last_purge = now

            self._requests[ip] = [ts for ts in self._requests[ip] if ts > cutoff]

            if len(self._requests[ip]) >= self.max_requests:
                return False

            self._requests[ip].append(now)
            return True

    async def get_remaining(self, ip: str) -> int:
        """Returns the number of remaining allowed requests in the current window."""
        async with self._lock:
            now = time.time()
            cutoff = now - self.window_seconds
            active = [ts for ts in self._requests[ip] if ts > cutoff]
            return max(0, self.max_requests - len(active))


class GlobalDailyQuotaLimiter:
    """
    Enforces a hard ceiling on daily simulations across all users
    to guarantee zero exhaustion of Gemini Free-Tier 1,500 RPD quota.
    """

    def __init__(self, max_daily_runs: int = 120):
        self.max_daily_runs = max_daily_runs
        self._runs_today = 0
        self._current_day = datetime.now(timezone.utc).date()
        self._lock = asyncio.Lock()

    def _reset_if_new_day(self):
        today = datetime.now(timezone.utc).date()
        if today != self._current_day:
            self._current_day = today
            self._runs_today = 0

    async def is_allowed(self) -> bool:
        async with self._lock:
            self._reset_if_new_day()
            return self._runs_today < self.max_daily_runs

    async def record_run(self) -> int:
        async with self._lock:
            self._reset_if_new_day()
            self._runs_today += 1
            return self._runs_today

    async def get_status(self) -> Dict[str, int]:
        async with self._lock:
            self._reset_if_new_day()
            return {
                "runs_today": self._runs_today,
                "max_daily_runs": self.max_daily_runs,
                "remaining_runs": max(0, self.max_daily_runs - self._runs_today),
            }


# Global limiter instances
ip_limiter = IPRateLimiter(max_requests=10, window_seconds=3600)
daily_limiter = GlobalDailyQuotaLimiter(max_daily_runs=120)
