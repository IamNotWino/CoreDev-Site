from .blocklist import get_blocked_ips


SUSPICIOUS_USER_AGENT_PARTS = (
    "sqlmap",
    "nikto",
    "nmap",
    "masscan",
    "acunetix",
    "nessus",
    "metasploit",
    "python-requests",
    "curl",
    "wget",
)


def get_client_ip(handler):
    forwarded_for = handler.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return handler.client_address[0] if handler.client_address else "unknown"


def run_security_check(handler, payload=None):
    payload = payload or {}
    ip = get_client_ip(handler)
    public_ip = str(payload.get("public_ip") or "").strip()
    user_agent = handler.headers.get("User-Agent", "").strip()
    user_agent_lower = user_agent.lower()

    if ip in get_blocked_ips():
        return deny("Ваш IP заблокирован политикой безопасности.", ip)

    if not user_agent:
        return deny("Запрос заблокирован: отсутствует User-Agent.", ip)

    for marker in SUSPICIOUS_USER_AGENT_PARTS:
        if marker in user_agent_lower:
            return deny("Запрос похож на автоматизированный или вредоносный клиент.", ip)

    if has_oversized_headers(handler):
        return deny("Запрос заблокирован из-за подозрительно больших заголовков.", ip)

    return {
        "allowed": True,
        "risk": "low",
        "ip": ip,
        "public_ip": public_ip,
        "message": "Проверка безопасности пройдена.",
    }


def has_oversized_headers(handler):
    total_size = 0
    for key, value in handler.headers.items():
        total_size += len(key) + len(value)
    return total_size > 8192


def deny(message, ip):
    return {
        "allowed": False,
        "risk": "high",
        "ip": ip,
        "message": message,
    }
