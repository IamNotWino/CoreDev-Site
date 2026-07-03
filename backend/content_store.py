import json
import secrets
import sqlite3
import time
from pathlib import Path
from threading import RLock

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "site_content.db"

TEAM_SEED = [
    {
        "name": "Алексей Воронов",
        "role": "CTO & Co-founder",
        "bio": "Бывший tech lead в Google. Специалист по распределённым системам и высоконагруженной инфраструктуре.",
        "tags": ["Kubernetes", "Golang", "System Design"],
        "image_url": "https://placehold.co/600x450/0F162F/2D68FF?text=Alexey+Voronov",
        "detail_text": "Алексей руководит R&D и архитектурой",
    },
    {
        "name": "Дарья Менделеева",
        "role": "Head of AI Research",
        "bio": "PhD в области машинного обучения. Автор 30+ научных статей по компьютерному зрению и LLM.",
        "tags": ["Deep Learning", "PyTorch", "LLM"],
        "image_url": "https://placehold.co/600x450/0F162F/2D68FF?text=Daria+Mendeleeva",
        "detail_text": "Дарья лидирует направление искусственного интеллекта",
    },
    {
        "name": "Марк Вернер",
        "role": "Senior Solutions Architect",
        "bio": "AWS Hero. Построил облачную инфраструктуру для нескольких гиперскейлеров.",
        "tags": ["AWS/GCP", "Terraform", "K8s"],
        "image_url": "https://placehold.co/600x450/0F162F/2D68FF?text=Mark+Werner",
        "detail_text": "Марк отвечает за облачную архитектуру и DevOps",
    },
    {
        "name": "Екатерина Ли",
        "role": "CISO",
        "bio": "Эксперт по кибербезопасности. Внедрила ISO 27001 в более чем 15 крупных компаниях.",
        "tags": ["ISO 27001", "PenTest", "Zero Trust"],
        "image_url": "https://placehold.co/600x450/0F162F/2D68FF?text=Ekaterina+Lee",
        "detail_text": "Екатерина курирует безопасность и compliance",
    },
]

