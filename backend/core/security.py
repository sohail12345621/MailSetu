from passlib.context import CryptContext
import base64

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def encode_app_password(password: str) -> str:
    """Simple base64 encoding for app password storage (desktop app)."""
    return base64.b64encode(password.encode()).decode()


def decode_app_password(encoded: str) -> str:
    """Decode app password."""
    return base64.b64decode(encoded.encode()).decode()
