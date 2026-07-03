import ssl
import threading
from http.server import ThreadingHTTPServer

from .app import SiteHandler
from .settings import HOST, HTTPS_PORT, PORT, USE_HTTPS
from .ssl_certs import ensure_self_signed_cert


class SecureThreadingHTTPServer(ThreadingHTTPServer):
    def __init__(self, server_address, request_handler_class, ssl_context):
        self.ssl_context = ssl_context
        super().__init__(server_address, request_handler_class)

    def get_request(self):
        client_socket, client_address = self.socket.accept()
        secure_socket = self.ssl_context.wrap_socket(client_socket, server_side=True)
        return secure_socket, client_address


def create_ssl_context():
    cert_file, key_file = ensure_self_signed_cert()
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(certfile=cert_file, keyfile=key_file)
    return ssl_context


def start_http_server():
    server = ThreadingHTTPServer((HOST, PORT), SiteHandler)
    server.serve_forever()


def start_https_server():
    server = SecureThreadingHTTPServer((HOST, HTTPS_PORT), SiteHandler, create_ssl_context())
    server.serve_forever()


def start_servers():
    if USE_HTTPS:
        https_thread = threading.Thread(target=start_https_server, daemon=True, name="https-server")
        https_thread.start()

    start_http_server()
