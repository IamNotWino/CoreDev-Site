import hashlib
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

HOST = "127.0.0.1"
PORT = 8000
HTTPS_PORT = int(os.getenv("HTTPS_PORT", "8443"))
USE_HTTPS = os.getenv("USE_HTTPS", "true").strip().lower() in {"1", "true", "yes", "on"}
SUPABASE_PROJECT_REF = "ytyrbjjmmdmjqebzolqi"
DEFAULT_SUPABASE_URL = f"https://{SUPABASE_PROJECT_REF}.supabase.co"


def load_env_file():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL", DEFAULT_SUPABASE_URL).rstrip("/")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
PASSWORD_PEPPER = os.getenv("PASSWORD_PEPPER", "")
PASSWORD_HASH_ITERATIONS = 260000

SESSION_SECRET = os.getenv("SESSION_SECRET", "").strip()
if not SESSION_SECRET:
    SESSION_SECRET = hashlib.sha256(
        f"{SUPABASE_SECRET_KEY}:{PASSWORD_PEPPER}:coredev-session-v1".encode("utf-8")
    ).hexdigest()

DDOS_GLOBAL_LIMIT = int(os.getenv("DDOS_GLOBAL_LIMIT", "120"))
DDOS_GLOBAL_WINDOW = int(os.getenv("DDOS_GLOBAL_WINDOW", "60"))
DDOS_BURST_LIMIT = int(os.getenv("DDOS_BURST_LIMIT", "30"))
DDOS_BURST_WINDOW = int(os.getenv("DDOS_BURST_WINDOW", "10"))
DDOS_STATIC_LIMIT = int(os.getenv("DDOS_STATIC_LIMIT", "300"))
DDOS_STATIC_WINDOW = int(os.getenv("DDOS_STATIC_WINDOW", "60"))
DDOS_AUTO_BAN_VIOLATIONS = int(os.getenv("DDOS_AUTO_BAN_VIOLATIONS", "8"))
DDOS_AUTO_BAN_SECONDS = int(os.getenv("DDOS_AUTO_BAN_SECONDS", "900"))
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "maks.nefedov123@gmail.com").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER).strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "CoreDev").strip()
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {"1", "true", "yes", "on"}
EMAIL_LOG_PATH = BASE_DIR / "data" / "email_delivery.log"
SITE_URL = os.getenv("SITE_URL", f"http://{HOST}:{PORT}").rstrip("/")


def get_public_site_url(handler=None):
    configured = SITE_URL.strip()
    if configured and configured not in {"http://127.0.0.1:8000", "http://localhost:8000"}:
        return configured.rstrip("/")

    if handler is not None:
        host = (handler.headers.get("Host") or "").strip()
        if host:
            forwarded_proto = (handler.headers.get("X-Forwarded-Proto") or "").strip().lower()
            if forwarded_proto in {"http", "https"}:
                return f"{forwarded_proto}://{host}".rstrip("/")
            if handler.server and getattr(handler.server, "ssl_context", None):
                return f"https://{host}".rstrip("/")
            return f"http://{host}".rstrip("/")

    return configured or f"http://{HOST}:{PORT}"