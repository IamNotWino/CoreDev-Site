import base64
import re
import secrets
from pathlib import Path

from .settings import STATIC_DIR

DATA_URL_PATTERN = re.compile(r"^data:image/(jpeg|jpg|png|webp);base64,", re.IGNORECASE)
MAX_IMAGE_BYTES = 2_500_000


def save_content_image(data_url, folder):
    if not data_url or not isinstance(data_url, str):
        return ""

    match = DATA_URL_PATTERN.match(data_url.strip())
    if not match:
        raise ValueError("Некорректный формат изображения")

    raw = base64.b64decode(data_url[match.end() :], validate=True)
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("Изображение слишком большое")

    fmt = match.group(1).lower()
    ext = "jpg" if fmt in {"jpeg", "jpg"} else fmt

    upload_dir = (STATIC_DIR / "uploads" / folder).resolve()
    static_root = STATIC_DIR.resolve()
    if static_root not in upload_dir.parents and upload_dir != static_root:
        raise ValueError("Некорректный путь для изображения")

    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{secrets.token_hex(12)}.{ext}"
    file_path = upload_dir / filename
    file_path.write_bytes(raw)
    return f"/static/uploads/{folder}/{filename}"


def delete_content_image(image_url):
    if not image_url or not isinstance(image_url, str):
        return

    normalized = image_url.strip()
    if not normalized.startswith("/static/uploads/"):
        return

    relative = normalized.removeprefix("/static/").lstrip("/")
    file_path = (STATIC_DIR / relative).resolve()
    static_root = STATIC_DIR.resolve()
    if static_root not in file_path.parents:
        return
    if file_path.is_file():
        try:
            file_path.unlink()
        except OSError:
            pass
