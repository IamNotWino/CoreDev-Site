import sys

from backend.blocklist import (
    block_ip,
    fetch_public_ip,
    get_blocked_ips,
    get_local_network_ip,
    is_valid_ip,
    unblock_ip,
)
from backend.email_notifications import send_email_verification_code, send_test_email, smtp_is_configured
from backend.email_verification import create_email_verification_code, EMAIL_VERIFY_TTL_SECONDS
from backend.server_runtime import start_servers
from backend.services import add_admin_by_email
from backend.settings import HOST, HTTPS_PORT, PORT, SUPABASE_SECRET_KEY, SUPABASE_URL, USE_HTTPS
from backend.sql_guard import InputSecurityError, validate_email

def run_cli():
    if len(sys.argv) < 2:
        return False

    command = sys.argv[1]

    if command == "block":
        if len(sys.argv) < 3:
            print("Использование: python server.py block <ip>")
            sys.exit(1)

        ip = sys.argv[2].strip()
        if not is_valid_ip(ip):
            print(f"Некорректный IP-адрес: {ip}")
            sys.exit(1)

        if ip in get_blocked_ips():
            print(f"IP {ip} уже заблокирован.")
        else:
            block_ip(ip)
            print(f"IP {ip} заблокирован.")
        sys.exit(0)

    if command == "unblock":
        if len(sys.argv) < 3:
            print("Использование: python server.py unblock <ip>")
            sys.exit(1)

        ip = sys.argv[2].strip()
        if not is_valid_ip(ip):
            print(f"Некорректный IP-адрес: {ip}")
            sys.exit(1)

        if unblock_ip(ip):
            print(f"IP {ip} разблокирован.")
        else:
            print(f"IP {ip} не найден в списке блокировок.")
        sys.exit(0)

    if command == "blocked":
        blocked = sorted(get_blocked_ips())
        if not blocked:
            print("Список блокировок пуст.")
        else:
            print("Заблокированные IP:")
            for ip in blocked:
                print(f"  - {ip}")
        sys.exit(0)

    if command == "add-admin":
        if len(sys.argv) < 3:
            print("Использование: python server.py add-admin <email>")
            sys.exit(1)

        email = sys.argv[2].strip().lower()
        try:
            validate_email(email)
        except InputSecurityError:
            print(f"Некорректный email: {sys.argv[2]}")
            sys.exit(1)

        try:
            status, result = add_admin_by_email(email)
        except InputSecurityError as error:
            print(f"Ошибка: {error}")
            sys.exit(1)

        if status == 404:
            print(f"Пользователь {email} не найден в базе данных.")
            sys.exit(1)
        if status >= 400:
            error = result.get("error") if isinstance(result, dict) else "Неизвестная ошибка"
            print(f"Не удалось назначить администратора: {error}")
            print("Убедитесь, что выполнена миграция: supabase/migrations/001_add_profile_role.sql")
            sys.exit(1)

        username = result.get("username") or "—"
        print(f"OK: {email} ({username}) назначен администратором.")
        print("Пользователю нужно обновить страницу или перелогиниться, чтобы увидеть бейдж Admin.")
        sys.exit(0)

    if command == "unblock-local":
        local_ip = get_local_network_ip()
        targets = ["127.0.0.1", "::1", local_ip]
        removed = []
        for ip in targets:
            if unblock_ip(ip):
                removed.append(ip)
        if removed:
            print("Разблокированы IP:")
            for ip in removed:
                print(f"  - {ip}")
        else:
            print("Локальные IP не найдены в списке блокировок.")
        sys.exit(0)

    if command in {"myip", "ip"}:
        local_ip = get_local_network_ip()
        public_ip = fetch_public_ip()
        print("Ваши IP-адреса:")
        print(f"  Локальный (с этого ПК через localhost): 127.0.0.1")
        print(f"  В локальной сети: {local_ip}")
        if public_ip:
            print(f"  Публичный (в интернете): {public_ip}")
        else:
            print("  Публичный (в интернете): не удалось определить")
        print()
        print("Для блокировки себя при тесте на этом компьютере используйте:")
        print("  python server.py block 127.0.0.1")
        sys.exit(0)

    if command == "test-email":
        if len(sys.argv) < 3:
            print("Использование: python server.py test-email <email>")
            sys.exit(1)

        email = sys.argv[2].strip().lower()
        try:
            validate_email(email)
        except InputSecurityError:
            print(f"Некорректный email: {sys.argv[2]}")
            sys.exit(1)

        if not smtp_is_configured():
            print("SMTP не настроен. Укажите SMTP_USER и SMTP_PASSWORD в .env")
            sys.exit(1)

        sent, error = send_test_email(email)
        if sent:
            print(f"OK: тестовое письмо отправлено на {email}")
            print("Проверьте «Входящие» и папку «Спам».")
            print("Лог: data/email_delivery.log")
        else:
            print(f"Ошибка отправки: {error}")
            sys.exit(1)
        sys.exit(0)

    if command == "test-verify-email":
        if len(sys.argv) < 3:
            print("Использование: python server.py test-verify-email <email>")
            sys.exit(1)

        email = sys.argv[2].strip().lower()
        try:
            validate_email(email)
        except InputSecurityError:
            print(f"Некорректный email: {sys.argv[2]}")
            sys.exit(1)

        if not smtp_is_configured():
            print("SMTP не настроен. Укажите SMTP_USER и SMTP_PASSWORD в .env")
            sys.exit(1)

        code = create_email_verification_code(email, "cli-test-user")
        sent, error = send_email_verification_code(
            email,
            code,
            expires_minutes=EMAIL_VERIFY_TTL_SECONDS // 60,
        )
        if sent:
            print(f"OK: код подтверждения отправлен на {email}")
            print(f"Код для проверки: {code}")
            print("Проверьте «Входящие» и папку «Спам».")
            print("Лог: data/email_delivery.log")
        else:
            print(f"Ошибка отправки: {error}")
            sys.exit(1)
        sys.exit(0)

    if command == "help":
        print("Команды:")
        print("  python server.py block <ip>     — заблокировать IP")
        print("  python server.py unblock <ip>   — разблокировать IP")
        print("  python server.py unblock-local  — разблокировать localhost")
        print("  python server.py blocked        — список заблокированных IP")
        print("  python server.py myip           — узнать свои IP-адреса")
        print("  python server.py add-admin <email> — выдать роль администратора")
        print("  python server.py test-email <email> — проверить отправку SMTP")
        print("  python server.py test-verify-email <email> — отправить код подтверждения")
        sys.exit(0)

    return False


def main():
    if run_cli():
        return

    print(f"HTTP:  http://{HOST}:{PORT}")
    if USE_HTTPS:
        print(f"HTTPS: https://{HOST}:{HTTPS_PORT}")
        print("Для HTTPS используется локальный самоподписанный сертификат.")
        print("Браузер может показать предупреждение — это нормально для локальной разработки.")
    print(f"Supabase URL: {SUPABASE_URL}")
    if not SUPABASE_SECRET_KEY:
        print("Warning: SUPABASE_SECRET_KEY is not configured.")
    print("Press Ctrl+C to stop the server.")
    start_servers()

if __name__ == "__main__":
    main()
