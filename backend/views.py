from http import HTTPStatus
import secrets
import urllib.parse

from .account_store import account_store
from .email_notifications import (
    send_email_verification_code,
    send_password_reset_email,
    send_project_request_notification,
)
from .email_verification import (
    EMAIL_VERIFY_TTL_SECONDS,
    consume_email_verification_code,
    create_email_verification_code,
)
from .pending_registration import (
    PENDING_REGISTRATION_TTL_SECONDS,
    consume_pending_registration,
    create_pending_registration,
    delete_pending_registration,
    find_pending_registration_conflict,
    get_pending_registration,
    refresh_pending_registration_code,
)
from .password_reset import (
    RESET_TTL_SECONDS,
    create_password_reset_token,
    get_reset_link_status,
    is_reset_token_used,
    mark_reset_token_used,
    verify_password_reset_token,
)
from .settings import get_public_site_url
from .auth_tokens import create_session_token, extract_session_token, verify_session_token
from .ddos_guard import ddos_guard
from .http import json_response, read_json_body
from .rate_limit import rate_limiter
from .registration_errors import (
    REGISTRATION_FIELD_EMAIL,
    map_auth_registration_error,
    map_profile_registration_error,
    registration_conflict,
)
from .security import hash_password, verify_password
from .security_check import get_client_ip, run_security_check
from .site_event_log import record_site_event
from .blocklist import get_blocked_ips
from .sql_guard import (
    InputSecurityError,
    validate_email,
    validate_full_name,
    validate_password,
    validate_username,
)
from .services import (
    ADMIN_PROFILE_ROLE,
    create_auth_user,
    delete_auth_user,
    delete_profile,
    get_auth_user_by_email,
    get_profile_by_auth_user_id,
    get_profile_by_email,
    find_registration_conflict,
    insert_profile,
    insert_project_request,
    normalize_profile_role,
    normalize_text,
    update_auth_user_password,
    update_profile_password_hash,
)
from .captcha import (
    CAPTCHA_BLOCK_MESSAGE,
    clear_captcha_failures_for_client,
    generate_captcha_challenge,
    get_captcha_block_status_for_client,
    record_captcha_failure_for_client,
    verify_captcha_answer,
)
from .supabase import get_supabase_error_message


def enforce_rate_limit(handler, endpoint, limit, window_seconds=60):
    ip = get_client_ip(handler)
    if rate_limiter.allow(f"{endpoint}:{ip}", limit, window_seconds):
        return True
    ddos_guard.report_abuse(ip)
    json_response(handler, HTTPStatus.TOO_MANY_REQUESTS, {"error": "Слишком много запросов. Попробуйте позже."})
    return False


def reject_unsafe_input(handler, error):
    ddos_guard.report_abuse(get_client_ip(handler))
    json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    return False


def require_authenticated_session(handler, payload, email=None):
    token = extract_session_token(handler, payload)
    session = verify_session_token(token)
    if not session:
        json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Требуется авторизация"})
        return None

    if session.get("session_id") and not account_store.is_session_active(
        session["user_id"], session["session_id"], token
    ):
        json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Сессия недействительна"})
        return None

    if email and session["email"] != email.lower():
        json_response(handler, HTTPStatus.FORBIDDEN, {"error": "Доступ запрещён"})
        return None

    account_store.touch_session(session["user_id"], session.get("session_id"), token)
    return session


def issue_auth_session(handler, email, user_id, ttl_seconds):
    ip = get_client_ip(handler)
    user_agent = handler.headers.get("User-Agent", "")
    session_id = secrets.token_urlsafe(16)
    token = create_session_token(email, user_id, ttl_seconds=ttl_seconds, session_id=session_id)
    account_store.create_session(user_id, email, token, ttl_seconds, ip, user_agent, session_id=session_id)
    account_store.add_login_event(user_id, ip, user_agent, True)
    return token


def validate_register_payload(full_name, username, email, password):
    try:
        validate_full_name(full_name)
        validate_username(username)
        validate_email(email)
        validate_password(password)
        return None
    except InputSecurityError as error:
        return str(error)


