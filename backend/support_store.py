import json
import secrets
import sqlite3
import time
from pathlib import Path
from threading import RLock

from .site_event_log import SiteEventLog

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "support_chat.db"
LEGACY_JSON_PATH = DATA_DIR / "support_chat.json"
MAX_MESSAGES_PER_THREAD = 500
MAX_TEXT_LENGTH = 2000

SCHEMA = """
CREATE TABLE IF NOT EXISTS support_threads (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'admin')),
    text TEXT NOT NULL,
    at INTEGER NOT NULL,
    at_local TEXT NOT NULL DEFAULT '',
    read_by_user INTEGER NOT NULL DEFAULT 0,
    read_by_admin INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES support_threads(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_at
    ON support_messages(user_id, at);
"""


class SupportChatStore:
    def __init__(self):
        self._lock = RLock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._migrate_legacy_json()

    def _connect(self):
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        return conn

    def _init_db(self):
        with self._lock:
            with self._connect() as conn:
                conn.executescript(SCHEMA)
                conn.commit()

    def _migrate_legacy_json(self):
        if not LEGACY_JSON_PATH.exists():
            return

        with self._lock:
            with self._connect() as conn:
                count = conn.execute("SELECT COUNT(*) AS total FROM support_threads").fetchone()["total"]
                if count:
                    return

                try:
                    with LEGACY_JSON_PATH.open("r", encoding="utf-8") as handle:
                        data = json.load(handle)
                except (json.JSONDecodeError, OSError):
                    return

                threads = data.get("threads") or {}
                for user_id, thread in threads.items():
                    if not user_id:
                        continue
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO support_threads (user_id, email, username, updated_at)
                        VALUES (?, ?, ?, ?)
                        """,
                        (
                            user_id,
                            thread.get("email") or "",
                            thread.get("username") or "",
                            int(thread.get("updated_at") or 0),
                        ),
                    )
                    for item in thread.get("messages") or []:
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO support_messages
                            (id, user_id, sender, text, at, at_local, read_by_user, read_by_admin)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                item.get("id") or secrets.token_urlsafe(8),
                                user_id,
                                item.get("sender") or "user",
                                item.get("text") or "",
                                int(item.get("at") or 0),
                                item.get("at_local") or "",
                                1 if item.get("read_by_user") else 0,
                                1 if item.get("read_by_admin") else 0,
                            ),
                        )
                conn.commit()

            backup = LEGACY_JSON_PATH.with_suffix(".json.bak")
            try:
                LEGACY_JSON_PATH.replace(backup)
            except OSError:
                pass

    @staticmethod
    def _format_time(ts):
        return SiteEventLog.format_ekat_timestamp(ts)

    @staticmethod
    def _row_to_message(row):
        return {
            "id": row["id"],
            "sender": row["sender"],
            "text": row["text"],
            "at": row["at"],
            "at_local": row["at_local"],
            "read_by_user": bool(row["read_by_user"]),
            "read_by_admin": bool(row["read_by_admin"]),
        }

    def _ensure_thread(self, conn, user_id, email="", username=""):
        row = conn.execute(
            "SELECT user_id FROM support_threads WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if not row:
            conn.execute(
                """
                INSERT INTO support_threads (user_id, email, username, updated_at)
                VALUES (?, ?, ?, 0)
                """,
                (
                    user_id,
                    str(email or "").strip().lower(),
                    str(username or "").strip(),
                ),
            )
            return

        updates = []
        params = []
        if email:
            updates.append("email = ?")
            params.append(str(email).strip().lower())
        if username:
            updates.append("username = ?")
            params.append(str(username).strip())
        if updates:
            params.append(user_id)
            conn.execute(
                f"UPDATE support_threads SET {', '.join(updates)} WHERE user_id = ?",
                params,
            )

    def _trim_messages(self, conn, user_id):
        total = conn.execute(
            "SELECT COUNT(*) AS total FROM support_messages WHERE user_id = ?",
            (user_id,),
        ).fetchone()["total"]
        if total <= MAX_MESSAGES_PER_THREAD:
            return
        excess = total - MAX_MESSAGES_PER_THREAD
        conn.execute(
            """
            DELETE FROM support_messages
            WHERE id IN (
                SELECT id FROM support_messages
                WHERE user_id = ?
                ORDER BY at ASC
                LIMIT ?
            )
            """,
            (user_id, excess),
        )

    def _fetch_messages(self, conn, user_id):
        rows = conn.execute(
            """
            SELECT * FROM support_messages
            WHERE user_id = ?
            ORDER BY at ASC
            """,
            (user_id,),
        ).fetchall()
        return [self._row_to_message(row) for row in rows]

    def _fetch_thread_dict(self, conn, user_id, include_messages=True):
        row = conn.execute(
            "SELECT * FROM support_threads WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if not row:
            return None
        thread = {
            "user_id": row["user_id"],
            "email": row["email"] or "",
            "username": row["username"] or "",
            "updated_at": row["updated_at"] or 0,
        }
        if include_messages:
            thread["messages"] = self._fetch_messages(conn, user_id)
        return thread

    def add_user_message(self, user_id, email, username, text):
        with self._lock:
            now = int(time.time())
            message_id = secrets.token_urlsafe(8)
            at_local = self._format_time(now)
            with self._connect() as conn:
                self._ensure_thread(conn, user_id, email=email, username=username)
                conn.execute(
                    """
                    INSERT INTO support_messages
                    (id, user_id, sender, text, at, at_local, read_by_user, read_by_admin)
                    VALUES (?, ?, 'user', ?, ?, ?, 1, 0)
                    """,
                    (message_id, user_id, str(text or "").strip(), now, at_local),
                )
                conn.execute(
                    "UPDATE support_threads SET updated_at = ? WHERE user_id = ?",
                    (now, user_id),
                )
                self._trim_messages(conn, user_id)
                conn.commit()
                message_row = conn.execute(
                    "SELECT * FROM support_messages WHERE id = ?",
                    (message_id,),
                ).fetchone()
                thread = self._fetch_thread_dict(conn, user_id, include_messages=True)
            return self._row_to_message(message_row), thread

    def add_admin_message(self, user_id, text):
        with self._lock:
            now = int(time.time())
            message_id = secrets.token_urlsafe(8)
            at_local = self._format_time(now)
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT user_id FROM support_threads WHERE user_id = ?",
                    (user_id,),
                ).fetchone()
                if not row:
                    return None, None

                conn.execute(
                    """
                    INSERT INTO support_messages
                    (id, user_id, sender, text, at, at_local, read_by_user, read_by_admin)
                    VALUES (?, ?, 'admin', ?, ?, ?, 0, 1)
                    """,
                    (message_id, user_id, str(text or "").strip(), now, at_local),
                )
                conn.execute(
                    "UPDATE support_threads SET updated_at = ? WHERE user_id = ?",
                    (now, user_id),
                )
                self._trim_messages(conn, user_id)
                conn.commit()
                message_row = conn.execute(
                    "SELECT * FROM support_messages WHERE id = ?",
                    (message_id,),
                ).fetchone()
                thread = self._fetch_thread_dict(conn, user_id, include_messages=True)
            return self._row_to_message(message_row), thread

    def list_user_messages(self, user_id):
        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE support_messages
                    SET read_by_user = 1
                    WHERE user_id = ? AND sender = 'admin' AND read_by_user = 0
                    """,
                    (user_id,),
                )
                conn.commit()
                return self._fetch_messages(conn, user_id)

    def get_thread(self, user_id):
        with self._lock:
            with self._connect() as conn:
                return self._fetch_thread_dict(conn, user_id, include_messages=True)

    def list_threads(self):
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT
                        t.user_id,
                        t.email,
                        t.username,
                        t.updated_at,
                        (
                            SELECT m.text FROM support_messages m
                            WHERE m.user_id = t.user_id
                            ORDER BY m.at DESC
                            LIMIT 1
                        ) AS last_message,
                        (
                            SELECT m.sender FROM support_messages m
                            WHERE m.user_id = t.user_id
                            ORDER BY m.at DESC
                            LIMIT 1
                        ) AS last_sender,
                        (
                            SELECT COUNT(*) FROM support_messages m
                            WHERE m.user_id = t.user_id
                        ) AS message_count,
                        (
                            SELECT COUNT(*) FROM support_messages m
                            WHERE m.user_id = t.user_id
                              AND m.sender = 'user'
                              AND m.read_by_admin = 0
                        ) AS unread_count
                    FROM support_threads t
                    ORDER BY t.updated_at DESC
                    """
                ).fetchall()

                threads = []
                for row in rows:
                    updated_at = int(row["updated_at"] or 0)
                    threads.append({
                        "user_id": row["user_id"] or "",
                        "email": row["email"] or "",
                        "username": row["username"] or "",
                        "updated_at": updated_at,
                        "updated_at_local": self._format_time(updated_at) if updated_at else "",
                        "last_message": row["last_message"] or "",
                        "last_sender": row["last_sender"] or "",
                        "message_count": int(row["message_count"] or 0),
                        "unread_count": int(row["unread_count"] or 0),
                    })
                return threads

    def mark_read_by_admin(self, user_id):
        with self._lock:
            with self._connect() as conn:
                cursor = conn.execute(
                    """
                    UPDATE support_messages
                    SET read_by_admin = 1
                    WHERE user_id = ? AND sender = 'user' AND read_by_admin = 0
                    """,
                    (user_id,),
                )
                conn.commit()
                return cursor.rowcount > 0

    def count_unread_admin_total(self):
        with self._lock:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    SELECT COUNT(*) AS total
                    FROM support_messages
                    WHERE sender = 'user' AND read_by_admin = 0
                    """
                ).fetchone()
                return int(row["total"] or 0)

    def delete_user_data(self, user_id):
        user_id = str(user_id or "").strip()
        if not user_id:
            return False
        with self._lock:
            with self._connect() as conn:
                conn.execute("DELETE FROM support_messages WHERE user_id = ?", (user_id,))
                conn.execute("DELETE FROM support_threads WHERE user_id = ?", (user_id,))
                conn.commit()
                return True


support_store = SupportChatStore()
