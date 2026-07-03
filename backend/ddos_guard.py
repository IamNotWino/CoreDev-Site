import time
from collections import defaultdict
from threading import Lock

from .rate_limit import rate_limiter
from .settings import (
    DDOS_AUTO_BAN_SECONDS,
    DDOS_AUTO_BAN_VIOLATIONS,
    DDOS_BURST_LIMIT,
    DDOS_BURST_WINDOW,
    DDOS_GLOBAL_LIMIT,
    DDOS_GLOBAL_WINDOW,
    DDOS_STATIC_LIMIT,
    DDOS_STATIC_WINDOW,
)


LOCAL_TRUSTED_IPS = {
    "127.0.0.1",
    "::1",
    "localhost",
}


def is_local_trusted_ip(ip):
    text = str(ip or "").strip().lower()
    if text in LOCAL_TRUSTED_IPS:
        return True
    if text.startswith("127."):
        return True
    return False


class TemporaryBanStore:
    def __init__(self):
        self._bans = {}
        self._lock = Lock()

    def ban(self, ip, seconds):
        with self._lock:
            self._bans[ip] = time.time() + seconds

    def is_banned(self, ip):
        now = time.time()
        with self._lock:
            expires_at = self._bans.get(ip)
            if not expires_at:
                return False
            if expires_at <= now:
                self._bans.pop(ip, None)
                return False
            return True


class DDoSGuard:
    def __init__(self):
        self._temporary_bans = TemporaryBanStore()
        self._violations = defaultdict(list)
        self._lock = Lock()

    def _record_violation(self, ip):
        if is_local_trusted_ip(ip):
            return

        now = time.time()
        with self._lock:
            hits = [timestamp for timestamp in self._violations[ip] if now - timestamp < 300]
            hits.append(now)
            self._violations[ip] = hits
            if len(hits) >= DDOS_AUTO_BAN_VIOLATIONS:
                self._violations[ip] = []
                self._temporary_bans.ban(ip, DDOS_AUTO_BAN_SECONDS)

    def allow(self, ip, path):
        if is_local_trusted_ip(ip):
            return True, ""

        if self._temporary_bans.is_banned(ip):
            return False, "Временная блокировка из-за подозрительной активности."

        is_static = path.startswith("/static/")
        global_limit = DDOS_STATIC_LIMIT if is_static else DDOS_GLOBAL_LIMIT
        global_window = DDOS_STATIC_WINDOW if is_static else DDOS_GLOBAL_WINDOW

        if not rate_limiter.allow(f"global:{ip}", global_limit, global_window):
            self._record_violation(ip)
            return False, "Слишком много запросов. Подождите немного."

        if not is_static and not rate_limiter.allow(f"burst:{ip}", DDOS_BURST_LIMIT, DDOS_BURST_WINDOW):
            self._record_violation(ip)
            return False, "Слишком много запросов за короткий период."

        return True, ""


    def report_abuse(self, ip):
        self._record_violation(ip)


ddos_guard = DDoSGuard()