def respond_registration_error(handler, error_message, field=None):
    payload = {"error": error_message}
    if field:
        payload["field"] = field
    json_response(handler, HTTPStatus.BAD_REQUEST, payload)


def dispatch_email_verification_code(email, user_id):
    verification_code = create_email_verification_code(email, user_id)
    email_sent, email_error = send_email_verification_code(
        email,
        verification_code,
        expires_minutes=EMAIL_VERIFY_TTL_SECONDS // 60,
    )
    if not email_sent:
        print(f"[email] verification code delivery failed for {email}: {email_error}")
    return email_sent, email_error


def complete_user_registration(handler, full_name, username, email, password, password_hash):
    user_id = None
    created_new_auth_user = False
    auth_status, auth_result = create_auth_user(email, password, full_name, username)
    if auth_status >= 400:
        auth_message, field = map_auth_registration_error(auth_result)
        if field == REGISTRATION_FIELD_EMAIL:
            orphan_status, orphan_user = get_auth_user_by_email(email)
            if orphan_status < 400 and orphan_user:
                user_id = orphan_user.get("id")
                password_status, password_result = update_auth_user_password(user_id, password)
                if password_status >= 400:
                    password_message = get_supabase_error_message(password_result, "Не удалось обновить пароль")
                    return None, password_message, None
            else:
                return None, auth_message, field
        else:
            return None, auth_message, field
    else:
        user_id = auth_result.get("id")
        created_new_auth_user = True

    profile_status, profile_result = insert_profile(user_id, full_name, username, email, password_hash)
    if profile_status >= 400:
        if created_new_auth_user:
            delete_auth_user(user_id)
        profile_message, field = map_profile_registration_error(profile_result)
        return None, profile_message, field

    account_store.set_email_verified(user_id, True)
    session_token = issue_auth_session(handler, email, user_id, 86400)
    user = {
        "id": user_id,
        "email": email,
        "username": username,
        "full_name": full_name,
        "role": "member",
        "is_admin": False,
        "email_verified": True,
    }
    return {
        "message": "Регистрация успешна",
        "session_token": session_token,
        "user": user,
        "email_verified": True,
    }, None, None


def block_status_view(handler):
    blocked = get_client_ip(handler) in get_blocked_ips()
    if blocked:
        json_response(handler, HTTPStatus.FORBIDDEN, {
            "blocked": True,
            "allowed": False,
            "message": "Ваш IP заблокирован политикой безопасности.",
        })
        return

    json_response(handler, HTTPStatus.OK, {
        "blocked": False,
        "allowed": True,
    })


def register_view(handler):
    try:
        if not enforce_rate_limit(handler, "register", limit=5, window_seconds=300):
            return

        payload = read_json_body(handler)
        full_name = normalize_text(payload.get("full_name"))
        username = normalize_text(payload.get("username"))
        email = normalize_text(payload.get("email")).lower()
        password = str(payload.get("password") or "")
        agree = bool(payload.get("agree"))

        if not all([full_name, username, email, password]) or not agree:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Заполните все поля регистрации"})
            return

        validation_error = validate_register_payload(full_name, username, email, password)
        if validation_error:
            respond_registration_error(handler, validation_error)
            return

        conflict_field = find_registration_conflict(email, username, full_name)
        if conflict_field:
            error_message, field = registration_conflict(conflict_field)
            respond_registration_error(handler, error_message, field)
            return

        pending_conflict = find_pending_registration_conflict(email, username, full_name)
        if pending_conflict:
            error_message, field = registration_conflict(pending_conflict)
            respond_registration_error(handler, error_message, field)
            return

        password_hash = hash_password(password)
        verification_code = create_pending_registration(
            full_name,
            username,
            email,
            password,
            password_hash,
            ttl_seconds=PENDING_REGISTRATION_TTL_SECONDS,
        )
        email_sent, email_error = send_email_verification_code(
            email,
            verification_code,
            expires_minutes=PENDING_REGISTRATION_TTL_SECONDS // 60,
        )
        if not email_sent:
            print(f"[email] registration code delivery failed for {email}: {email_error}")
            delete_pending_registration(email)
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Не удалось отправить письмо с кодом",
                "details": email_error,
            })
            return

        json_response(handler, HTTPStatus.OK, {
            "message": "На вашу почту отправлен код подтверждения. Аккаунт будет создан после ввода кода.",
            "pending_registration": True,
            "requires_email_verification": True,
            "email": email,
        })
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка регистрации"})


