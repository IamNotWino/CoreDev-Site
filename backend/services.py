from .sql_guard import (
    InputSecurityError,
    validate_budget_amount,
    validate_budget_currency,
    validate_email,
    validate_full_name,
    validate_password,
    validate_phone,
    validate_safe_text,
    validate_uuid,
    validate_username,
)
from .supabase import get_supabase_error_message, supabase_request

PROFILE_ROLES = frozenset({"member", "admin"})
DEFAULT_PROFILE_ROLE = "member"
ADMIN_PROFILE_ROLE = "admin"


def normalize_text(value):
    return str(value or "").strip()


def get_auth_user_by_email(email):
    email = validate_email(email)
    normalized_email = email.lower()
    page = 1

    while page <= 50:
        status, result = supabase_request(
            "GET",
            "/auth/v1/admin/users",
            query={"page": str(page), "per_page": "200"},
        )
        if status >= 400:
            return status, None

        users = (result or {}).get("users") or []
        if not users:
            return 200, None

        for user in users:
            if str(user.get("email") or "").strip().lower() == normalized_email:
                return 200, user

        if len(users) < 200:
            return 200, None

        page += 1

    return 200, None


def create_auth_user(email, password, full_name, username):
    payload = {
        "email": email,
        "password": password,
        "email_confirm": False,
        "user_metadata": {
            "full_name": full_name,
            "username": username,
        },
    }
    return supabase_request("POST", "/auth/v1/admin/users", payload)


def delete_auth_user(user_id):
    user_id = validate_uuid(user_id, "user_id")
    return supabase_request("DELETE", f"/auth/v1/admin/users/{user_id}")


def update_auth_user_password(user_id, new_password):
    user_id = validate_uuid(user_id, "user_id")
    new_password = validate_password(new_password)
    return supabase_request("PUT", f"/auth/v1/admin/users/{user_id}", {"password": new_password})


def normalize_profile_role(value):
    role = str(value or "").strip().lower()
    return role if role in PROFILE_ROLES else DEFAULT_PROFILE_ROLE


def validate_profile_role(value):
    role = str(value or "").strip().lower()
    if role not in PROFILE_ROLES:
        raise InputSecurityError("Некорректная роль пользователя")
    return role


def insert_profile(user_id, full_name, username, email, password_hash):
    payload = {
        "auth_user_id": validate_uuid(user_id, "user_id"),
        "full_name": full_name,
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "role": DEFAULT_PROFILE_ROLE,
    }
    return supabase_request("POST", "/rest/v1/profiles", payload)


def get_profile_by_email(email):
    email = validate_email(email)
    return supabase_request("GET", "/rest/v1/profiles", query={
        "email": f"eq.{email}",
        "select": "id,auth_user_id,full_name,username,email,password_hash,role",
        "limit": "1",
    })


def get_profile_by_username(username):
    username = validate_username(username)
    return supabase_request("GET", "/rest/v1/profiles", query={
        "username": f"eq.{username}",
        "select": "id,auth_user_id,full_name,username,email,password_hash,role",
        "limit": "1",
    })


def get_profile_by_full_name(full_name):
    full_name = validate_full_name(full_name)
    return supabase_request("GET", "/rest/v1/profiles", query={
        "full_name": f"eq.{full_name}",
        "select": "id,auth_user_id,full_name,username,email,password_hash,role",
        "limit": "1",
    })


def find_registration_conflict(email, username, full_name):
    status, profiles = get_profile_by_email(email)
    if status < 400 and profiles:
        return "email"

    status, profiles = get_profile_by_username(username)
    if status < 400 and profiles:
        return "username"

    status, profiles = get_profile_by_full_name(full_name)
    if status < 400 and profiles:
        return "full_name"

    return None


def _profile_lookup_query(profile):
    if not profile or not isinstance(profile, dict):
        raise InputSecurityError("Профиль не найден")

    auth_user_id = profile.get("auth_user_id")
    if auth_user_id:
        safe_auth_user_id = validate_uuid(auth_user_id, "auth_user_id")
        return {"auth_user_id": f"eq.{safe_auth_user_id}"}

    email = profile.get("email")
    if email:
        safe_email = validate_email(email)
        return {"email": f"eq.{safe_email}"}

    raw_id = profile.get("id")
    if raw_id is not None and str(raw_id).strip():
        raw = str(raw_id).strip()
        try:
            safe_id = validate_uuid(raw, "profile_id")
        except InputSecurityError:
            if not raw.isdigit():
                raise
            safe_id = raw
        return {"id": f"eq.{safe_id}"}

    raise InputSecurityError("Не удалось определить профиль")


def update_auth_user_email(user_id, email):
    user_id = validate_uuid(user_id, "user_id")
    email = validate_email(email)
    return supabase_request(
        "PUT",
        f"/auth/v1/admin/users/{user_id}",
        {"email": email, "email_confirm": True},
    )


