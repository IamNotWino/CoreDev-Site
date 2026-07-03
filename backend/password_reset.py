import base64
import hashlib
import hmac
import json
import secrets
import time
from pathlib import Path
from threading import Lock

from .settings import BASE_DIR, SESSION_SECRET

RESET_TTL_SECONDS = 600
USED_TOKENS_PATH = BASE_DIR / "data" / "password_reset_used.json"
PENDING_RESETS_PATH = BASE_DIR / "data" / "password_reset_pending.json"
_used_lock = Lock()
_pending_lock = Lock()


def _safe_compare_digest(expected, actual):
    try:
        left = expected.encode("ascii") if isinstance(expected, str) else expected
        right = actual.encode("ascii") if isinstance(actual, str) else actual
        return hmac.compare_digest(left, right)
    except (TypeError, ValueError, UnicodeEncodeError):
        return False


def _encode_payload(payload):
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _decode_payload(encoded):
    padding = "=" * (-len(encoded) % 4)
    raw = base64.urlsafe_b64decode(encoded + padding)
    return json.loads(raw.decode("utf-8"))


def _load_pending_resets():
    if not PENDING_RESETS_PATH.exists():
        return {}
    try:
        data = json.loads(PENDING_RESETS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_pending_resets(data):
    PENDING_RESETS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PENDING_RESETS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _cleanup_pending_resets(pending):
    now = int(time.time())
    return {
        code: entry
        for code, entry in pending.items()
        if isinstance(entry, dict) and int(entry.get("exp", 0)) > now and not entry.get("used")
    }


def create_password_reset_token(email, user_id, ttl_seconds=RESET_TTL_SECONDS):
    email = str(email or "").strip().lower()
    user_id = str(user_id or "").strip()
    if not email or not user_id:
        raise ValueError("email and user_id are required")

    code = secrets.token_urlsafe(18)
    exp = int(time.time()) + int(ttl_seconds)
    entry = {
        "email": email,
        "user_id": user_id,
        "exp": exp,
        "used": False,
        "created_at": int(time.time()),
    }

    with _pending_lock:
        pending = _cleanup_pending_resets(_load_pending_resets())
        while code in pending:
            code = secrets.token_urlsafe(18)
        pending[code] = entry
        _save_pending_resets(pending)

    return code


def _verify_legacy_password_reset_token(token):
    if not token or "." not in token:
        return None

    encoded, signature = token.rsplit(".", 1)
    expected = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not _safe_compare_digest(expected, signature):
        return None

    try:
        payload = _decode_payload(encoded)
    except (json.JSONDecodeError, ValueError):
        return None

    if payload.get("purpose") != "password_reset":
        return None
    if payload.get("exp", 0) < int(time.time()):
        return None

    email = str(payload.get("email") or "").strip().lower()
    user_id = str(payload.get("user_id") or "").strip()
    jti = str(payload.get("jti") or "").strip()
    if not email or not user_id or not jti:
        return None

    return {
        "email": email,
        "user_id": user_id,
        "jti": jti,
        "exp": payload["exp"],
        "code": None,
    }


def _verify_pending_reset_code(code):
    normalized = str(code or "").strip()
    if not normalized:
        return None

    with _pending_lock:
        pending = _cleanup_pending_resets(_load_pending_resets())
        entry = pending.get(normalized)
        if not entry or entry.get("used"):
            _save_pending_resets(pending)
            return None

        if int(entry.get("exp", 0)) < int(time.time()):
            pending.pop(normalized, None)
            _save_pending_resets(pending)
            return None

        email = str(entry.get("email") or "").strip().lower()
        user_id = str(entry.get("user_id") or "").strip()
        if not email or not user_id:
            return None

        return {
            "email": email,
            "user_id": user_id,
            "jti": normalized,
            "exp": int(entry.get("exp", 0)),
            "code": normalized,
        }


def verify_password_reset_token(token):
    token = str(token or "").strip()
    if not token:
        return None

    # Prefer short server-side reset codes from email links.
    if "." not in token or len(token) < 40:
        pending = _verify_pending_reset_code(token)
        if pending:
            return pending

    if "." in token:
        legacy = _verify_legacy_password_reset_token(token)
        if legacy:
            return legacy

    return _verify_pending_reset_code(token)


def _load_used_tokens():
    if not USED_TOKENS_PATH.exists():
        return {}
    try:
        data = json.loads(USED_TOKENS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_used_tokens(data):
    USED_TOKENS_PATH.parent.mkdir(parents=True, exist_ok=True)
    USED_TOKENS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def is_reset_token_used(jti):
    if not jti:
        return True
    with _used_lock:
        used = _load_used_tokens()
        return jti in used


def get_reset_link_status(token):
    token = str(token or "").strip()
    if not token:
        return "invalid"

    if is_reset_token_used(token):
        return "used"

    if verify_password_reset_token(token):
        return "valid"

    return "expired"


def mark_reset_token_used(jti, exp, code=None):
    if not jti:
        return

    now = int(time.time())
    with _used_lock:
        used = _load_used_tokens()
        used = {key: value for key, value in used.items() if int(value.get("exp", 0)) > now}
        used[jti] = {"exp": int(exp), "used_at": now}
        _save_used_tokens(used)

    if code:
        with _pending_lock:
            pending = _cleanup_pending_resets(_load_pending_resets())
            entry = pending.get(code)
            if entry:
                entry["used"] = True
            pending.pop(code, None)
            _save_pending_resets(pending)
