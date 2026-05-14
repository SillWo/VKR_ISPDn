import hashlib
import hmac
import secrets

PASSWORD_HASH_ITERATIONS = 210_000
ACCESS_TOKEN_EXPIRE_DAYS = 7


def generate_password_salt() -> str:
    return secrets.token_hex(16)


def hash_password(password: str, salt: str) -> str:
    # PBKDF2 keeps plaintext passwords out of storage while staying stdlib-only for the local diploma project.
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_HASH_ITERATIONS,
    )
    return password_hash.hex()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    actual_hash = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def generate_access_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    # Store only the token hash so a leaked database cannot be used directly as bearer credentials.
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