def update_profile_fields(profile, fields):
    patch = {}
    if "full_name" in fields:
        patch["full_name"] = validate_full_name(fields["full_name"])
    if "username" in fields:
        patch["username"] = validate_username(fields["username"])
    if "email" in fields:
        patch["email"] = validate_email(fields["email"])
    if not patch:
        raise InputSecurityError("Нет данных для обновления")
    return supabase_request(
        "PATCH",
        "/rest/v1/profiles",
        patch,
        query=_profile_lookup_query(profile),
    )


def profile_field_taken(field, value, exclude_auth_user_id=None):
    lookup = {
        "email": get_profile_by_email,
        "username": get_profile_by_username,
        "full_name": get_profile_by_full_name,
    }
    fetch = lookup.get(field)
    if not fetch:
        return False
    status, profiles = fetch(value)
    if status >= 400 or not profiles:
        return False
    profile = profiles[0]
    if exclude_auth_user_id and str(profile.get("auth_user_id")) == str(exclude_auth_user_id):
        return False
    return True


def update_profile_role(profile, role):
    safe_role = validate_profile_role(role)
    return supabase_request(
        "PATCH",
        "/rest/v1/profiles",
        {"role": safe_role},
        query=_profile_lookup_query(profile),
    )


def get_profile_by_auth_user_id(user_id):
    user_id = validate_uuid(user_id, "user_id")
    return supabase_request("GET", "/rest/v1/profiles", query={
        "auth_user_id": f"eq.{user_id}",
        "select": "id,auth_user_id,full_name,username,email,role",
        "limit": "1",
    })


def list_profiles(limit=100, offset=0):
    safe_limit = max(1, min(int(limit or 100), 500))
    safe_offset = max(0, int(offset or 0))
    return supabase_request("GET", "/rest/v1/profiles", query={
        "select": "id,auth_user_id,full_name,username,email,role",
        "order": "email.asc",
        "limit": str(safe_limit),
        "offset": str(safe_offset),
    })


def list_all_registered_profiles(page_size=100):
    safe_page_size = max(1, min(int(page_size or 100), 500))
    offset = 0
    all_profiles = []

    while True:
        status, batch = list_profiles(limit=safe_page_size, offset=offset)
        if status >= 400:
            return status, all_profiles
        if not isinstance(batch, list) or not batch:
            break
        all_profiles.extend(batch)
        if len(batch) < safe_page_size:
            break
        offset += safe_page_size
        if offset > 10000:
            break

    return 200, all_profiles


def add_admin_by_email(email):
    email = validate_email(email)
    status, profiles = get_profile_by_email(email)
    if status >= 400:
        message = get_supabase_error_message(profiles, "Ошибка базы данных")
        return status, {"error": message}

    if not profiles:
        return 404, {"error": "Пользователь не найден"}

    profile = profiles[0]
    patch_status, patch_result = update_profile_role(profile, ADMIN_PROFILE_ROLE)
    if patch_status >= 400:
        message = get_supabase_error_message(patch_result, "Не удалось назначить администратора")
        return patch_status, {"error": message}

    from .site_event_log import record_site_event

    target_email = profile.get("email") or email
    record_site_event(
        "role_granted_admin",
        f"Пользователю {target_email} выданы права администратора (CLI)",
        actor_email="system",
        target_email=target_email,
        user_id=str(profile.get("auth_user_id") or ""),
        meta={"source": "cli"},
    )

    return 200, {
        "email": profile.get("email") or email,
        "username": profile.get("username") or "",
        "role": ADMIN_PROFILE_ROLE,
    }


def update_profile_password_hash(profile, password_hash):
    return supabase_request(
        "PATCH",
        "/rest/v1/profiles",
        {"password_hash": password_hash},
        query=_profile_lookup_query(profile),
    )


def delete_profile(profile):
    return supabase_request("DELETE", "/rest/v1/profiles", query=_profile_lookup_query(profile))


def insert_project_request(payload):
    clean_payload = {
        "name": validate_full_name(payload.get("name")),
        "email": validate_email(payload.get("email")),
        "phone": validate_phone(payload.get("phone")),
        "position": validate_safe_text(payload.get("position"), "направление", max_length=120, min_length=2),
        "message": validate_safe_text(payload.get("message"), "описание задачи", max_length=10000, min_length=100),
    }

    budget_amount = normalize_text(payload.get("budget_amount"))
    budget_currency = normalize_text(payload.get("budget_currency"))
    if budget_amount or budget_currency:
        amount = validate_budget_amount(budget_amount)
        currency = validate_budget_currency(budget_currency)
        clean_payload["budget"] = f"{amount} {currency}"

    optional_fields = {
        "company": 120,
    }
    for field, max_length in optional_fields.items():
        value = normalize_text(payload.get(field))
        if value:
            clean_payload[field] = validate_safe_text(value, field, max_length=max_length, min_length=2)

    status, result = supabase_request("POST", "/rest/v1/project_requests", clean_payload)
    return status, result, clean_payload
