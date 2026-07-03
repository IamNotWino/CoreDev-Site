import time
from collections import defaultdict
from threading import Lock


class RateLimiter:
    def __init__(self):
        self._hits = defaultdict(list)
        self._lock = Lock()

    def allow(self, key, limit, window_seconds):
        now = time.time()
        with self._lock:
            hits = [timestamp for timestamp in self._hits[key] if now - timestamp < window_seconds]
            if len(hits) >= limit:
                self._hits[key] = hits
                return False
            hits.append(now)
            self._hits[key] = hits
            return True


rate_limiter = RateLimiter()
