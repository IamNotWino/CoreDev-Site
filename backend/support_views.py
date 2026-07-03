from http import HTTPStatus

from .admin_views import _require_admin
from .http import json_response, read_json_body
from .security_check import get_client_ip
from .services import get_profile_by_auth_user_id
from .settings_views import _require_session
from .site_event_log import record_site_event
from .sql_guard import InputSecurityError, validate_safe_text, validate_uuid
from .support_store import MAX_TEXT_LENGTH, support_store
from .views import enforce_rate_limit, is_admin_profile


def _read_optional_json_body(handler):
    if handler.command != "POST":
        return {}
    try:
        return read_json_body(handler)
    except ValueError:
        return {}


def _serialize_messages(messages):
    return [
        {
            "id": item.get("id"),
            "sender": item.get("sender"),
            "text": item.get("text") or "",
            "at": item.get("at"),
            "at_local": item.get("at_local") or "",
            "read_by_user": bool(item.get("read_by_user")),
            "read_by_admin": bool(item.get("read_by_admin")),
        }
        for item in (messages or [])
    ]


def support_messages_view(handler):
    try:
        if not enforce_rate_limit(handler, "support-messages", limit=60, window_seconds=60):
            return

        payload = _read_optional_json_body(handler)
        session = _require_session(handler, payload)
        if not session:
            return

        user_id = session["user_id"]
        status, profiles = get_profile_by_auth_user_id(user_id)
        profile = profiles[0] if status < 400 and profiles else {}
        if is_admin_profile(profile):
            json_response(handler, HTTPStatus.FORBIDDEN, {
                "error": "Администраторы принимают обращения в разделе «Поддержка» админ-панели",
            })
            return

        if handler.command == "POST" and payload.get("text"):
            text = validate_safe_text(payload.get("text"), "сообщение", max_length=MAX_TEXT_LENGTH, min_length=1)
            message, _thread = support_store.add_user_message(
                user_id,
                session.get("email") or profile.get("email") or "",
                profile.get("username") or "",
                text,
            )
            record_site_event(
                "support_message_user",
                f"Сообщение в поддержку от {session.get('email') or ''}",
                actor_email=session.get("email") or "",
                user_id=user_id,
                ip=get_client_ip(handler),
            )
            json_response(handler, HTTPStatus.OK, {
                "message": _serialize_messages([message])[0],
                "messages": _serialize_messages(support_store.list_user_messages(user_id)),
            })
            return

        messages = support_store.list_user_messages(user_id)
        json_response(handler, HTTPStatus.OK, {"messages": _serialize_messages(messages)})
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить чат поддержки"})


def admin_support_threads_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-support-threads", limit=40, window_seconds=60):
            return

        payload = _read_optional_json_body(handler)
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        threads = support_store.list_threads()
        json_response(handler, HTTPStatus.OK, {
            "threads": threads,
            "total": len(threads),
            "unread_total": support_store.count_unread_admin_total(),
        })
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить обращения"})


def admin_support_thread_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-support-thread", limit=60, window_seconds=60):
            return

        payload = _read_optional_json_body(handler)
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        user_id = validate_uuid(payload.get("user_id"), "user_id")
        thread = support_store.get_thread(user_id)
        if not thread:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Обращение не найдено"})
            return

        support_store.mark_read_by_admin(user_id)
        thread = support_store.get_thread(user_id)
        json_response(handler, HTTPStatus.OK, {
            "thread": {
                "user_id": thread.get("user_id"),
                "email": thread.get("email") or "",
                "username": thread.get("username") or "",
                "updated_at": thread.get("updated_at") or 0,
            },
            "messages": _serialize_messages(thread.get("messages")),
        })
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить переписку"})


def admin_support_reply_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-support-reply", limit=40, window_seconds=60):
            return

        payload = read_json_body(handler)
        session, profile = _require_admin(handler, payload)
        if not session:
            return

        user_id = validate_uuid(payload.get("user_id"), "user_id")
        text = validate_safe_text(payload.get("text"), "сообщение", max_length=MAX_TEXT_LENGTH, min_length=1)

        message, thread = support_store.add_admin_message(user_id, text)
        if not message:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Обращение не найдено"})
            return

        record_site_event(
            "support_message_admin",
            f"Ответ поддержки пользователю {thread.get('email') or user_id}",
            actor_email=session.get("email") or "",
            target_email=thread.get("email") or "",
            user_id=user_id,
            ip=get_client_ip(handler),
        )

        json_response(handler, HTTPStatus.OK, {
            "message": _serialize_messages([message])[0],
            "messages": _serialize_messages(thread.get("messages")),
        })
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось отправить ответ"})
