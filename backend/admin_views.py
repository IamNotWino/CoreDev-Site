from http import HTTPStatus

from .account_store import account_store
from .http import json_response, read_json_body
from .services import (
    ADMIN_PROFILE_ROLE,
    DEFAULT_PROFILE_ROLE,
    delete_auth_user,
    delete_profile,
    get_profile_by_auth_user_id,
    get_profile_by_email,
    list_all_registered_profiles,
    list_profiles,
    normalize_profile_role,
    profile_field_taken,
    update_auth_user_email,
    update_profile_fields,
    update_profile_role,
    validate_profile_role,
)
from .settings_views import _require_session
from .site_event_log import record_site_event
from .security_check import get_client_ip
from .sql_guard import (
    InputSecurityError,
    validate_email,
    validate_full_name,
    validate_phone,
    validate_username,
    validate_uuid,
)
from .supabase import get_supabase_error_message
from .views import enforce_rate_limit, is_admin_profile, serialize_profile


def _require_admin(handler, payload=None):
    session = _require_session(handler, payload)
    if not session:
        return None, None

    status, profiles = get_profile_by_auth_user_id(session["user_id"])
    if status >= 400:
        json_response(handler, HTTPStatus.FORBIDDEN, {"error": "Доступ запрещён"})
        return None, None

    profile = profiles[0] if profiles else None
    if not is_admin_profile(profile):
        json_response(handler, HTTPStatus.FORBIDDEN, {"error": "Требуются права администратора"})
        return None, None

    return session, profile


def _is_registered_profile(profile):
    if not profile or not isinstance(profile, dict):
        return False
    return bool(str(profile.get("auth_user_id") or "").strip()) and bool(str(profile.get("email") or "").strip())


def _serialize_admin_user(profile):
    if not _is_registered_profile(profile):
        return None
    user_id = profile.get("auth_user_id")
    role = normalize_profile_role(profile.get("role"))
    return {
        "id": user_id,
        "email": profile.get("email") or "",
        "username": profile.get("username") or "",
        "full_name": profile.get("full_name") or "",
        "phone": account_store.get_phone(user_id) if user_id else "",
        "role": role,
        "is_admin": role == ADMIN_PROFILE_ROLE,
        "email_verified": account_store.is_email_verified(user_id) if user_id else False,
    }


def _sort_admin_users(users):
    return sorted(
        users,
        key=lambda item: (
            0 if item.get("is_admin") else 1,
            str(item.get("email") or "").lower(),
        ),
    )


def _resolve_target_profile(payload):
    target_user_id = str(payload.get("user_id") or "").strip()
    target_email = str(payload.get("email") or "").strip().lower()
    target_profile = None

    if target_user_id:
        target_user_id = validate_uuid(target_user_id, "user_id")
        status, profiles = get_profile_by_auth_user_id(target_user_id)
        if status < 400 and profiles:
            target_profile = profiles[0]
    elif target_email:
        target_email = validate_email(target_email)
        status, profiles = get_profile_by_email(target_email)
        if status < 400 and profiles:
            target_profile = profiles[0]
    else:
        raise InputSecurityError("Укажите email или user_id")

    if not target_profile:
        raise InputSecurityError("Пользователь не найден")
    return target_profile


def admin_overview_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-overview", limit=30, window_seconds=60):
            return

        payload = {}
        if handler.command == "POST":
            try:
                payload = read_json_body(handler)
            except ValueError:
                payload = {}

        session, admin_profile = _require_admin(handler, payload)
        if not session:
            return

        status, profiles = list_profiles(limit=200, offset=0)
        if status >= 400:
            json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить пользователей"})
            return

        users = profiles or []
        admin_count = sum(
            1 for item in users
            if normalize_profile_role(item.get("role")) == ADMIN_PROFILE_ROLE
        )
        verified_count = sum(
            1 for item in users
            if account_store.is_email_verified(item.get("auth_user_id"))
        )
        store_stats = account_store.get_admin_stats()

        json_response(handler, HTTPStatus.OK, {
            "total_users": len(users),
            "admin_count": admin_count,
            "verified_count": verified_count,
            "member_count": max(len(users) - admin_count, 0),
            "store": store_stats,
            "current_admin": serialize_profile(admin_profile) if admin_profile else None,
        })
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить панель администратора"})