def security_check_view(handler):
    try:
        if not enforce_rate_limit(handler, "security-check", limit=30, window_seconds=60):
            return

        payload = read_json_body(handler)
        result = run_security_check(handler, payload)
        result.pop("ip", None)
        status = HTTPStatus.OK if result.get("allowed") else HTTPStatus.FORBIDDEN
        headers = {}
        if result.get("allowed"):
            headers["Set-Cookie"] = "coredev_security_passed=true; Path=/; HttpOnly; SameSite=Strict"
        json_response(handler, status, result, headers=headers)
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"allowed": False, "message": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {
            "allowed": False,
            "risk": "unknown",
            "message": "Ошибка проверки безопасности",
        })


def login_view(handler):
    try:
        if not enforce_rate_limit(handler, "login", limit=10, window_seconds=300):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())
        password = validate_password(str(payload.get("password") or ""))
        remember = bool(payload.get("remember"))

        if not email or not password:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Введите email и пароль"})
            return

        status, profiles = get_profile_by_email(email)
        profile = profiles[0] if status < 400 and profiles else None
        ip = get_client_ip(handler)
        user_agent = handler.headers.get("User-Agent", "")

        if not profile:
            pending = get_pending_registration(email)
            if pending and verify_password(password, pending.get("password_hash", "")):
                json_response(handler, HTTPStatus.UNAUTHORIZED, {
                    "error": "Регистрация не завершена. Введите код из письма, чтобы создать аккаунт.",
                    "requires_registration_confirmation": True,
                    "email": email,
                })
                return
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Неверный email или пароль"})
            return

        if not verify_password(password, profile.get("password_hash", "")):
            account_store.add_login_event(profile.get("auth_user_id"), ip, user_agent, False)
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Неверный email или пароль"})
            return

        ttl_seconds = 30 * 86400 if remember else 86400
        session_token = issue_auth_session(handler, email, profile.get("auth_user_id"), ttl_seconds)
        user_id = profile.get("auth_user_id")
        account_store.set_email_verified(user_id, True)

        response = {
            "message": "Вход выполнен",
            "session_token": session_token,
            "user": serialize_profile(profile),
            "requires_email_verification": False,
            "email_verified": True,
        }
        response["user"]["email_verified"] = True
        record_site_event(
            "user_login",
            f"Пользователь {email} вошёл в аккаунт",
            actor_email=email,
            target_email=email,
            user_id=str(user_id or ""),
            ip=ip,
        )
        json_response(handler, HTTPStatus.OK, response)
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка входа"})


def profile_view(handler):
    try:
        if not enforce_rate_limit(handler, "profile", limit=20, window_seconds=60):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())

        if not require_authenticated_session(handler, payload, email=email):
            return

        status, profiles = get_profile_by_email(email)
        if status >= 400:
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Не удалось получить профиль"})
            return

        profile = profiles[0] if profiles else None
        if not profile:
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Не удалось получить профиль"})
            return

        json_response(handler, HTTPStatus.OK, {"user": serialize_profile(profile)})
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка получения профиля"})


