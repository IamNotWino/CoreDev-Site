import json
import os
import re
import socket
import urllib.request

from .settings import BASE_DIR

BLOCKLIST_PATH = BASE_DIR / "blocked_ips.json"
ENV_PATH = BASE_DIR / ".env"


def get_env_blocked_ips():
    raw_ips = os.getenv("BLOCKED_IPS", "")
    return {ip.strip() for ip in raw_ips.split(",") if ip.strip()}


def _load_file_ips():
    if not BLOCKLIST_PATH.exists():
        return set()

    try:
        data = json.loads(BLOCKLIST_PATH.read_text(encoding="utf-8"))
        return {ip.strip() for ip in data.get("ips", []) if ip.strip()}
    except (json.JSONDecodeError, OSError):
        return set()


def _save_file_ips(ips):
    BLOCKLIST_PATH.write_text(
        json.dumps({"ips": sorted(ips)}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def get_blocked_ips():
    return get_env_blocked_ips() | _load_file_ips()


def block_ip(ip):
    ip = ip.strip()
    if not ip:
        raise ValueError("Укажите IP-адрес")

    ips = _load_file_ips()
    ips.add(ip)
    _save_file_ips(ips)
    return ip


def _remove_ip_from_env(ip):
    if not ENV_PATH.exists():
        return False

    lines = ENV_PATH.read_text(encoding="utf-8").splitlines()
    changed = False
    updated_lines = []

    for line in lines:
        if not line.startswith("BLOCKED_IPS="):
            updated_lines.append(line)
            continue

        key, value = line.split("=", 1)
        ips = [item.strip() for item in value.split(",") if item.strip()]
        if ip not in ips:
            updated_lines.append(line)
            continue

        ips = [item for item in ips if item != ip]
        changed = True
        if ips:
            updated_lines.append(f"{key}={','.join(ips)}")
        else:
            updated_lines.append(f"{key}=")

    if changed:
        ENV_PATH.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
        os.environ["BLOCKED_IPS"] = ",".join(
            item.strip()
            for item in os.getenv("BLOCKED_IPS", "").split(",")
            if item.strip() and item.strip() != ip
        )

    return changed


def unblock_ip(ip):
    ip = ip.strip()
    if not ip:
        raise ValueError("Укажите IP-адрес")

    removed = False
    file_ips = _load_file_ips()
    if ip in file_ips:
        file_ips.discard(ip)
        _save_file_ips(file_ips)
        removed = True

    if _remove_ip_from_env(ip):
        removed = True

    return removed


def is_valid_ip(ip):
    return bool(re.fullmatch(r"[\d.:a-fA-F]+", ip))


def get_local_network_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def fetch_public_ip():
    try:
        with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("ip")
    except (OSError, json.JSONDecodeError, ValueError):
        return None
