from .supabase import get_supabase_error_message

REGISTRATION_FIELD_EMAIL = "email"
REGISTRATION_FIELD_USERNAME = "username"
REGISTRATION_FIELD_FULL_NAME = "full_name"

REGISTRATION_ERRORS = {
    REGISTRATION_FIELD_EMAIL: "Этот email уже зарегистрирован. Войдите или восстановите пароль.",
    REGISTRATION_FIELD_USERNAME: "Этот ник уже занят. Выберите другой.",
    REGISTRATION_FIELD_FULL_NAME: "Пользователь с таким ФИО уже зарегистрирован.",
}


def registration_conflict(field):
    return REGISTRATION_ERRORS.get(field), field


def map_auth_registration_error(details):
    if isinstance(details, dict):
        error_code = str(details.get("error_code") or "").strip().lower()
        if error_code in {"email_exists", "user_already_exists"}:
            return registration_conflict(REGISTRATION_FIELD_EMAIL)

    message = get_supabase_error_message(details, "Не удалось создать пользователя")
    lowered = message.lower()

    email_taken_markers = (
        "already been registered",
        "already registered",
        "user already exists",
        "email exists",
        "email address has already",
        "users_email_key",
    )
    if any(marker in lowered for marker in email_taken_markers):
        return registration_conflict(REGISTRATION_FIELD_EMAIL)

    if "duplicate" in lowered and "email" in lowered:
        return registration_conflict(REGISTRATION_FIELD_EMAIL)

    return message, None


def map_profile_registration_error(details):
    message = get_supabase_error_message(details, "Профиль не сохранён")
    lowered = message.lower()

    if "username" in lowered and any(token in lowered for token in ("duplicate", "unique", "exists", "already")):
        return registration_conflict(REGISTRATION_FIELD_USERNAME)

    if "full_name" in lowered and any(token in lowered for token in ("duplicate", "unique", "exists", "already")):
        return registration_conflict(REGISTRATION_FIELD_FULL_NAME)

    if "email" in lowered and any(token in lowered for token in ("duplicate", "unique", "exists", "already")):
        return registration_conflict(REGISTRATION_FIELD_EMAIL)

    if "profiles_username" in lowered or "username_key" in lowered:
        return registration_conflict(REGISTRATION_FIELD_USERNAME)

    if "profiles_full_name" in lowered or "full_name_key" in lowered:
        return registration_conflict(REGISTRATION_FIELD_FULL_NAME)

    if "profiles_email" in lowered or "email_key" in lowered:
        return registration_conflict(REGISTRATION_FIELD_EMAIL)

    return f"Профиль не сохранён: {message}", None
