import re

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24}$")
UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
)
USERNAME_RE = re.compile(r"^[a-zA-Zа-яА-ЯёЁ\-]{5,10}$")
SAFE_NAME_RE = re.compile(r"^[a-zA-Zа-яА-ЯёЁ\s.\-]{3,120}$")

INJECTION_PATTERNS = (
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(\b)(union|select|insert|update|delete|drop|alter|create|exec|execute|truncate|grant|revoke)(\b)",
        r"(--|#|/\*|\*/|;)",
        r"(\bor\b|\band\b)\s+[\d'\"]",
        r"'\s*or\s*'",
        r"(\.eq\.|\.neq\.|\.gt\.|\.lt\.|\.gte\.|\.lte\.|\.like\.|\.ilike\.|\.or\(|\.and\()",
        r"\b(sleep|benchmark|waitfor|pg_sleep|dbms_pipe)\s*\(",
        r"[\x00-\x08\x0b\x0c\x0e-\x1f]",
    )
)

FILTER_BREAKING_CHARS = {",", "(", ")", "\n", "\r", "\t", "\x00"}


class InputSecurityError(ValueError):
    pass


def contains_injection(value):
    text = str(value or "")
    if not text:
        return False

    for pattern in INJECTION_PATTERNS:
        if pattern.search(text):
            return True

    return any(char in text for char in FILTER_BREAKING_CHARS)


def validate_email(email):
    email = str(email or "").strip().lower()
    if not email or len(email) > 254:
        raise InputSecurityError("Некорректный email")
    if contains_injection(email) or not EMAIL_RE.fullmatch(email):
        raise InputSecurityError("Некорректный email")
    return email


def validate_uuid(value, field_name="id"):
    value = str(value or "").strip()
    if not value or not UUID_RE.fullmatch(value):
        raise InputSecurityError(f"Некорректный {field_name}")
    return value


def validate_username(username):
    username = str(username or "").strip()
    if contains_injection(username) or not USERNAME_RE.fullmatch(username):
        raise InputSecurityError("Некорректное имя пользователя")
    return username


def validate_full_name(full_name):
    full_name = str(full_name or "").strip()
    if contains_injection(full_name):
        raise InputSecurityError("Некорректное ФИО")
    if len(full_name) < 10 or full_name.count(" ") < 2:
        raise InputSecurityError("Некорректное ФИО")
    if re.search(r"\s{2,}", full_name):
        raise InputSecurityError("Некорректное ФИО")
    if not re.fullmatch(r"^[а-яА-ЯёЁ\s\-]+$", full_name):
        raise InputSecurityError("Некорректное ФИО")
    parts = full_name.split()
    if len(parts) != 3:
        raise InputSecurityError("Некорректное ФИО")
    for part in parts:
        if len(part) < 3 or part.startswith("-") or part.endswith("-") or part.count("-") > 1:
            raise InputSecurityError("Некорректное ФИО")
    return full_name


def validate_password(password):
    password = str(password or "")
    if len(password) < 8 or len(password) > 128 or " " in password:
        raise InputSecurityError("Некорректный пароль")
    if "\x00" in password:
        raise InputSecurityError("Некорректный пароль")
    return password


def validate_safe_text(value, field_name="поле", max_length=500, min_length=0):
    text = str(value or "").strip()
    if len(text) < min_length:
        raise InputSecurityError(f"Некорректное {field_name}")
    if len(text) > max_length or contains_injection(text):
        raise InputSecurityError(f"Некорректное {field_name}")
    return text


def validate_phone(phone):
    text = str(phone or "").strip()
    if not re.fullmatch(r"\d{11}", text):
        raise InputSecurityError("Некорректный телефон")
    if text[0] not in "78" or text[1] not in "3456789":
        raise InputSecurityError("Некорректный телефон")
    return text


def validate_budget_amount(value):
    text = str(value or "").strip()
    if not text.isdigit() or len(text) < 1 or len(text) > 12 or int(text) <= 0:
        raise InputSecurityError("Некорректный бюджет")
    return text


def validate_budget_currency(value):
    currency = str(value or "").strip().upper()
    if currency not in {"RUB", "USD", "KZT"}:
        raise InputSecurityError("Некорректная валюта")
    return currency


def validate_postgrest_filter_value(value, field_name="значение"):
    text = str(value or "").strip()
    if not text or len(text) > 128:
        raise InputSecurityError(f"Некорректное {field_name}")
    if contains_injection(text):
        raise InputSecurityError(f"Некорректное {field_name}")
    return text
