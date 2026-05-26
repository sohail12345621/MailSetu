import asyncio
import time
from collections import deque
from backend.core.config import settings


class RateLimiter:
    """Token bucket rate limiter for SMTP sends."""

    def __init__(self, max_per_minute: int = None):
        self.max_per_minute = max_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.window = 60  # seconds
        self.timestamps: deque = deque()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            # Remove timestamps older than the window
            while self.timestamps and now - self.timestamps[0] > self.window:
                self.timestamps.popleft()

            if len(self.timestamps) >= self.max_per_minute:
                # Wait until we can send
                sleep_for = self.window - (now - self.timestamps[0]) + 0.1
                await asyncio.sleep(sleep_for)
                # Re-clean after sleep
                now = time.monotonic()
                while self.timestamps and now - self.timestamps[0] > self.window:
                    self.timestamps.popleft()

            self.timestamps.append(time.monotonic())


# Singleton limiter instance
rate_limiter = RateLimiter()