def change_password_view(handler):
    try:
        if not enforce_rate_limit(handler, "change-password", limit=5, window_seconds=300):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())
        old_password = validate_password(str(payload.get("old_password") or ""))
        new_password = validate_password(str(payload.get("new_password") or ""))

        if not require_authenticated_session(handler, payload, email=email):
            return

        status, profiles = get_profile_by_email(email)
        if status >= 400:
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Старый пароль неверный"})
            return

        profile = profiles[0] if profiles else None
        if not profile or not verify_password(old_password, profile.get("password_hash", "")):
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Старый пароль неверный"})
            return

        new_hash = hash_password(new_password)
        auth_status, auth_result = update_auth_user_password(profile.get("auth_user_id"), new_password)
        if auth_status >= 400:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не удалось обновить пароль"})
            return

        profile_status, profile_result = update_profile_password_hash(profile, new_hash)
        if profile_status >= 400:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не удалось сохранить новый пароль"})
            return

        record_site_event(
            "password_changed",
            f"Пользователь {email} сменил пароль",
            actor_email=email,
            target_email=email,
            user_id=str(profile.get("auth_user_id") or ""),
            ip=get_client_ip(handler),
        )
        json_response(handler, HTTPStatus.OK, {"message": "Пароль изменён"})
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка смены пароля"})


def delete_account_view(handler):
    try:
        if not enforce_rate_limit(handler, "delete-account", limit=3, window_seconds=300):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())
        password = validate_password(str(payload.get("password") or ""))

        session = require_authenticated_session(handler, payload, email=email)
        if not session:
            return

        user_id = str(session.get("user_id") or "").strip()
        if not user_id:
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Сессия недействительна"})
            return

        status, profiles = get_profile_by_auth_user_id(user_id)
        if status >= 400 or not profiles:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Профиль не найден"})
            return

        profile = profiles[0]
        profile_email = str(profile.get("email") or "").strip().lower()
        if profile_email != email:
            json_response(handler, HTTPStatus.FORBIDDEN, {"error": "Доступ запрещён"})
            return

        if not verify_password(password, profile.get("password_hash", "")):
            json_response(handler, HTTPStatus.UNAUTHORIZED, {"error": "Неверный пароль"})
            return

        from .support_store import support_store

        support_store.delete_user_data(user_id)

        profile_status, profile_result = delete_profile(profile)
        if profile_status >= 400:
            message = get_supabase_error_message(profile_result, "Не удалось удалить профиль")
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
            return

        auth_status, auth_result = delete_auth_user(user_id)
        if auth_status >= 400:
            message = get_supabase_error_message(auth_result, "Профиль удалён, но аккаунт не удалён полностью")
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": message})
            return

        account_store.delete_user_data(user_id)
        account_store.revoke_all_sessions(user_id)

        record_site_event(
            "user_account_deleted",
            f"Пользователь {email} удалил свой аккаунт",
            actor_email=email,
            target_email=email,
            user_id=user_id,
            ip=get_client_ip(handler),
            meta={"source": "self"},
        )
        json_response(handler, HTTPStatus.OK, {"message": "Аккаунт удалён"})
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception as error:
        print(f"[delete-account] failed: {error}")
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка удаления аккаунта"})


def captcha_blocked_response(handler, retry_after):
    json_response(
        handler,
        HTTPStatus.TOO_MANY_REQUESTS,
        {
            "error": CAPTCHA_BLOCK_MESSAGE,
            "captcha_blocked": True,
            "retry_after": retry_after,
        },
    )


def captcha_challenge_view(handler):
    try:
        if not enforce_rate_limit(handler, "captcha", limit=40, window_seconds=60):
            return

        session = require_authenticated_session(handler, {})
        if not session:
            return

        ip = get_client_ip(handler)
        blocked, retry_after = get_captcha_block_status_for_client(session["email"], ip)
        if blocked:
            captcha_blocked_response(handler, retry_after)
            return

        json_response(handler, HTTPStatus.OK, generate_captcha_challenge())
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось создать капчу"})