def admin_users_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-users", limit=40, window_seconds=60):
            return

        payload = {}
        if handler.command == "POST":
            try:
                payload = read_json_body(handler)
            except ValueError:
                payload = {}

        session, _ = _require_admin(handler, payload)
        if not session:
            return

        status, profiles = list_all_registered_profiles()
        if status >= 400:
            message = get_supabase_error_message(profiles, "Не удалось загрузить список пользователей")
            json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": message})
            return

        users = _sort_admin_users([
            item for item in (_serialize_admin_user(profile) for profile in (profiles or []))
            if item
        ])
        json_response(handler, HTTPStatus.OK, {
            "users": users,
            "count": len(users),
            "total": len(users),
            "source": "supabase_profiles",
        })
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except Exception as error:
        print(f"[admin-users] failed to load profiles: {error}")
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить список пользователей"})


def admin_set_role_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-set-role", limit=20, window_seconds=300):
            return

        payload = read_json_body(handler)
        session, admin_profile = _require_admin(handler, payload)
        if not session:
            return

        role = validate_profile_role(payload.get("role"))
        target_user_id = str(payload.get("user_id") or "").strip()
        target_email = str(payload.get("email") or "").strip().lower()

        target_profile = None
        if target_user_id:
            target_user_id = validate_uuid(target_user_id, "user_id")
            status, profiles = get_profile_by_auth_user_id(target_user_id)
            if status < 400 and profiles:
                target_profile = profiles[0]
        elif target_email:
            target_email = validate_email(target_email)
            status, profiles = get_profile_by_email(target_email)
            if status < 400 and profiles:
                target_profile = profiles[0]
        else:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Укажите email или user_id"})
            return

        if not target_profile:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Пользователь не найден"})
            return

        if (
            role == DEFAULT_PROFILE_ROLE
            and normalize_profile_role(target_profile.get("role")) == ADMIN_PROFILE_ROLE
            and str(target_profile.get("auth_user_id")) == str(session["user_id"])
        ):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Нельзя снять права администратора с самого себя"})
            return

        patch_status, patch_result = update_profile_role(target_profile, role)
        if patch_status >= 400:
            message = str(patch_result.get("message") if isinstance(patch_result, dict) else patch_result or "Не удалось обновить роль")
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
            return

        updated = dict(target_profile)
        updated["role"] = role
        target_email_value = updated.get("email") or target_email
        actor_email = session.get("email") or ""
        if role == ADMIN_PROFILE_ROLE:
            record_site_event(
                "role_granted_admin",
                f"Пользователю {target_email_value} выданы права администратора",
                actor_email=actor_email,
                target_email=target_email_value,
                user_id=str(updated.get("auth_user_id") or ""),
                ip=get_client_ip(handler),
            )
        else:
            record_site_event(
                "role_revoked_admin",
                f"У пользователя {target_email_value} сняты права администратора",
                actor_email=actor_email,
                target_email=target_email_value,
                user_id=str(updated.get("auth_user_id") or ""),
                ip=get_client_ip(handler),
            )
        json_response(handler, HTTPStatus.OK, {
            "message": "Роль обновлена",
            "user": _serialize_admin_user(updated),
        })
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось обновить роль"})


