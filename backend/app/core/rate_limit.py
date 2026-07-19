import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, HTTPException, Request
from redis.asyncio import Redis

from app.core.config import settings


@dataclass(frozen=True)
class Limit:
    requests: int
    window_seconds: int


class RateLimitStore:
    def __init__(self) -> None:
        self.redis: Redis | None = None
        self.memory: dict[str, deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def connect(self) -> None:
        try:
            client = Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            await client.ping()
            self.redis = client
        except Exception:
            self.redis = None

    async def close(self) -> None:
        if self.redis:
            await self.redis.aclose()

    async def hit(self, key: str, limit: Limit) -> tuple[bool, int]:
        if self.redis:
            try:
                count = await self.redis.incr(key)
                if count == 1:
                    await self.redis.expire(key, limit.window_seconds)
                ttl = max(await self.redis.ttl(key), 1)
                return count <= limit.requests, ttl
            except Exception:
                self.redis = None

        now = time.monotonic()
        async with self.lock:
            bucket = self.memory[key]
            threshold = now - limit.window_seconds
            while bucket and bucket[0] <= threshold:
                bucket.popleft()
            if len(bucket) >= limit.requests:
                retry_after = max(1, int(limit.window_seconds - (now - bucket[0])))
                return False, retry_after
            bucket.append(now)
            return True, limit.window_seconds


store = RateLimitStore()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else "unknown"


async def enforce_limit(key: str, limit: Limit) -> None:
    allowed, retry_after = await store.hit(key, limit)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )


def ip_rate_limit(name: str, requests: int, window_seconds: int) -> Callable:
    async def dependency(request: Request) -> None:
        await enforce_limit(
            f"rate:ip:{name}:{client_ip(request)}",
            Limit(requests, window_seconds),
        )

    return dependency


def user_rate_limit(name: str, requests: int, window_seconds: int) -> Callable:
    from app.api.dependencies import get_current_user

    async def dependency(
        request: Request,
        user=Depends(get_current_user),
    ) -> None:
        await enforce_limit(
            f"rate:user:{name}:{user.id}",
            Limit(requests, window_seconds),
        )

    return dependency