def project_request_view(handler):
    try:
        if not enforce_rate_limit(handler, "project-request", limit=5, window_seconds=300):
            return

        payload = read_json_body(handler)
        session = require_authenticated_session(handler, payload)
        if not session:
            return

        ip = get_client_ip(handler)
        blocked, retry_after = get_captcha_block_status_for_client(session["email"], ip)
        if blocked:
            captcha_blocked_response(handler, retry_after)
            return

        captcha_ok, captcha_error, captcha_reason = verify_captcha_answer(
            payload.get("captcha_id"),
            payload.get("captcha_answer"),
        )
        if not captcha_ok:
            if captcha_reason == "wrong":
                blocked, retry_after, failures_left = record_captcha_failure_for_client(session["email"], ip)
                if blocked:
                    captcha_blocked_response(handler, retry_after)
                    return
                json_response(
                    handler,
                    HTTPStatus.BAD_REQUEST,
                    {
                        "error": captcha_error,
                        "captcha_failures_left": failures_left,
                    },
                )
                return

            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": captcha_error})
            return

        clear_captcha_failures_for_client(session["email"], ip)

        name = normalize_text(payload.get("name"))
        email = normalize_text(payload.get("email")).lower()
        phone = normalize_text(payload.get("phone"))
        position = normalize_text(payload.get("position"))
        message = normalize_text(payload.get("message"))
        budget_amount = normalize_text(payload.get("budget_amount"))
        budget_currency = normalize_text(payload.get("budget_currency"))

        if not all([name, email, phone, position, message, budget_amount, budget_currency]):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Заполните все обязательные поля"})
            return

        status, result, clean_payload = insert_project_request(payload)
        if status >= 400:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не удалось сохранить заявку"})
            return

        account_store.add_application(session["user_id"], clean_payload)

        email_sent, email_error = send_project_request_notification(clean_payload)
        response_payload = {"message": "Заявка сохранена"}
        if email_sent:
            response_payload["email_sent"] = True
        else:
            response_payload["email_sent"] = False
            response_payload["email_warning"] = (
                "Заявка сохранена, но письмо не отправлено. Проверьте SMTP в .env."
                if not email_error
                else "Заявка сохранена, но письмо не отправлено."
            )

        json_response(handler, HTTPStatus.CREATED, response_payload)
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка сохранения заявки"})


def password_reset_request_view(handler):
    try:
        if not enforce_rate_limit(handler, "password-reset-request", limit=5, window_seconds=600):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())

        status, profiles = get_profile_by_email(email)
        if status >= 400 or not profiles:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Такой электронной почты нет в базе данных",
            })
            return

        profile = profiles[0]
        token = create_password_reset_token(email, profile.get("auth_user_id"))
        reset_url = f"{get_public_site_url(handler)}/reset-password?code={token}"
        email_sent, email_error = send_password_reset_email(email, reset_url, expires_minutes=RESET_TTL_SECONDS // 60)
        if not email_sent:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Не удалось отправить письмо. Проверьте SMTP в .env.",
                "details": email_error,
            })
            return

        json_response(handler, HTTPStatus.OK, {
            "message": "Мы отправили вам письмо на указанную электронную почту. Если письмо не пришло - проверьте раздел \"Спам\"",
        })
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось обработать запрос"})


def normalize_reset_token(token):
    text = urllib.parse.unquote(str(token or "").strip())
    while "%" in text:
        decoded = urllib.parse.unquote(text)
        if decoded == text:
            break
        text = decoded
    return text


def password_reset_verify_view(handler):
    try:
        token = ""
        if handler.command == "POST":
            payload = read_json_body(handler)
            token = normalize_reset_token(payload.get("code") or payload.get("token"))
        else:
            parsed = urllib.parse.urlparse(handler.path)
            query = urllib.parse.parse_qs(parsed.query)
            token = normalize_reset_token(
                (query.get("code") or query.get("token") or query.get("reset_token") or [""])[0]
            )

        if not token:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"valid": False, "error": "Ссылка недействительна"})
            return

        reset_data = verify_password_reset_token(token)
        if not reset_data or is_reset_token_used(reset_data["jti"]):
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "valid": False,
                "error": "Ссылка просрочена",
                "redirect": "/400",
            })
            return

        json_response(handler, HTTPStatus.OK, {
            "valid": True,
            "email": reset_data["email"],
        })
    except Exception:
        json_response(handler, HTTPStatus.BAD_REQUEST, {
            "valid": False,
            "error": "Ссылка просрочена",
            "redirect": "/400",
        })


