import json
import secrets
import time
from pathlib import Path
from threading import Lock

from .settings import BASE_DIR

EMAIL_VERIFY_TTL_SECONDS = 600
PENDING_PATH = BASE_DIR / "data" / "email_verification_pending.json"
_lock = Lock()


def _load_pending():
    if not PENDING_PATH.exists():
        return {}
    try:
        data = json.loads(PENDING_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_pending(data):
    PENDING_PATH.parent.mkdir(parents=True, exist_ok=True)
    PENDING_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _cleanup_pending(pending):
    now = int(time.time())
    return {
        key: entry
        for key, entry in pending.items()
        if isinstance(entry, dict) and int(entry.get("exp", 0)) > now
    }


def _normalize_email(email):
    return str(email or "").strip().lower()


def create_email_verification_code(email, user_id, ttl_seconds=EMAIL_VERIFY_TTL_SECONDS):
    email = _normalize_email(email)
    user_id = str(user_id or "").strip()
    if not email or not user_id:
        raise ValueError("email and user_id are required")

    code = f"{secrets.randbelow(1000000):06d}"
    exp = int(time.time()) + int(ttl_seconds)
    entry = {
        "email": email,
        "user_id": user_id,
        "code": code,
        "exp": exp,
        "created_at": int(time.time()),
    }

    with _lock:
        pending = _cleanup_pending(_load_pending())
        pending[email] = entry
        _save_pending(pending)

    return code


def verify_email_verification_code(email, code):
    email = _normalize_email(email)
    code = str(code or "").strip()
    if not email or len(code) != 6 or not code.isdigit():
        return False

    with _lock:
        pending = _cleanup_pending(_load_pending())
        entry = pending.get(email)
        if not entry:
            _save_pending(pending)
            return False

        if int(entry.get("exp", 0)) < int(time.time()):
            pending.pop(email, None)
            _save_pending(pending)
            return False

        if str(entry.get("code") or "") != code:
            return False

        return True


def consume_email_verification_code(email, code):
    email = _normalize_email(email)
    code = str(code or "").strip()
    if not verify_email_verification_code(email, code):
        return False

    with _lock:
        pending = _cleanup_pending(_load_pending())
        entry = pending.get(email)
        if not entry or str(entry.get("code") or "") != code:
            return False
        pending.pop(email, None)
        _save_pending(pending)
    return True
