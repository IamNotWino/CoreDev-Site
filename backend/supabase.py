import json
import urllib.error
import urllib.parse
import urllib.request

from .settings import SUPABASE_SECRET_KEY, SUPABASE_URL
from .sql_guard import InputSecurityError, validate_postgrest_filter_value, validate_uuid


def require_supabase_config():
    if not SUPABASE_SECRET_KEY:
        raise RuntimeError("SUPABASE_SECRET_KEY is not configured")


def _sanitize_query(query):
    safe_query = {}
    for key, value in (query or {}).items():
        key_name = str(key).strip()
        if not key_name or contains_unsafe_query_key(key_name):
            raise InputSecurityError("Некорректный запрос к базе данных")

        if key_name == "select":
            safe_query[key_name] = sanitize_select_clause(value)
            continue

        if key_name == "order":
            safe_query[key_name] = sanitize_order_clause(value)
            continue

        if key_name == "limit":
            safe_query[key_name] = sanitize_numeric_query_value(value, field_name="limit", max_value=500)
            continue

        if key_name == "offset":
            safe_query[key_name] = sanitize_numeric_query_value(value, field_name="offset", max_value=10000)
            continue

        safe_query[key_name] = validate_postgrest_filter_value(value, key_name)
    return safe_query


def contains_unsafe_query_key(key):
    lowered = key.lower()
    return any(token in lowered for token in (".", "(", ")", ",", ";", " "))


ALLOWED_PROFILE_SELECTS = frozenset({
    "id,auth_user_id,full_name,username,email,password_hash,role",
    "id,auth_user_id,full_name,username,email,role",
})
ALLOWED_PROFILE_ORDERS = frozenset({
    "email.asc",
    "email.desc",
})


def sanitize_select_clause(value):
    text = str(value or "").strip()
    if text not in ALLOWED_PROFILE_SELECTS:
        raise InputSecurityError("Некорректный запрос к базе данных")
    return text


def sanitize_numeric_query_value(value, *, field_name="limit", max_value=500):
    text = str(value or "").strip()
    if not text.isdigit():
        raise InputSecurityError("Некорректный запрос к базе данных")
    number = int(text)
    if number < 0 or number > max_value:
        raise InputSecurityError("Некорректный запрос к базе данных")
    return text


def sanitize_order_clause(value):
    text = str(value or "").strip()
    if text not in ALLOWED_PROFILE_ORDERS:
        raise InputSecurityError("Некорректный запрос к базе данных")
    return text


def sanitize_supabase_path(path):
    if ".." in path or " " in path:
        raise InputSecurityError("Некорректный запрос к базе данных")
    return path


def supabase_request(method, path, payload=None, query=None):
    require_supabase_config()
    path = sanitize_supabase_path(path)
    safe_query = _sanitize_query(query) if query else None

    url = f"{SUPABASE_URL}{path}"
    if safe_query:
        url = f"{url}?{urllib.parse.urlencode(safe_query)}"

    data = None
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Prefer"] = "return=representation"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else None
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            details = json.loads(body) if body else {}
        except json.JSONDecodeError:
            details = {"message": body}
        return error.code, details


def get_supabase_error_message(details, fallback):
    if isinstance(details, dict):
        return (
            details.get("message")
            or details.get("msg")
            or details.get("error_description")
            or details.get("error")
            or fallback
        )
    return fallback
