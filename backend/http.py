import errno
import json
import mimetypes


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "no-store",
}

CLIENT_DISCONNECT_ERRORS = (
    ConnectionAbortedError,
    ConnectionResetError,
    BrokenPipeError,
)


def is_client_disconnect(error):
    if isinstance(error, CLIENT_DISCONNECT_ERRORS):
        return True
    if isinstance(error, OSError):
        if error.errno in {errno.EPIPE, errno.ECONNRESET, errno.ECONNABORTED}:
            return True
        winerror = getattr(error, "winerror", None)
        if winerror in {10053, 10054}:
            return True
    return False


def apply_security_headers(handler, extra_headers=None):
    for key, value in SECURITY_HEADERS.items():
        handler.send_header(key, value)
    for key, value in (extra_headers or {}).items():
        handler.send_header(key, value)


def json_response(handler, status, payload, headers=None):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    try:
        handler.send_response(status)
        handler.send_header("Content-Type", "application/json; charset=utf-8")
        handler.send_header("Content-Length", str(len(body)))
        apply_security_headers(handler, headers)
        handler.end_headers()
        handler.wfile.write(body)
    except Exception as error:
        if not is_client_disconnect(error):
            raise


def file_response(handler, status, body, content_type):
    try:
        handler.send_response(status)
        handler.send_header("Content-Type", content_type)
        handler.send_header("Content-Length", str(len(body)))
        apply_security_headers(handler)
        handler.end_headers()
        handler.wfile.write(body)
    except Exception as error:
        if not is_client_disconnect(error):
            raise


def read_json_body(handler, max_bytes=131072):
    length = int(handler.headers.get("Content-Length", 0))
    if length <= 0:
        return {}
    if length > max_bytes:
        raise ValueError("Payload too large")

    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw)


def guess_content_type(file_path):
    content_type, _ = mimetypes.guess_type(str(file_path))
    return content_type or "application/octet-stream"
