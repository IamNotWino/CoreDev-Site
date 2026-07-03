import html
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate

from .settings import (
    EMAIL_LOG_PATH,
    NOTIFY_EMAIL,
    SMTP_FROM,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_SSL,
    SMTP_USER,
)


def smtp_is_configured():
    return bool(SMTP_USER and SMTP_PASSWORD)


def smtp_can_send_notifications():
    return smtp_is_configured() and bool(NOTIFY_EMAIL)


def _safe(value):
    return html.escape(str(value or "—"))


def _format_sender():
    sender_email = (SMTP_FROM or SMTP_USER).strip()
    sender_name = (SMTP_FROM_NAME or "CoreDev").strip()
    return formataddr((sender_name, sender_email))


def _log_email_delivery(recipient, subject, success, details=""):
    try:
        EMAIL_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        status = "OK" if success else "FAIL"
        line = f"[{timestamp}] {status} to={recipient} subject={subject}"
        if details:
            line += f" details={details}"
        with EMAIL_LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except OSError:
        pass

    console_line = f"[email] {status} -> {recipient} ({subject})"
    if details:
        console_line += f" — {details}"
    print(console_line)


def _smtp_connect():
    if SMTP_USE_SSL or SMTP_PORT == 465:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=25)
        server.login(SMTP_USER, SMTP_PASSWORD)
        return server

    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=25)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(SMTP_USER, SMTP_PASSWORD)
    return server


