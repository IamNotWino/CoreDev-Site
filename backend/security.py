import hashlib
import secrets
import string

from .settings import PASSWORD_HASH_ITERATIONS, PASSWORD_PEPPER


def make_password_salt():
    # 16 chars total: 5 special, 2 uppercase, 6 lowercase, 3 digits.
    special_chars = "!@#$%^&*()-_=+[]{};:,.?/"
    chars = (
        [secrets.choice(special_chars) for _ in range(5)]
        + [secrets.choice(string.ascii_uppercase) for _ in range(2)]
        + [secrets.choice(string.ascii_lowercase) for _ in range(6)]
        + [secrets.choice(string.digits) for _ in range(3)]
    )
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def hash_password(password):
    salt = make_password_salt()
    password_bytes = f"{password}{PASSWORD_PEPPER}".encode("utf-8")
    salt_bytes = salt.encode("utf-8")
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password_bytes,
        salt_bytes,
        PASSWORD_HASH_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${digest}"


def verify_password(password, stored_hash):
    try:
        algorithm, iterations_raw, salt, digest = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iterations_raw)
        password_bytes = f"{password}{PASSWORD_PEPPER}".encode("utf-8")
        salt_bytes = salt.encode("utf-8")
        check_digest = hashlib.pbkdf2_hmac("sha256", password_bytes, salt_bytes, iterations).hex()
        return secrets.compare_digest(check_digest, digest)
    except Exception:
        return False
