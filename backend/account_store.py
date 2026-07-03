import hashlib
import json
import secrets
import time
from pathlib import Path
from threading import Lock

from .device_info import build_device_label, short_user_agent

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "accounts"
MAX_LOGIN_HISTORY = 30
MAX_APPLICATIONS = 50

DEFAULT_SETTINGS = {
    "theme": "dark",
    "language": "ru",
    "timezone": "Europe/Moscow",
    "email_notifications": {
        "application_reply": True,
        "project_status": True,
        "news": False,
    },
    "push_notifications": True,
    "notification_frequency": "immediate",
    "profile_visibility": "public",
    "phone": "",
    "phone_verified": False,
    "default_contacts": {
        "phone": "",
        "company": "",
        "position": "",
        "budget_currency": "RUB",
    },
}


class AccountStore:
    def __init__(self):
        self._lock = Lock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _path(self, user_id):
        safe_id = str(user_id or "").strip()
        if not safe_id:
            raise ValueError("user_id is required")
        return DATA_DIR / f"{safe_id}.json"

    def _load(self, user_id):
        path = self._path(user_id)
        if not path.exists():
            return {
                "settings": self._default_settings_copy(),
                "sessions": [],
                "login_history": [],
                "applications": [],
                "draft": None,
            }
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        data.setdefault("settings", self._default_settings_copy())
        data.setdefault("sessions", [])
        data.setdefault("login_history", [])
        data.setdefault("applications", [])
        data.setdefault("draft", None)
        return data

    def _save(self, user_id, data):
        path = self._path(user_id)
        with path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)

    @staticmethod
    def _default_settings_copy():
        return json.loads(json.dumps(DEFAULT_SETTINGS, ensure_ascii=False))

    @staticmethod
    def _token_hash(token):
        return hashlib.sha256(str(token or "").encode("utf-8")).hexdigest()

    def get_settings_bundle(self, user_id, email, current_session_id=None):
        with self._lock:
            data = self._load(user_id)
            self._cleanup_sessions(data)
            self._save(user_id, data)
            return {
                "settings": data["settings"],
                "sessions": self._serialize_sessions(data["sessions"], current_session_id),
                "login_history": data["login_history"][:MAX_LOGIN_HISTORY],
                "applications": data["applications"][:MAX_APPLICATIONS],
                "draft": data.get("draft"),
                "verification": {
                    "email": email,
                    "email_verified": bool(data.get("email_verified")),
                    "phone": data["settings"].get("phone", ""),
                    "phone_verified": bool(data["settings"].get("phone_verified")),
                },
            }

    def is_email_verified(self, user_id):
        with self._lock:
            return bool(self._load(user_id).get("email_verified"))

    def get_phone(self, user_id):
        with self._lock:
            return str(self._load(user_id).get("settings", {}).get("phone") or "")

    def set_email_verified(self, user_id, verified=True):
        with self._lock:
            data = self._load(user_id)
            data["email_verified"] = bool(verified)
            self._save(user_id, data)
            return data["email_verified"]

    def update_settings(self, user_id, updates):
        with self._lock:
            data = self._load(user_id)
            settings = data["settings"]
            for key, value in (updates or {}).items():
                if key == "default_contacts" and isinstance(value, dict):
                    settings.setdefault("default_contacts", {})
                    settings["default_contacts"].update(value)
                elif key == "email_notifications" and isinstance(value, dict):
                    settings.setdefault("email_notifications", {})
                    settings["email_notifications"].update(value)
                elif key == "phone":
                    old_phone = str(settings.get("phone") or "").strip()
                    new_phone = str(value or "").strip()
                    settings["phone"] = new_phone
                    if new_phone != old_phone:
                        settings["phone_verified"] = False
                elif key in DEFAULT_SETTINGS or key in {"phone_verified"}:
                    settings[key] = value
            if settings.get("phone") and not str(settings.get("phone")).strip():
                settings["phone_verified"] = False
            data["settings"] = settings
            self._save(user_id, data)
            return settings

    def create_session(self, user_id, email, token, ttl_seconds, ip, user_agent, session_id=None):
        session_id = session_id or secrets.token_urlsafe(16)
        now = int(time.time())
        record = {
            "session_id": session_id,
            "email": email.lower(),
            "token_hash": self._token_hash(token),
            "created_at": now,
            "expires_at": now + int(ttl_seconds),
            "last_seen_at": now,
            "ip": ip,
            "user_agent": short_user_agent(user_agent),
            "device_label": build_device_label(user_agent),
            "revoked": False,
        }
        with self._lock:
            data = self._load(user_id)
            data["sessions"].append(record)
            self._cleanup_sessions(data)
            self._save(user_id, data)
        return session_id

    def touch_session(self, user_id, session_id, token):
        if not session_id:
            return
        with self._lock:
            data = self._load(user_id)
            token_hash = self._token_hash(token)
            for item in data["sessions"]:
                if item.get("session_id") == session_id and item.get("token_hash") == token_hash and not item.get("revoked"):
                    item["last_seen_at"] = int(time.time())
                    break
            self._save(user_id, data)

    def is_session_active(self, user_id, session_id, token):
        if not session_id:
            return True
        with self._lock:
            data = self._load(user_id)
            token_hash = self._token_hash(token)
            now = int(time.time())
            for item in data["sessions"]:
                if item.get("session_id") != session_id:
                    continue
                if item.get("revoked"):
                    return False
                if item.get("expires_at", 0) < now:
                    return False
                return item.get("token_hash") == token_hash
            return False

    def recover_session(self, user_id, email, token, session_id, ip, user_agent, ttl_seconds=86400):
        if not session_id:
            return True

        with self._lock:
            data = self._load(user_id)
            token_hash = self._token_hash(token)
            now = int(time.time())

            for item in data["sessions"]:
                if item.get("session_id") != session_id:
                    continue
                if item.get("revoked"):
                    return False
                item["token_hash"] = token_hash
                item["last_seen_at"] = now
                item["expires_at"] = max(item.get("expires_at", 0), now + int(ttl_seconds))
                item["ip"] = ip
                item["user_agent"] = short_user_agent(user_agent)
                item["device_label"] = build_device_label(user_agent)
                self._save(user_id, data)
                return True

            record = {
                "session_id": session_id,
                "email": str(email or "").lower(),
                "token_hash": token_hash,
                "created_at": now,
                "expires_at": now + int(ttl_seconds),
                "last_seen_at": now,
                "ip": ip,
                "user_agent": short_user_agent(user_agent),
                "device_label": build_device_label(user_agent),
                "revoked": False,
            }
            data["sessions"].append(record)
            self._cleanup_sessions(data)
            self._save(user_id, data)
            return True

    def revoke_session(self, user_id, session_id):
        with self._lock:
            data = self._load(user_id)
            for item in data["sessions"]:
                if item.get("session_id") == session_id:
                    item["revoked"] = True
            self._save(user_id, data)

    def revoke_all_sessions(self, user_id, except_session_id=None):
        with self._lock:
            data = self._load(user_id)
            for item in data["sessions"]:
                if except_session_id and item.get("session_id") == except_session_id:
                    continue
                item["revoked"] = True
            self._save(user_id, data)

    def add_login_event(self, user_id, ip, user_agent, success):
        event = {
            "at": int(time.time()),
            "ip": ip,
            "user_agent": short_user_agent(user_agent),
            "device_label": build_device_label(user_agent),
            "success": bool(success),
        }
        with self._lock:
            data = self._load(user_id)
            data["login_history"].insert(0, event)
            data["login_history"] = data["login_history"][:MAX_LOGIN_HISTORY]
            self._save(user_id, data)

    def add_application(self, user_id, payload):
        application = {
            "id": secrets.token_urlsafe(10),
            "created_at": int(time.time()),
            "status": "accepted",
            "name": payload.get("name", ""),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "company": payload.get("company", ""),
            "position": payload.get("position", ""),
            "budget": payload.get("budget", ""),
            "message": str(payload.get("message", "")),
            "message_preview": str(payload.get("message", ""))[:180],
        }
        with self._lock:
            data = self._load(user_id)
            data["applications"].insert(0, application)
            data["applications"] = data["applications"][:MAX_APPLICATIONS]
            data["draft"] = None
            self._save(user_id, data)
        return application

    def get_draft(self, user_id):
        with self._lock:
            return self._load(user_id).get("draft")

    def save_draft(self, user_id, draft):
        with self._lock:
            data = self._load(user_id)
            draft = dict(draft or {})
            draft["updated_at"] = int(time.time())
            data["draft"] = draft
            self._save(user_id, data)
            return draft

    def delete_draft(self, user_id):
        with self._lock:
            data = self._load(user_id)
            data["draft"] = None
            self._save(user_id, data)

    def delete_user_data(self, user_id):
        with self._lock:
            path = self._path(user_id)
            if path.exists():
                path.unlink()

    def _cleanup_sessions(self, data):
        now = int(time.time())
        data["sessions"] = [
            item
            for item in data.get("sessions", [])
            if not item.get("revoked") and item.get("expires_at", 0) >= now
        ]

    def _serialize_sessions(self, sessions, current_session_id):
        now = int(time.time())
        result = []
        for item in sessions:
            if item.get("revoked") or item.get("expires_at", 0) < now:
                continue
            result.append({
                "session_id": item.get("session_id"),
                "created_at": item.get("created_at"),
                "expires_at": item.get("expires_at"),
                "last_seen_at": item.get("last_seen_at"),
                "ip": item.get("ip"),
                "device_label": item.get("device_label"),
                "user_agent": item.get("user_agent"),
                "current": item.get("session_id") == current_session_id,
            })
        return result

    def get_admin_stats(self):
        stats = {
            "stored_accounts": 0,
            "verified_emails": 0,
            "total_applications": 0,
            "active_sessions": 0,
            "failed_logins_24h": 0,
        }
        cutoff = int(time.time()) - 86400
        now = int(time.time())
        with self._lock:
            for path in DATA_DIR.glob("*.json"):
                try:
                    with path.open("r", encoding="utf-8") as handle:
                        data = json.load(handle)
                except (json.JSONDecodeError, OSError):
                    continue
                stats["stored_accounts"] += 1
                if data.get("email_verified"):
                    stats["verified_emails"] += 1
                stats["total_applications"] += len(data.get("applications") or [])
                for session in data.get("sessions") or []:
                    if not session.get("revoked") and session.get("expires_at", 0) > now:
                        stats["active_sessions"] += 1
                for event in data.get("login_history") or []:
                    if not event.get("success") and event.get("at", 0) >= cutoff:
                        stats["failed_logins_24h"] += 1
        return stats


account_store = AccountStore()
