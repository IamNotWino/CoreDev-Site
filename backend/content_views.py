from http import HTTPStatus

from .admin_views import _require_admin
from .content_store import content_store
from .http import CLIENT_DISCONNECT_ERRORS, json_response, read_json_body
from .image_utils import delete_content_image, save_content_image
from .views import enforce_rate_limit


def _read_payload(handler):
    try:
        return read_json_body(handler)
    except ValueError:
        return None


def content_team_list_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-team", limit=120, window_seconds=60):
            return
        json_response(handler, HTTPStatus.OK, {"items": content_store.list_team()})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить сотрудников"})


def content_projects_list_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-projects", limit=120, window_seconds=60):
            return
        json_response(handler, HTTPStatus.OK, {"items": content_store.list_projects()})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить проекты"})


def admin_content_meta_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-meta", limit=60, window_seconds=60):
            return
        session, _profile = _require_admin(handler, {})
        if not session:
            return
        json_response(handler, HTTPStatus.OK, {
            "team_tags": content_store.list_team_tags(),
            "project_stack": content_store.list_project_stack_tags(),
        })
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось загрузить подсказки"})


def admin_team_create_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-team-create", limit=30, window_seconds=60):
            return
        payload = _read_payload(handler)
        if payload is None:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
            return
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        image_data = payload.get("image_data")
        image_url = str(payload.get("image_url") or "").strip()
        if image_data:
            image_url = save_content_image(image_data, "team")

        item = content_store.create_team_member({**payload, "image_url": image_url})
        json_response(handler, HTTPStatus.CREATED, {"item": item, "message": "Сотрудник добавлен"})
    except ValueError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось добавить сотрудника"})


def admin_project_create_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-project-create", limit=30, window_seconds=60):
            return
        payload = _read_payload(handler)
        if payload is None:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
            return
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        image_data = payload.get("image_data")
        image_url = str(payload.get("image_url") or "").strip()
        if image_data:
            image_url = save_content_image(image_data, "projects")

        item = content_store.create_project({**payload, "image_url": image_url})
        json_response(handler, HTTPStatus.CREATED, {"item": item, "message": "Проект добавлен"})
    except ValueError as error:
        json_response(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось добавить проект"})


def admin_team_delete_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-team-delete", limit=20, window_seconds=60):
            return
        payload = _read_payload(handler)
        if payload is None:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
            return
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        member_id = str(payload.get("id") or "").strip()
        if not member_id:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не указан сотрудник"})
            return

        image_url = content_store.delete_team_member(member_id)
        if image_url is None:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Сотрудник не найден"})
            return

        delete_content_image(image_url)
        json_response(handler, HTTPStatus.OK, {"message": "Сотрудник удалён"})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось удалить сотрудника"})


def admin_project_delete_view(handler):
    try:
        if not enforce_rate_limit(handler, "content-project-delete", limit=20, window_seconds=60):
            return
        payload = _read_payload(handler)
        if payload is None:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Некорректный запрос"})
            return
        session, _profile = _require_admin(handler, payload)
        if not session:
            return

        project_id = str(payload.get("id") or "").strip()
        if not project_id:
            json_response(handler, HTTPStatus.BAD_REQUEST, {"error": "Не указан проект"})
            return

        image_url = content_store.delete_project(project_id)
        if image_url is None:
            json_response(handler, HTTPStatus.NOT_FOUND, {"error": "Проект не найден"})
            return

        delete_content_image(image_url)
        json_response(handler, HTTPStatus.OK, {"message": "Проект удалён"})
    except CLIENT_DISCONNECT_ERRORS:
        return
    except Exception:
        json_response(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Не удалось удалить проект"})
