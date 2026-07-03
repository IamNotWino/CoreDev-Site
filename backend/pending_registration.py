import json
import secrets
import time
from pathlib import Path
from threading import Lock

from .settings import BASE_DIR

PENDING_REGISTRATION_TTL_SECONDS = 600
PENDING_PATH = BASE_DIR / "data" / "pending_registrations.json"
_lock = Lock()


def _normalize_email(email):
    return str(email or "").strip().lower()


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


def _generate_code():
    return f"{secrets.randbelow(1000000):06d}"


def find_pending_registration_conflict(email, username, full_name):
    email = _normalize_email(email)
    username = str(username or "").strip()
    full_name = str(full_name or "").strip()

    with _lock:
        pending = _cleanup_pending(_load_pending())
        for key, entry in pending.items():
            if not isinstance(entry, dict):
                continue
            entry_email = _normalize_email(entry.get("email"))
            if entry_email == email:
                continue
            if str(entry.get("username") or "").strip() == username:
                return "username"
            if str(entry.get("full_name") or "").strip() == full_name:
                return "full_name"
        _save_pending(pending)
    return None


def create_pending_registration(full_name, username, email, password, password_hash, ttl_seconds=PENDING_REGISTRATION_TTL_SECONDS):
    email = _normalize_email(email)
    full_name = str(full_name or "").strip()
    username = str(username or "").strip()
    password = str(password or "")
    password_hash = str(password_hash or "")
    if not all([full_name, username, email, password, password_hash]):
        raise ValueError("registration fields are required")

    code = _generate_code()
    now = int(time.time())
    entry = {
        "full_name": full_name,
        "username": username,
        "email": email,
        "password": password,
        "password_hash": password_hash,
        "code": code,
        "exp": now + int(ttl_seconds),
        "created_at": now,
    }

    with _lock:
        pending = _cleanup_pending(_load_pending())
        pending[email] = entry
        _save_pending(pending)

    return code


def get_pending_registration(email):
    email = _normalize_email(email)
    with _lock:
        pending = _cleanup_pending(_load_pending())
        entry = pending.get(email)
        _save_pending(pending)
        return dict(entry) if isinstance(entry, dict) else None


def delete_pending_registration(email):
    email = _normalize_email(email)
    with _lock:
        pending = _cleanup_pending(_load_pending())
        pending.pop(email, None)
        _save_pending(pending)


def refresh_pending_registration_code(email, ttl_seconds=PENDING_REGISTRATION_TTL_SECONDS):
    email = _normalize_email(email)
    with _lock:
        pending = _cleanup_pending(_load_pending())
        entry = pending.get(email)
        if not entry:
            _save_pending(pending)
            return None

        code = _generate_code()
        now = int(time.time())
        entry["code"] = code
        entry["exp"] = now + int(ttl_seconds)
        entry["created_at"] = now
        pending[email] = entry
        _save_pending(pending)
        return code


def consume_pending_registration(email, code):
    email = _normalize_email(email)
    code = str(code or "").strip()
    if not email or len(code) != 6 or not code.isdigit():
        return None

    with _lock:
        pending = _cleanup_pending(_load_pending())
        entry = pending.get(email)
        if not entry:
            _save_pending(pending)
            return None

        if int(entry.get("exp", 0)) < int(time.time()):
            pending.pop(email, None)
            _save_pending(pending)
            return None

        if str(entry.get("code") or "") != code:
            return None

        pending.pop(email, None)
        _save_pending(pending)
        consumed = dict(entry)
        consumed.pop("code", None)
        consumed.pop("exp", None)
        consumed.pop("created_at", None)
        return consumed
