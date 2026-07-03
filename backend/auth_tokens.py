import base64
import hashlib
import hmac
import json
import time

from .settings import SESSION_SECRET


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


def create_session_token(email, user_id, ttl_seconds=86400, session_id=None):
    payload = {
        "email": email.lower(),
        "user_id": str(user_id),
        "exp": int(time.time()) + int(ttl_seconds),
        "sid": str(session_id or ""),
    }
    encoded = _encode_payload(payload)
    signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded}.{signature}"


def verify_session_token(token):
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

    if payload.get("exp", 0) < int(time.time()):
        return None

    email = str(payload.get("email") or "").strip().lower()
    user_id = str(payload.get("user_id") or "").strip()
    if not email or not user_id:
        return None

    return {
        "email": email,
        "user_id": user_id,
        "exp": payload["exp"],
        "session_id": str(payload.get("sid") or ""),
    }


def extract_session_token(handler, payload=None):
    payload = payload or {}
    token = str(payload.get("session_token") or "").strip()
    if token:
        return token

    auth_header = handler.headers.get("Authorization", "").strip()
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()

    return ""
