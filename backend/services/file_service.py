import os
import uuid
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".png", ".jpg", ".jpeg", ".gif", ".txt",
    ".zip", ".csv",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_upload(file: UploadFile) -> dict:
    """Save uploaded file and return metadata."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type {ext} not allowed")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File exceeds 10MB limit")

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(content)

    return {
        "original_name": file.filename,
        "saved_name": unique_name,
        "path": save_path,
        "size": len(content),
    }


def delete_upload(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
