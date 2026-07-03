# CoreDev Site

Локальный сайт CoreDev с Python-сервером, HTML-шаблонами, статикой и интеграцией с Supabase.

## Структура проекта

```text
CoreDev Site/
├── server.py
├── README.md
├── .env
├── .gitignore
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── http.py
│   ├── security.py
│   ├── services.py
│   ├── settings.py
│   ├── supabase.py
│   ├── urls.py
│   └── views.py
├── templates/
│   ├── main.html
│   └── preloader.html
└── static/
    ├── css/
    │   ├── main.css
    │   └── preloader.css
    └── js/
        ├── main.js
        └── preloader.js
```

## Запуск

```powershell
python server.py
```

После запуска открой:

```text
http://127.0.0.1:8000
```

Главная страница сначала открывает прелоадер и выполняет проверку безопасности через API.

Основной сайт после успешной проверки доступен по адресу:

```text
http://127.0.0.1:8000/app
```

## Настройки Supabase

Секреты хранятся в `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-secret-key
PASSWORD_PEPPER=optional-extra-secret
BLOCKED_IPS=127.0.0.2,192.168.0.10
```

Файл `.env` добавлен в `.gitignore`, его нельзя публиковать.

## API

Сервер поддерживает локальные API-маршруты:

- `POST /api/register` - регистрация пользователя
- `POST /api/security-check` - проверка безопасного входа перед показом сайта
- `POST /api/login` - вход пользователя
- `POST /api/profile` - получение профиля
- `POST /api/change-password` - смена пароля
- `POST /api/delete-account` - удаление аккаунта
- `POST /api/project-request` - сохранение заявки

## Служебные страницы

- `/preloader` - экран загрузки и первичная security-проверка.
- `/app` - основной сайт.
- `/404` - страница ошибки сети/API с автоматическим возвратом после восстановления соединения.

## Backend-архитектура

Серверная часть оформлена в стиле Django:

- `backend/settings.py` - настройки проекта, пути, `.env`, Supabase.
- `backend/urls.py` - таблица маршрутов API и HTML-страниц.
- `backend/views.py` - обработчики запросов.
- `backend/services.py` - работа с Supabase Auth, профилями и заявками.
- `backend/security.py` - хеширование и проверка паролей.
- `backend/security_check.py` - проверка безопасного входа перед открытием сайта.
- `backend/http.py` - JSON-ответы и чтение JSON-запросов.
- `backend/app.py` - HTTP handler, который связывает маршруты с views.
- `server.py` - только точка запуска сервера.

## Заметки

- HTML лежит в `templates/`.
- CSS и JavaScript лежат в `static/`.
- Пароль в таблице профиля сохраняется как PBKDF2-хеш, не в открытом виде.
- После изменения файлов в `backend/` или `server.py` нужно перезапускать сервер.