def admin_update_user_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-update-user", limit=30, window_seconds=300):
            return

        payload = read_json_body(handler)
        session, _ = _require_admin(handler, payload)
        if not session:
            return

        field = str(payload.get("field") or "").strip().lower()
        value = payload.get("value")
        if field not in {"email", "full_name", "username", "role", "phone"}:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректное поле для изменения"})
            return

        target_profile = _resolve_target_profile(payload)
        user_id = str(target_profile.get("auth_user_id") or "")
        actor_email = session.get("email") or ""
        ip = get_client_ip(handler)

        if field == "role":
            role = validate_profile_role(value)
            if (
                role == DEFAULT_PROFILE_ROLE
                and normalize_profile_role(target_profile.get("role")) == ADMIN_PROFILE_ROLE
                and user_id == str(session["user_id"])
            ):
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Нельзя снять права администратора с самого себя"})
                return
            patch_status, patch_result = update_profile_role(target_profile, role)
            if patch_status >= 400:
                message = get_supabase_error_message(patch_result, "Не удалось обновить роль")
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
                return
            updated = dict(target_profile)
            updated["role"] = role
            event_type = "role_granted_admin" if role == ADMIN_PROFILE_ROLE else "role_revoked_admin"
            event_message = (
                f"Пользователю {updated.get('email')} выданы права администратора"
                if role == ADMIN_PROFILE_ROLE
                else f"У пользователя {updated.get('email')} сняты права администратора"
            )
            record_site_event(event_type, event_message, actor_email=actor_email, target_email=updated.get("email") or "", user_id=user_id, ip=ip)
            json_response(handler, HTTPStatus.OK, {"message": "Роль обновлена", "user": _serialize_admin_user(updated)})
            return

        if field == "phone":
            phone_value = str(value or "").strip()
            if phone_value:
                phone_value = validate_phone(phone_value)
            account_store.update_settings(user_id, {"phone": phone_value, "phone_verified": False})
            record_site_event(
                "admin_user_updated",
                f"Администратор изменил номер телефона пользователя {target_profile.get('email')}",
                actor_email=actor_email,
                target_email=target_profile.get("email") or "",
                user_id=user_id,
                ip=ip,
                meta={"field": "phone"},
            )
            json_response(handler, HTTPStatus.OK, {
                "message": "Номер телефона обновлён",
                "user": _serialize_admin_user(target_profile),
            })
            return

        if field == "email":
            new_email = validate_email(str(value or "").strip().lower())
            if profile_field_taken("email", new_email, exclude_auth_user_id=user_id):
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Этот email уже зарегистрирован"})
                return
            auth_status, auth_result = update_auth_user_email(user_id, new_email)
            if auth_status >= 400:
                message = get_supabase_error_message(auth_result, "Не удалось обновить почту")
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
                return
            patch_status, patch_result = update_profile_fields(target_profile, {"email": new_email})
            if patch_status >= 400:
                message = get_supabase_error_message(patch_result, "Не удалось обновить профиль")
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
                return
            updated = dict(target_profile)
            updated["email"] = new_email
            record_site_event(
                "admin_user_updated",
                f"Администратор изменил почту пользователя {target_profile.get('email')} на {new_email}",
                actor_email=actor_email,
                target_email=new_email,
                user_id=user_id,
                ip=ip,
                meta={"field": "email", "old_email": target_profile.get("email")},
            )
            json_response(handler, HTTPStatus.OK, {"message": "Почта обновлена", "user": _serialize_admin_user(updated)})
            return

        if field == "full_name":
            new_full_name = validate_full_name(str(value or "").strip())
            if profile_field_taken("full_name", new_full_name, exclude_auth_user_id=user_id):
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Пользователь с таким ФИО уже зарегистрирован"})
                return
            patch_status, patch_result = update_profile_fields(target_profile, {"full_name": new_full_name})
            if patch_status >= 400:
                message = get_supabase_error_message(patch_result, "Не удалось обновить ФИО")
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
                return
            updated = dict(target_profile)
            updated["full_name"] = new_full_name
            record_site_event(
                "admin_user_updated",
                f"Администратор изменил ФИО пользователя {target_profile.get('email')}",
                actor_email=actor_email,
                target_email=target_profile.get("email") or "",
                user_id=user_id,
                ip=ip,
                meta={"field": "full_name"},
            )
            json_response(handler, HTTPStatus.OK, {"message": "ФИО обновлено", "user": _serialize_admin_user(updated)})
            return

        if field == "username":
            new_username = validate_username(str(value or "").strip())
            if profile_field_taken("username", new_username, exclude_auth_user_id=user_id):
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Этот ник уже занят"})
                return
            patch_status, patch_result = update_profile_fields(target_profile, {"username": new_username})
            if patch_status >= 400:
                message = get_supabase_error_message(patch_result, "Не удалось обновить ник")
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
                return
            updated = dict(target_profile)
            updated["username"] = new_username
            record_site_event(
                "admin_user_updated",
                f"Администратор изменил ник пользователя {target_profile.get('email')}",
                actor_email=actor_email,
                target_email=target_profile.get("email") or "",
                user_id=user_id,
                ip=ip,
                meta={"field": "username"},
            )
            json_response(handler, HTTPStatus.OK, {"message": "Ник обновлён", "user": _serialize_admin_user(updated)})
            return

        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректное поле для изменения"})
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception as error:
        print(f"[admin-update-user] failed: {error}")
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось обновить пользователя"})


