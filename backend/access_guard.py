from pathlib import Path
from urllib.parse import unquote

from .settings import BASE_DIR, STATIC_DIR

SENSITIVE_SEGMENTS = {
    ".env",
    ".git",
    "backend",
    "certs",
    "blocked_ips.json",
    "server.py",
    "requirements.txt",
}

SENSITIVE_EXTENSIONS = {
    ".env",
    ".py",
    ".pyc",
    ".key",
    ".pem",
    ".crt",
}


def is_sensitive_path(path):
    normalized = unquote(path).replace("\\", "/").lower()
    if ".." in normalized:
        return True

    parts = [part for part in normalized.split("/") if part]
    if any(part in SENSITIVE_SEGMENTS for part in parts):
        return True

    suffix = Path(normalized).suffix
    if suffix in SENSITIVE_EXTENSIONS and not normalized.startswith("/static/"):
        return True

    return False


def resolve_static_file(path):
    relative = unquote(path).removeprefix("/static/").lstrip("/")
    if not relative or ".." in relative.replace("\\", "/"):
        return None

    static_root = STATIC_DIR.resolve()
    file_path = (STATIC_DIR / relative).resolve()
    if static_root not in file_path.parents and file_path != static_root:
        return None
    if not file_path.is_file():
        return None
    return file_path


def resolve_template_file(template_relative):
    file_path = (BASE_DIR / template_relative.lstrip("/")).resolve()
    templates_root = (BASE_DIR / "templates").resolve()
    if templates_root not in file_path.parents:
        return None
    if not file_path.is_file():
        return None
    return file_path