def _send_email(recipient, subject, plain_body, html_body):
    if not recipient:
        return False, "Получатель не указан"

    if not smtp_is_configured():
        return False, "SMTP не настроен: укажите SMTP_USER и SMTP_PASSWORD в .env"

    sender = _format_sender()
    sender_email = (SMTP_FROM or SMTP_USER).strip()

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message["Date"] = formatdate(localtime=True)
    message["X-Mailer"] = "CoreDev Mailer"
    message.attach(MIMEText(plain_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with _smtp_connect() as server:
            server.sendmail(sender_email, [recipient], message.as_string())
        _log_email_delivery(recipient, subject, True)
        return True, ""
    except smtplib.SMTPAuthenticationError:
        error = (
            "Ошибка авторизации SMTP. Для Gmail используйте пароль приложения "
            "(Google Account -> Безопасность -> Пароли приложений)."
        )
        _log_email_delivery(recipient, subject, False, error)
        return False, error
    except Exception as error:
        message_text = str(error).strip() or "Неизвестная ошибка SMTP"
        _log_email_delivery(recipient, subject, False, message_text)
        return False, message_text


def format_project_request_email_plain(request_data):
    lines = [
        "Новая заявка на сайте CoreDev",
        "",
        f"ФИО: {request_data.get('name', '')}",
        f"Компания: {request_data.get('company', '—')}",
        f"Email: {request_data.get('email', '')}",
        f"Телефон: {request_data.get('phone', '')}",
        f"Направление: {request_data.get('position', '')}",
        f"Бюджет: {request_data.get('budget', '—')}",
        "",
        "Описание задачи:",
        request_data.get("message", ""),
    ]
    return "\n".join(lines)


def format_project_request_email_html(request_data):
    name = _safe(request_data.get("name"))
    company = _safe(request_data.get("company"))
    email = _safe(request_data.get("email"))
    phone = _safe(request_data.get("phone"))
    position = _safe(request_data.get("position"))
    budget = _safe(request_data.get("budget"))
    message = _safe(request_data.get("message")).replace("\n", "<br>")

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Новая заявка CoreDev</title>
</head>
<body style="margin:0;padding:0;background:#050915;font-family:Inter,Arial,sans-serif;color:#EFF3FF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at 12% 18%, rgba(45,104,255,0.18), transparent 28%), radial-gradient(circle at 88% 12%, rgba(255,77,77,0.12), transparent 26%), #050915;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:separate;">
          <tr>
            <td style="padding:28px 30px 22px;border-radius:28px 28px 0 0;background:linear-gradient(135deg,#1748C8,#3473FF);color:#FFFFFF;">
              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.88;">CoreDev Security Gateway</div>
              <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.2;">🚀 Новая заявка на проект</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;opacity:0.92;">Пользователь отправил форму «Старт вашего проекта».</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;background:#080E1E;border-left:1px solid rgba(93,133,255,0.24);border-right:1px solid rgba(93,133,255,0.24);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                <tr>
                  <td style="width:170px;padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">ФИО</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#FFFFFF;">{name}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">Компания</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#FFFFFF;">{company}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">Email</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#FFFFFF;"><a href="mailto:{email}" style="color:#8FB0FF;text-decoration:none;">{email}</a></td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">Телефон</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#FFFFFF;">{phone}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">Направление</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#FFFFFF;">{position}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(45,104,255,0.08);color:#BFD0FF;font-weight:700;">Бюджет</td>
                  <td style="padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);color:#00E5A0;font-weight:700;">{budget}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 30px 30px;background:#080E1E;border:1px solid rgba(93,133,255,0.24);border-top:none;border-radius:0 0 28px 28px;">
              <div style="font-size:14px;color:#BFD0FF;font-weight:700;margin-bottom:10px;">Описание задачи</div>
              <div style="padding:18px 20px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(93,133,255,0.18);color:#E7EDFF;line-height:1.7;font-size:15px;">{message}</div>
              <div style="margin-top:22px;padding-top:18px;border-top:1px solid rgba(93,133,255,0.16);font-size:12px;color:#9AA4C8;line-height:1.5;">
                Письмо отправлено автоматически сайтом CoreDev после успешной капчи и сохранения заявки.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_project_request_notification(request_data):
    if not NOTIFY_EMAIL:
        return False, "Адрес уведомлений не настроен"

    if not smtp_can_send_notifications():
        return False, "SMTP не настроен"

    subject = f"Новая заявка CoreDev: {request_data.get('name', 'без имени')}"
    plain_body = format_project_request_email_plain(request_data)
    html_body = format_project_request_email_html(request_data)
    return _send_email(NOTIFY_EMAIL, subject, plain_body, html_body)


def format_password_reset_email_plain(reset_url, expires_minutes=60):
    return "\n".join([
        "Сброс пароля CoreDev",
        "",
        "Вы запросили восстановление пароля для аккаунта на сайте CoreDev.",
        "Перейдите по ссылке ниже, чтобы задать новый пароль:",
        "",
        reset_url,
        "",
        f"Ссылка одноразовая и действует {expires_minutes} минут.",
        "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.",
    ])


def format_password_reset_email_html(reset_url, expires_minutes=60):
    safe_url = _safe(reset_url)
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля CoreDev</title>
</head>
<body style="margin:0;padding:0;background:#050915;font-family:Inter,Arial,sans-serif;color:#EFF3FF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050915;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;">
          <tr>
            <td style="padding:28px 30px;border-radius:28px 28px 0 0;background:linear-gradient(135deg,#1748C8,#3473FF);color:#FFFFFF;">
              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.88;">CoreDev Account</div>
              <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;">Сброс пароля</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;opacity:0.92;">Запрошено восстановление доступа к вашему аккаунту.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;background:#080E1E;border:1px solid rgba(93,133,255,0.24);border-top:none;border-radius:0 0 28px 28px;">
              <p style="margin:0 0 18px;color:#DDE6FF;line-height:1.7;font-size:15px;">
                Нажмите кнопку ниже, чтобы открыть страницу смены пароля на сайте CoreDev.
              </p>
              <a href="{safe_url}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#3473FF,#00C48C);color:#FFFFFF;text-decoration:none;font-weight:800;">
                Задать новый пароль
              </a>
              <p style="margin:18px 0 0;color:#9AA4C8;font-size:13px;line-height:1.6;">
                Ссылка одноразовая и действует {expires_minutes} минут. Если кнопка не открывается, скопируйте адрес:<br>
                <span style="color:#8FB0FF;word-break:break-all;">{safe_url}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(recipient_email, reset_url, expires_minutes=60):
    subject = "Сброс пароля CoreDev"
    plain_body = format_password_reset_email_plain(reset_url, expires_minutes=expires_minutes)
    html_body = format_password_reset_email_html(reset_url, expires_minutes=expires_minutes)
    return _send_email(recipient_email, subject, plain_body, html_body)


def format_email_verification_plain(code, expires_minutes=10):
    return "\n".join([
        "Подтверждение email CoreDev",
        "",
        "Спасибо за регистрацию на CoreDev.",
        "Введите этот код в окне подтверждения на сайте:",
        "",
        code,
        "",
        f"Код действует {expires_minutes} минут.",
        "Если вы не регистрировались на CoreDev, просто проигнорируйте это письмо.",
    ])


def format_email_verification_html(code, expires_minutes=10):
    safe_code = _safe(code)
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение email CoreDev</title>
</head>
<body style="margin:0;padding:0;background:#050915;font-family:Inter,Arial,sans-serif;color:#EFF3FF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050915;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;">
          <tr>
            <td style="padding:28px 30px;border-radius:28px 28px 0 0;background:linear-gradient(135deg,#1748C8,#3473FF);color:#FFFFFF;">
              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.88;">CoreDev Account</div>
              <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;">Подтверждение email</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;opacity:0.92;">Завершите регистрацию, введя код на сайте.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;background:#080E1E;border:1px solid rgba(93,133,255,0.24);border-top:none;border-radius:0 0 28px 28px;">
              <p style="margin:0 0 18px;color:#DDE6FF;line-height:1.7;font-size:15px;">
                Ваш код подтверждения:
              </p>
              <div style="display:inline-block;padding:16px 24px;border-radius:16px;background:rgba(52,115,255,0.16);border:1px solid rgba(93,133,255,0.35);font-size:32px;font-weight:800;letter-spacing:0.35em;color:#FFFFFF;">
                {safe_code}
              </div>
              <p style="margin:18px 0 0;color:#9AA4C8;font-size:13px;line-height:1.6;">
                Код действует {expires_minutes} минут. Если вы не регистрировались, просто проигнорируйте письмо.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_email_verification_code(recipient_email, code, expires_minutes=10):
    subject = "Код подтверждения email CoreDev"
    plain_body = format_email_verification_plain(code, expires_minutes=expires_minutes)
    html_body = format_email_verification_html(code, expires_minutes=expires_minutes)
    return _send_email(recipient_email, subject, plain_body, html_body)


def send_test_email(recipient_email):
    subject = "Тестовое письмо CoreDev"
    plain_body = "\n".join([
        "Тестовое письмо CoreDev",
        "",
        "Если вы видите это сообщение, SMTP настроен правильно.",
        "Проверьте также папку «Спам», если письма не попадают во «Входящие».",
    ])
    html_body = (
        "<html><body style=\"font-family:Arial,sans-serif;color:#111;\">"
        "<h2>Тестовое письмо CoreDev</h2>"
        "<p>Если вы видите это сообщение, SMTP настроен правильно.</p>"
        "<p>Проверьте также папку «Спам», если письма не попадают во «Входящие».</p>"
        "</body></html>"
    )
    return _send_email(recipient_email, subject, plain_body, html_body)