def admin_delete_user_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-delete-user", limit=10, window_seconds=300):
            return

        payload = read_json_body(handler)
        session, _ = _require_admin(handler, payload)
        if not session:
            return

        target_profile = _resolve_target_profile(payload)
        user_id = str(target_profile.get("auth_user_id") or "")
        target_email = target_profile.get("email") or ""

        if user_id == str(session["user_id"]):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Нельзя удалить свой аккаунт через админ-панель"})
            return

        profile_status, profile_result = delete_profile(target_profile)
        if profile_status >= 400:
            message = get_supabase_error_message(profile_result, "Не удалось удалить профиль")
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
            return

        auth_status, auth_result = delete_auth_user(user_id)
        if auth_status >= 400:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Профиль удалён, но аккаунт не удалён полностью"})
            return

        from .support_store import support_store

        support_store.delete_user_data(user_id)
        account_store.delete_user_data(user_id)
        account_store.revoke_all_sessions(user_id)
        record_site_event(
            "account_deleted",
            f"Администратор удалил аккаунт пользователя {target_email}",
            actor_email=session.get("email") or "",
            target_email=target_email,
            user_id=user_id,
            ip=get_client_ip(handler),
            meta={"source": "admin"},
        )
        json_response(handler, HTTPStatus.OK, {"message": "Аккаунт удалён"})
    except InputSecurityError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception as error:
        print(f"[admin-delete-user] failed: {error}")
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось удалить аккаунт"})


def admin_notifications_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-notifications", limit=60, window_seconds=60):
            return

        payload = {}
        if handler.command == "POST":
            try:
                payload = read_json_body(handler)
            except ValueError:
                payload = {}

        session, _ = _require_admin(handler, payload)
        if not session:
            return

        from .site_event_log import site_event_log
        from .support_store import support_store

        events, logs_total = site_event_log.list_events(limit=1, offset=0)
        latest_log = events[0] if events else None

        status, profiles = list_all_registered_profiles()
        if status >= 400:
            json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить данные"})
            return

        users_total = len(profiles or [])

        json_response(handler, HTTPStatus.OK, {
            "support_unread": support_store.count_unread_admin_total(),
            "latest_log_at": int(latest_log.get("at") or 0) if latest_log else 0,
            "latest_log_id": str(latest_log.get("id") or "") if latest_log else "",
            "logs_total": logs_total,
            "users_total": users_total,
        })
    except Exception as error:
        print(f"[admin-notifications] failed: {error}")
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить уведомления"})


def admin_logs_view(handler):
    try:
        if not enforce_rate_limit(handler, "admin-logs", limit=40, window_seconds=60):
            return

        payload = {}
        if handler.command == "POST":
            try:
                payload = read_json_body(handler)
            except ValueError:
                payload = {}

        session, _ = _require_admin(handler, payload)
        if not session:
            return

        from .site_event_log import site_event_log

        limit = int(payload.get("limit") or 200)
        offset = int(payload.get("offset") or 0)
        events, total = site_event_log.list_events(limit=limit, offset=offset)
        json_response(handler, HTTPStatus.OK, {
            "logs": events,
            "count": len(events),
            "total": total,
            "limit": max(1, min(limit, 500)),
            "offset": max(0, offset),
            "timezone": "Asia/Yekaterinburg",
        })
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить логи"})