def password_reset_confirm_view(handler):
    try:
        if not enforce_rate_limit(handler, "password-reset-confirm", limit=8, window_seconds=600):
            return

        payload = read_json_body(handler)
        token = normalize_reset_token(payload.get("code") or payload.get("token"))
        form_email = validate_email(normalize_text(payload.get("email")).lower())
        new_password = validate_password(str(payload.get("new_password") or ""))
        confirm_password = validate_password(str(payload.get("confirm_password") or ""))

        if not token:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка просрочена", "redirect": "/400"})
            return

        if not form_email:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Email аккаунта не указан"})
            return

        if new_password != confirm_password:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Пароли не совпадают"})
            return

        if get_reset_link_status(token) != "valid":
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка просрочена", "redirect": "/400"})
            return

        reset_data = verify_password_reset_token(token)
        if not reset_data:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка просрочена", "redirect": "/400"})
            return

        if is_reset_token_used(reset_data["jti"]):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка просрочена", "redirect": "/400"})
            return

        if form_email != reset_data["email"]:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Email не совпадает со ссылкой сброса пароля"})
            return

        status, profiles = get_profile_by_email(form_email)
        if status >= 400:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка недействительна или устарела"})
            return

        profile = profiles[0] if profiles else None
        if not profile:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Аккаунт с таким email не найден"})
            return

        if str(profile.get("auth_user_id")) != str(reset_data["user_id"]):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Ссылка недействительна или устарела"})
            return

        new_hash = hash_password(new_password)
        profile_status, profile_result = update_profile_password_hash(profile, new_hash)
        if profile_status >= 400:
            message = get_supabase_error_message(profile_result, "Не удалось сохранить новый пароль")
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не удалось сохранить новый пароль", "details": message})
            return

        auth_status, auth_result = update_auth_user_password(profile.get("auth_user_id"), new_password)
        if auth_status >= 400:
            print(
                "[password-reset] profile hash updated, auth password sync failed:",
                get_supabase_error_message(auth_result, "unknown"),
            )

        mark_reset_token_used(reset_data["jti"], reset_data["exp"], reset_data.get("code"))
        try:
            account_store.revoke_all_sessions(profile.get("auth_user_id"))
        except Exception as error:
            print(f"[password-reset] sessions revoke skipped: {error}")

        record_site_event(
            "password_reset",
            f"Пользователь {form_email} сменил пароль по ссылке сброса",
            actor_email=form_email,
            target_email=form_email,
            user_id=str(profile.get("auth_user_id") or ""),
            ip=get_client_ip(handler),
        )
        json_response(handler, HTTPStatus.OK, {"message": "Пароль успешно изменён. Теперь можно войти с новым паролем."})
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except RuntimeError as error:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
    except Exception as error:
        import traceback
        print(f"[password-reset] unexpected error: {error}")
        traceback.print_exc()
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось сменить пароль"})


def is_admin_profile(profile):
    if not profile or not isinstance(profile, dict):
        return False
    return normalize_profile_role(profile.get("role")) == ADMIN_PROFILE_ROLE


def serialize_profile(profile):
    role = normalize_profile_role(profile.get("role"))
    user_id = profile.get("auth_user_id")
    return {
        "id": user_id,
        "email": profile.get("email"),
        "username": profile.get("username"),
        "full_name": profile.get("full_name"),
        "role": role,
        "is_admin": role == ADMIN_PROFILE_ROLE,
        "email_verified": account_store.is_email_verified(user_id) if user_id else False,
    }


