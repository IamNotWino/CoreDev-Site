import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock

EKAT_TZ = timezone(timedelta(hours=5))
EKAT_TZ_NAME = "Asia/Yekaterinburg"
RU_MONTHS = (
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
)
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "site_events.json"
MAX_EVENTS = 1500


class SiteEventLog:
    def __init__(self):
        self._lock = Lock()
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def format_ekat_timestamp(ts=None):
        moment = datetime.fromtimestamp(int(ts or time.time()), EKAT_TZ)
        month = RU_MONTHS[moment.month - 1]
        return f"{moment.day} {month} {moment.year} {moment.strftime('%H:%M')}"

    @staticmethod
    def _normalize_entry(entry):
        if not isinstance(entry, dict):
            return entry
        normalized = dict(entry)
        if normalized.get("at"):
            normalized["at_local"] = SiteEventLog.format_ekat_timestamp(normalized["at"])
        return normalized

    def _load(self):
        if not DATA_PATH.exists():
            return []
        try:
            with DATA_PATH.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []

    def _save(self, events):
        with DATA_PATH.open("w", encoding="utf-8") as handle:
            json.dump(events[:MAX_EVENTS], handle, ensure_ascii=False, indent=2)

    def record(
        self,
        event_type,
        message,
        *,
        actor_email="",
        target_email="",
        user_id="",
        ip="",
        meta=None,
    ):
        now = int(time.time())
        entry = {
            "id": secrets.token_urlsafe(10),
            "at": now,
            "at_local": self.format_ekat_timestamp(now),
            "timezone": EKAT_TZ_NAME,
            "event": str(event_type or "").strip() or "unknown",
            "message": str(message or "").strip(),
            "actor_email": str(actor_email or "").strip().lower(),
            "target_email": str(target_email or "").strip().lower(),
            "user_id": str(user_id or "").strip(),
            "ip": str(ip or "").strip(),
            "meta": meta if isinstance(meta, dict) else {},
        }
        with self._lock:
            events = self._load()
            events.insert(0, entry)
            self._save(events)
        return entry

    def list_events(self, limit=100, offset=0):
        safe_limit = max(1, min(int(limit or 100), 500))
        safe_offset = max(0, int(offset or 0))
        with self._lock:
            events = self._load()
        total = len(events)
        page = [
            self._normalize_entry(entry)
            for entry in events[safe_offset:safe_offset + safe_limit]
        ]
        return page, total


site_event_log = SiteEventLog()


def record_site_event(event_type, message, **kwargs):
    try:
        return site_event_log.record(event_type, message, **kwargs)
    except Exception as error:
        print(f"[site-event-log] failed to record event: {error}")
        return None
