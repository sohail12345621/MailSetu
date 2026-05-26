import smtplib
import asyncio
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List
from backend.core.config import settings
from backend.core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)


async def send_email(
    smtp_host: str,
    smtp_port: int,
    sender_email: str,
    app_password: str,
    to: str,
    subject: str,
    html_body: str,
    cc: Optional[str] = None,
    bcc: Optional[str] = None,
    attachment_paths: Optional[List[str]] = None,
) -> dict:
    """
    Send an email via SMTP with retry logic and rate limiting.
    Returns {"success": bool, "error": str|None, "retries": int}
    """
    # Apply rate limiting
    await rate_limiter.acquire()

    last_error = None
    for attempt in range(settings.MAX_RETRIES):
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                _send_sync,
                smtp_host, smtp_port, sender_email, app_password,
                to, subject, html_body, cc, bcc, attachment_paths or []
            )
            return {"success": True, "error": None, "retries": attempt}
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Email send attempt {attempt + 1} failed: {e}")
            if attempt < settings.MAX_RETRIES - 1:
                await asyncio.sleep(settings.RETRY_DELAY * (attempt + 1))  # Exponential backoff

    return {"success": False, "error": last_error, "retries": settings.MAX_RETRIES}


def _send_sync(
    smtp_host: str,
    smtp_port: int,
    sender_email: str,
    app_password: str,
    to: str,
    subject: str,
    html_body: str,
    cc: Optional[str],
    bcc: Optional[str],
    attachment_paths: List[str],
):
    """Synchronous SMTP send (runs in executor to avoid blocking)."""
    msg = MIMEMultipart("alternative")
    msg["From"] = sender_email
    msg["To"] = to
    msg["Subject"] = subject
    if cc:
        msg["Cc"] = cc
    if bcc:
        msg["Bcc"] = bcc

    # Attach HTML body
    msg.attach(MIMEText(html_body, "html"))

    # Attach files
    for path in attachment_paths:
        if os.path.exists(path):
            with open(path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={os.path.basename(path)}",
            )
            msg.attach(part)

    # Build recipient list
    recipients = [addr.strip() for addr in to.split(",")]
    if cc:
        recipients += [addr.strip() for addr in cc.split(",")]
    if bcc:
        recipients += [addr.strip() for addr in bcc.split(",")]

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, recipients, msg.as_string())
