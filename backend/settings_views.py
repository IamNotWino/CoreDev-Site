from http import HTTPStatus
import time

from .account_store import account_store
from .auth_tokens import extract_session_token, verify_session_token
from .captcha import get_captcha_block_status_for_client
from .http import CLIENT_DISCONNECT_ERRORS, json_response, read_json_body
from .security_check import get_client_ip
from .site_event_log import record_site_event
from .views import enforce_rate_limit


def _session_from_request(handler, payload=None):
    token = extract_session_token(handler, payload)
    session = verify_session_token(token)
    if not session:
        return None, token

    session_id = session.get("session_id")
    if session_id and not account_store.is_session_active(session["user_id"], session_id, token):
        ip = get_client_ip(handler)
        user_agent = handler.headers.get("User-Agent", "")
        ttl_seconds = max(int(session.get("exp", 0)) - int(time.time()), 60)
        if not account_store.recover_session(
            session["user_id"],
            session["email"],
            token,
            session_id,
            ip,
            user_agent,
            ttl_seconds=ttl_seconds,
        ):
            return None, token

    account_store.touch_session(session["user_id"], session.get("session_id"), token)
    return session, token


def _require_session(handler, payload=None):
    session, token = _session_from_request(handler, payload)
    if session:
        return session
    if token and verify_session_token(token):
        json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Сессия недействительна. Войдите снова."})
        return None
    json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Требуется авторизация"})
    return None


def _read_optional_json_body(handler):
    if handler.command != "POST":
        return {}
    try:
        return read_json_body(handler)
    except ValueError:
        return {}


def settings_bundle_view(handler):
    try:
        if not enforce_rate_limit(handler, "settings", limit=40, window_seconds=60):
            return
        payload = _read_optional_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return
        bundle = account_store.get_settings_bundle(
            session["user_id"],
            session["email"],
            session.get("session_id"),
        )
        ip = get_client_ip(handler)
        blocked, retry_after = get_captcha_block_status_for_client(session["email"], ip)
        bundle["security"] = {
            "captcha_blocked": blocked,
            "captcha_retry_after": retry_after,
        }
        json_response(handler, HTTPStatus.OK, bundle)
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить настройки"})


def settings_update_view(handler):
    try:
        if not enforce_rate_limit(handler, "settings-update", limit=30, window_seconds=60):
            return
        payload = read_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return
        settings = account_store.update_settings(session["user_id"], payload.get("settings", payload))
        json_response(handler, HTTPStatus.OK, {"settings": settings, "message": "Настройки сохранены"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось сохранить настройки"})


def sessions_revoke_all_view(handler):
    try:
        if not enforce_rate_limit(handler, "sessions-revoke", limit=10, window_seconds=300):
            return
        payload = read_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return
        account_store.revoke_all_sessions(session["user_id"], except_session_id=session.get("session_id"))
        json_response(handler, HTTPStatus.OK, {"message": "Все другие сессии завершены"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось завершить сессии"})


def logout_view(handler):
    try:
        payload = read_json_body(handler)
        session, _token = _session_from_request(handler, payload)
        if session and session.get("session_id"):
            account_store.revoke_session(session["user_id"], session["session_id"])
            record_site_event(
                "user_logout",
                f"Пользователь {session.get('email') or ''} вышел из аккаунта",
                actor_email=session.get("email") or "",
                target_email=session.get("email") or "",
                user_id=str(session.get("user_id") or ""),
                ip=get_client_ip(handler),
            )
        json_response(handler, HTTPStatus.OK, {"message": "Выход выполнен"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка выхода"})


def project_draft_view(handler):
    try:
        if not enforce_rate_limit(handler, "project-draft", limit=40, window_seconds=60):
            return
        session = _require_session(handler, {})
        if not session:
            return
        draft = account_store.get_draft(session["user_id"])
        json_response(handler, HTTPStatus.OK, {"draft": draft})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить черновик"})


def project_draft_save_view(handler):
    try:
        if not enforce_rate_limit(handler, "project-draft-save", limit=60, window_seconds=60):
            return
        payload = read_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return
        draft = account_store.save_draft(session["user_id"], payload.get("draft", payload))
        json_response(handler, HTTPStatus.OK, {"draft": draft, "message": "Черновик сохранён"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось сохранить черновик"})


def project_draft_delete_view(handler):
    try:
        if not enforce_rate_limit(handler, "project-draft-delete", limit=20, window_seconds=60):
            return
        payload = read_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return
        account_store.delete_draft(session["user_id"])
        json_response(handler, HTTPStatus.OK, {"message": "Черновик удалён"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось удалить черновик"})