def register_confirm_view(handler):
    try:
        if not enforce_rate_limit(handler, "register-confirm", limit=10, window_seconds=300):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())
        code = str(payload.get("code") or "").strip()

        if len(code) != 6 or not code.isdigit():
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Введите 6-значный код из письма"})
            return

        pending = consume_pending_registration(email, code)
        if not pending:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Неверный или просроченный код"})
            return

        full_name = normalize_text(pending.get("full_name"))
        username = normalize_text(pending.get("username"))
        password = str(pending.get("password") or "")
        password_hash = str(pending.get("password_hash") or "")

        conflict_field = find_registration_conflict(email, username, full_name)
        if conflict_field:
            error_message, field = registration_conflict(conflict_field)
            respond_registration_error(handler, error_message, field)
            return

        result, error_message, field = complete_user_registration(
            handler,
            full_name,
            username,
            email,
            password,
            password_hash,
        )
        if not result:
            if field:
                respond_registration_error(handler, error_message, field)
            else:
                json_response(handler, HTTPStatus.BAD_REQUEST, {"error": error_message or "Не удалось создать аккаунт"})
            return

        user = result.get("user") or {}
        record_site_event(
            "user_registered",
            f"Зарегистрирован пользователь {email}",
            actor_email=email,
            target_email=email,
            user_id=str(user.get("id") or ""),
            ip=get_client_ip(handler),
            meta={"username": username, "full_name": full_name},
        )
        json_response(handler, HTTPStatus.CREATED, result)
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось завершить регистрацию"})


def register_resend_view(handler):
    try:
        if not enforce_rate_limit(handler, "register-resend", limit=5, window_seconds=600):
            return

        payload = read_json_body(handler)
        email = validate_email(normalize_text(payload.get("email")).lower())

        pending = get_pending_registration(email)
        if not pending:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Заявка на регистрацию не найдена или истекла. Заполните форму заново.",
            })
            return

        verification_code = refresh_pending_registration_code(email)
        if not verification_code:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Заявка на регистрацию не найдена или истекла. Заполните форму заново.",
            })
            return

        email_sent, email_error = send_email_verification_code(
            email,
            verification_code,
            expires_minutes=PENDING_REGISTRATION_TTL_SECONDS // 60,
        )
        if not email_sent:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Не удалось отправить письмо с кодом",
                "details": email_error,
            })
            return

        json_response(handler, HTTPStatus.OK, {
            "message": "Мы отправили новый код на вашу почту. Проверьте «Входящие» и «Спам».",
        })
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось отправить код"})


def verify_email_view(handler):
    try:
        if not enforce_rate_limit(handler, "verify-email", limit=10, window_seconds=300):
            return

        payload = read_json_body(handler)
        session = require_authenticated_session(handler, payload)
        if not session:
            return

        user_id = session["user_id"]
        email = session["email"]

        if account_store.is_email_verified(user_id):
            json_response(handler, HTTPStatus.OK, {
                "message": "Email уже подтверждён",
                "email_verified": True,
            })
            return

        code = str(payload.get("code") or "").strip()
        if len(code) != 6 or not code.isdigit():
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Введите 6-значный код из письма"})
            return

        if not consume_email_verification_code(email, code):
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Неверный или просроченный код"})
            return

        account_store.set_email_verified(user_id, True)
        json_response(handler, HTTPStatus.OK, {
            "message": "Email успешно подтверждён",
            "email_verified": True,
        })
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось подтвердить email"})


def resend_email_verification_view(handler):
    try:
        if not enforce_rate_limit(handler, "verify-email-resend", limit=5, window_seconds=600):
            return

        payload = read_json_body(handler)
        session = require_authenticated_session(handler, payload)
        if not session:
            return

        user_id = session["user_id"]
        email = session["email"]

        if account_store.is_email_verified(user_id):
            json_response(handler, HTTPStatus.OK, {
                "message": "Email уже подтверждён",
                "email_verified": True,
            })
            return

        email_sent, email_error = dispatch_email_verification_code(email, user_id)
        if not email_sent:
            json_response(handler, HTTPStatus.BAD_REQUEST, {
                "error": "Не удалось отправить письмо с кодом",
                "details": email_error,
            })
            return

        json_response(handler, HTTPStatus.OK, {
            "message": "Мы отправили новый код на вашу почту. Проверьте «Входящие» и «Спам».",
        })
    except InputSecurityError as error:
        reject_unsafe_input(handler, error)
    except ValueError:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось отправить код"})