PROJECTS_SEED = [
    {
        "title": "FinTech Hub",
        "description": "Платформа для инвестиционного банка с ML-аналитикой. Обработка более 100k RPS.",
        "stack": ["Java/Kotlin", "React", "Kafka"],
        "image_url": "https://placehold.co/600x400/0F162F/2D68FF?text=FinTech+Dashboard",
        "detail_text": "FinTech Hub обрабатывает свыше 2 млн транзакций",
    },
    {
        "title": "NeuroBot Suite",
        "description": "Экосистема умных AI-ботов для e-commerce (Telegram, Discord, GPT-4).",
        "stack": ["Python/FastAPI", "OpenAI", "Redis"],
        "image_url": "https://placehold.co/600x400/0F162F/2D68FF?text=AI+Bot+Ecosystem",
        "detail_text": "Боты обрабатывают 50k+ диалогов",
    },
    {
        "title": "HealthAI Platform",
        "description": "Система диагностики на базе компьютерного зрения и LLM для клиник.",
        "stack": ["Python", "PyTorch", "Flutter"],
        "image_url": "https://placehold.co/600x400/0F162F/2D68FF?text=Health+AI+Platform",
        "detail_text": "HealthAI уже используется в 12 клиниках",
    },
    {
        "title": "LogiCore OS",
        "description": "Полноценная операционная система для крупной логистической сети (2000+ машин).",
        "stack": ["Go", "React", "Kubernetes"],
        "image_url": "https://placehold.co/600x400/0F162F/2D68FF?text=Logistics+OS",
        "detail_text": "LogiCore обрабатывает 1.2 млн заказов в сутки",
    },
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    tags_json TEXT NOT NULL DEFAULT '[]',
    image_url TEXT NOT NULL DEFAULT '',
    detail_text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS showcase_projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    stack_json TEXT NOT NULL DEFAULT '[]',
    image_url TEXT NOT NULL DEFAULT '',
    detail_text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_team_members_sort ON team_members(sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_showcase_projects_sort ON showcase_projects(sort_order, created_at);
"""


def _parse_tags(value):
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = [part.strip() for part in value.split(",")]
    else:
        items = []
    cleaned = []
    seen = set()
    for item in items:
        text = str(item or "").strip()
        if not text or text in seen:
            continue
        if len(text) > 48:
            text = text[:48]
        seen.add(text)
        cleaned.append(text)
    return cleaned[:12]


def _serialize_team(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "role": row["role"],
        "bio": row["bio"],
        "tags": json.loads(row["tags_json"] or "[]"),
        "image_url": row["image_url"],
        "detail_text": row["detail_text"],
        "sort_order": row["sort_order"],
        "created_at": row["created_at"],
    }


def _serialize_project(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "stack": json.loads(row["stack_json"] or "[]"),
        "image_url": row["image_url"],
        "detail_text": row["detail_text"],
        "sort_order": row["sort_order"],
        "created_at": row["created_at"],
    }


class ContentStore:
    def __init__(self):
        self._lock = RLock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._seed_defaults()

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

    def _seed_defaults(self):
        with self._lock:
            with self._connect() as conn:
                team_count = conn.execute("SELECT COUNT(*) AS total FROM team_members").fetchone()["total"]
                if not team_count:
                    now = int(time.time())
                    for index, item in enumerate(TEAM_SEED):
                        conn.execute(
                            """
                            INSERT INTO team_members
                            (id, name, role, bio, tags_json, image_url, detail_text, sort_order, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                secrets.token_hex(8),
                                item["name"],
                                item["role"],
                                item["bio"],
                                json.dumps(item["tags"], ensure_ascii=False),
                                item["image_url"],
                                item["detail_text"],
                                index,
                                now + index,
                            ),
                        )

                project_count = conn.execute("SELECT COUNT(*) AS total FROM showcase_projects").fetchone()["total"]
                if not project_count:
                    now = int(time.time())
                    for index, item in enumerate(PROJECTS_SEED):
                        conn.execute(
                            """
                            INSERT INTO showcase_projects
                            (id, title, description, stack_json, image_url, detail_text, sort_order, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                secrets.token_hex(8),
                                item["title"],
                                item["description"],
                                json.dumps(item["stack"], ensure_ascii=False),
                                item["image_url"],
                                item["detail_text"],
                                index,
                                now + index,
                            ),
                        )
                conn.commit()

    def list_team(self):
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM team_members ORDER BY sort_order ASC, created_at ASC"
                ).fetchall()
        return [_serialize_team(row) for row in rows]

    def list_projects(self):
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM showcase_projects ORDER BY sort_order ASC, created_at ASC"
                ).fetchall()
        return [_serialize_project(row) for row in rows]

    def list_team_tags(self):
        tags = []
        seen = set()
        for member in self.list_team():
            for tag in member.get("tags") or []:
                if tag not in seen:
                    seen.add(tag)
                    tags.append(tag)
        return tags

    def list_project_stack_tags(self):
        tags = []
        seen = set()
        for project in self.list_projects():
            for tag in project.get("stack") or []:
                if tag not in seen:
                    seen.add(tag)
                    tags.append(tag)
        return tags

    def create_team_member(self, payload):
        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValueError("Укажите ФИО")
        role = str(payload.get("role") or "").strip()[:120]
        bio = str(payload.get("bio") or "").strip()[:1200]
        detail_text = str(payload.get("detail_text") or "").strip()[:500]
        tags = _parse_tags(payload.get("tags"))
        image_url = str(payload.get("image_url") or "").strip()
        member_id = secrets.token_hex(8)
        now = int(time.time())
        with self._lock:
            with self._connect() as conn:
                sort_order = conn.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM team_members").fetchone()["next"]
                conn.execute(
                    """
                    INSERT INTO team_members
                    (id, name, role, bio, tags_json, image_url, detail_text, sort_order, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (member_id, name, role, bio, json.dumps(tags, ensure_ascii=False), image_url, detail_text, sort_order, now),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM team_members WHERE id = ?", (member_id,)).fetchone()
        return _serialize_team(row)

    def create_project(self, payload):
        title = str(payload.get("title") or "").strip()
        if not title:
            raise ValueError("Укажите название проекта")
        description = str(payload.get("description") or "").strip()[:1200]
        detail_text = str(payload.get("detail_text") or "").strip()[:500]
        stack = _parse_tags(payload.get("stack"))
        image_url = str(payload.get("image_url") or "").strip()
        project_id = secrets.token_hex(8)
        now = int(time.time())
        with self._lock:
            with self._connect() as conn:
                sort_order = conn.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM showcase_projects").fetchone()["next"]
                conn.execute(
                    """
                    INSERT INTO showcase_projects
                    (id, title, description, stack_json, image_url, detail_text, sort_order, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (project_id, title, description, json.dumps(stack, ensure_ascii=False), image_url, detail_text, sort_order, now),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM showcase_projects WHERE id = ?", (project_id,)).fetchone()
        return _serialize_project(row)

    def get_team_member(self, member_id):
        with self._lock:
            with self._connect() as conn:
                row = conn.execute("SELECT * FROM team_members WHERE id = ?", (member_id,)).fetchone()
        return _serialize_team(row) if row else None

    def get_project(self, project_id):
        with self._lock:
            with self._connect() as conn:
                row = conn.execute("SELECT * FROM showcase_projects WHERE id = ?", (project_id,)).fetchone()
        return _serialize_project(row) if row else None

    def delete_team_member(self, member_id):
        with self._lock:
            with self._connect() as conn:
                row = conn.execute("SELECT image_url FROM team_members WHERE id = ?", (member_id,)).fetchone()
                if not row:
                    return None
                conn.execute("DELETE FROM team_members WHERE id = ?", (member_id,))
                conn.commit()
        return row["image_url"]

    def delete_project(self, project_id):
        with self._lock:
            with self._connect() as conn:
                row = conn.execute("SELECT image_url FROM showcase_projects WHERE id = ?", (project_id,)).fetchone()
                if not row:
                    return None
                conn.execute("DELETE FROM showcase_projects WHERE id = ?", (project_id,))
                conn.commit()
        return row["image_url"]


content_store = ContentStore()
