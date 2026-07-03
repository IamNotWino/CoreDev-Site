import urllib.parse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler

from .access_guard import is_sensitive_path, resolve_static_file, resolve_template_file
from .blocklist import get_blocked_ips
from .ddos_guard import ddos_guard
from .http import file_response, guess_content_type, json_response
from .security_check import get_client_ip
from .urls import API_GET_ROUTES, API_ROUTES, BLOCKED_ALLOWED_PATHS, TEMPLATE_ROUTES
from .views import normalize_reset_token
from .password_reset import get_reset_link_status


class SiteHandler(BaseHTTPRequestHandler):
    server_version = "CoreDevHTTP/1.0"

    def log_message(self, format, *args):
        return

    def is_client_blocked(self):
        return get_client_ip(self) in get_blocked_ips()

    def is_allowed_when_blocked(self, path):
        if path.startswith("/static/"):
            return True
        return path in BLOCKED_ALLOWED_PATHS

    def enforce_ddos_protection(self):
        ip = get_client_ip(self)
        path = urllib.parse.urlparse(self.path).path
        allowed, message = ddos_guard.allow(ip, path)
        if allowed:
            return True
        json_response(self, HTTPStatus.TOO_MANY_REQUESTS, {"error": message})
        return False

    def do_GET(self):
        if not self.enforce_ddos_protection():
            return

        path = urllib.parse.urlparse(self.path).path
        clean_path = path.rstrip("/") or "/"

        if is_sensitive_path(clean_path):
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        api_view = API_GET_ROUTES.get(clean_path)
        if api_view:
            api_view(self)
            return

        if not self.is_allowed_when_blocked(clean_path) and self.is_client_blocked():
            self.redirect("/403")
            return

        if clean_path == "/":
            self.redirect("/preloader")
            return

        if clean_path.startswith("/static/"):
            self.serve_static(clean_path)
            return

        if clean_path == "/reset-password":
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            code = normalize_reset_token(
                (query.get("code") or query.get("token") or query.get("reset_token") or [""])[0]
            )
            if not code or get_reset_link_status(code) != "valid":
                self.redirect("/400")
                return
            self.serve_template(TEMPLATE_ROUTES["/reset-password"])
            return

        template_path = TEMPLATE_ROUTES.get(clean_path)
        if template_path:
            self.serve_template(template_path)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self):
        if not self.enforce_ddos_protection():
            return

        path = urllib.parse.urlparse(self.path).path
        clean_path = path.rstrip("/") or "/"

        if self.is_client_blocked():
            json_response(self, HTTPStatus.FORBIDDEN, {
                "allowed": False,
                "blocked": True,
                "message": "Ваш IP заблокирован политикой безопасности.",
            })
            return

        view = API_ROUTES.get(clean_path)
        if view:
            view(self)
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "API route not found", "path": clean_path})

    def serve_static(self, path):
        file_path = resolve_static_file(path)
        if not file_path:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        body = file_path.read_bytes()
        file_response(self, HTTPStatus.OK, body, guess_content_type(file_path))

    def serve_template(self, template_relative):
        file_path = resolve_template_file(template_relative)
        if not file_path:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        body = file_path.read_bytes()
        file_response(self, HTTPStatus.OK, body, "text/html; charset=utf-8")

    def redirect(self, location):
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", location)
        from .http import apply_security_headers
        apply_security_headers(self)
        self.end_headers()
