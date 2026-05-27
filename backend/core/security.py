import hashlib
import base64


def hash_password(password: str) -> str:
    """SHA-256 fingerprint — used only as a column value, not for auth."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


def encode_app_password(password: str) -> str:
    """Base64-encode the raw app password for storage."""
    return base64.b64encode(password.encode()).decode()


def decode_app_password(encoded: str) -> str:
    """Decode the stored app password."""
    return base64.b64decode(encoded.encode()).decode()
