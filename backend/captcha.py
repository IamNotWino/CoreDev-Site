import random
import re
import secrets
import time
from threading import Lock

CAPTCHA_TTL_SECONDS = 300
CAPTCHA_VARIANTS = 10
CAPTCHA_MAX_FAILURES = 3
CAPTCHA_BLOCK_SECONDS = 600

VOWELS = set("аеёиоуыэюяaeiouy")
COLORS = ("синий", "красный", "зелёный", "жёлтый", "белый", "чёрный")
WORDS_FOR_COUNT = ("проект", "заявка", "разработка", "безопасность", "сервер", "дизайн", "маркетинг")


class CaptchaStore:
    def __init__(self):
        self._items = {}
        self._lock = Lock()

    def save(self, captcha_id, answer, variant):
        with self._lock:
            self._cleanup_locked()
            self._items[captcha_id] = {
                "answer": self._normalize_answer(answer),
                "variant": variant,
                "expires_at": time.time() + CAPTCHA_TTL_SECONDS,
            }

    def verify(self, captcha_id, user_answer):
        normalized = self._normalize_answer(user_answer)
        with self._lock:
            self._cleanup_locked()
            item = self._items.pop(captcha_id, None)
            if not item:
                return False, "Капча устарела. Обновите проверку.", "expired"
            if item["expires_at"] < time.time():
                return False, "Капча устарела. Обновите проверку.", "expired"
            if normalized != item["answer"]:
                return False, "Неверный ответ капчи.", "wrong"
            return True, "", "ok"

    def _cleanup_locked(self):
        now = time.time()
        expired = [key for key, item in self._items.items() if item["expires_at"] <= now]
        for key in expired:
            self._items.pop(key, None)

    @staticmethod
    def _normalize_answer(value):
        return re.sub(r"\s+", " ", str(value or "").strip().lower().replace("ё", "е"))


captcha_store = CaptchaStore()


class CaptchaFailureGuard:
    def __init__(self):
        self._items = {}
        self._lock = Lock()

    def is_blocked(self, client_key):
        with self._lock:
            self._cleanup_locked()
            item = self._items.get(client_key)
            if not item:
                return False, 0
            blocked_until = item.get("blocked_until", 0)
            if blocked_until > time.time():
                return True, int(blocked_until - time.time())
            return False, 0

    def record_failure(self, client_key):
        with self._lock:
            self._cleanup_locked()
            item = self._items.setdefault(client_key, {"failures": 0, "blocked_until": 0})
            blocked_until = item.get("blocked_until", 0)
            if blocked_until > time.time():
                return True, int(blocked_until - time.time()), 0

            item["failures"] = item.get("failures", 0) + 1
            if item["failures"] >= CAPTCHA_MAX_FAILURES:
                item["blocked_until"] = time.time() + CAPTCHA_BLOCK_SECONDS
                item["failures"] = 0
                return True, CAPTCHA_BLOCK_SECONDS, 0

            remaining = CAPTCHA_MAX_FAILURES - item["failures"]
            return False, 0, remaining

    def clear(self, client_key):
        with self._lock:
            self._items.pop(client_key, None)

    def _cleanup_locked(self):
        now = time.time()
        expired = [
            key
            for key, item in self._items.items()
            if item.get("blocked_until", 0) <= now and item.get("failures", 0) == 0
        ]
        for key in expired:
            self._items.pop(key, None)


captcha_failure_guard = CaptchaFailureGuard()


def _make_id():
    return secrets.token_urlsafe(18)


def _pick_variant():
    return random.randint(1, CAPTCHA_VARIANTS)


def generate_captcha_challenge(forced_variant=None):
    variant = forced_variant or _pick_variant()
    captcha_id = _make_id()

    if variant == 1:
        left, right = random.randint(2, 25), random.randint(2, 25)
        answer = str(left + right)
        question = f"Сколько будет {left} + {right}?"
        title = "Сложение"
    elif variant == 2:
        left, right = random.randint(12, 40), random.randint(2, 11)
        answer = str(left - right)
        question = f"Сколько будет {left} − {right}?"
        title = "Вычитание"
    elif variant == 3:
        left, right = random.randint(2, 9), random.randint(2, 9)
        answer = str(left * right)
        question = f"Сколько будет {left} × {right}?"
        title = "Умножение"
    elif variant == 4:
        first = random.randint(2, 9)
        answer = str(first + 2)
        question = f"Какое число идёт после {first}, {first + 1}, {first + 2}, ?"
        title = "Последовательность"
    elif variant == 5:
        left, right = random.randint(11, 89), random.randint(2, 49)
        answer = str(max(left, right))
        question = f"Какое число больше: {left} или {right}?"
        title = "Сравнение чисел"
    elif variant == 6:
        word = random.choice(WORDS_FOR_COUNT)
        answer = str(len(word))
        question = f"Сколько букв в слове «{word}»?"
        title = "Подсчёт букв"
    elif variant == 7:
        word = random.choice(WORDS_FOR_COUNT)
        answer = str(sum(1 for char in word.lower() if char in VOWELS))
        question = f"Сколько гласных в слове «{word}»?"
        title = "Гласные буквы"
    elif variant == 8:
        color = random.choice(COLORS)
        answer = color.replace("ё", "е")
        question = f"Введите слово: {color}"
        title = "Проверка слова"
    elif variant == 9:
        apples = random.randint(5, 15)
        given = random.randint(1, apples - 1)
        answer = str(apples - given)
        question = f"У вас {apples} яблок, вы отдали {given}. Сколько осталось?"
        title = "Задача"
    else:
        answer = "7"
        question = "Сколько дней в одной неделе?"
        title = "Общие знания"

    captcha_store.save(captcha_id, answer, variant)
    return {
        "captcha_id": captcha_id,
        "variant": variant,
        "variant_total": CAPTCHA_VARIANTS,
        "title": title,
        "question": question,
        "expires_in": CAPTCHA_TTL_SECONDS,
    }


def verify_captcha_answer(captcha_id, user_answer):
    if not str(captcha_id or "").strip():
        return False, "Пройдите проверку капчи.", "missing"
    return captcha_store.verify(str(captcha_id).strip(), user_answer)


def get_captcha_block_status(client_key):
    return captcha_failure_guard.is_blocked(client_key)


def get_captcha_block_status_for_client(account_email, ip):
    retry_after = 0
    for key in (f"account:{account_email.lower()}", f"ip:{ip}"):
        blocked, retry = captcha_failure_guard.is_blocked(key)
        if blocked:
            retry_after = max(retry_after, retry)
    return retry_after > 0, retry_after


def record_captcha_failure(client_key):
    return captcha_failure_guard.record_failure(client_key)


def record_captcha_failure_for_client(account_email, ip):
    blocked = False
    retry_after = 0
    failures_left = CAPTCHA_MAX_FAILURES

    for key in (f"account:{account_email.lower()}", f"ip:{ip}"):
        key_blocked, key_retry, key_left = captcha_failure_guard.record_failure(key)
        if key_blocked:
            blocked = True
            retry_after = max(retry_after, key_retry)
        failures_left = min(failures_left, key_left)

    return blocked, retry_after, failures_left


def clear_captcha_failures(client_key):
    captcha_failure_guard.clear(client_key)


def clear_captcha_failures_for_client(account_email, ip):
    captcha_failure_guard.clear(f"account:{account_email.lower()}")
    captcha_failure_guard.clear(f"ip:{ip}")


CAPTCHA_BLOCK_MESSAGE = "Слишком много неправильных ответов на капчу. Подождите 10 минут"
