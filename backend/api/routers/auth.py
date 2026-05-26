from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import smtplib
from typing import Optional

from backend.core.database import get_db
from backend.core.security import hash_password, verify_password, encode_app_password
from backend.models.email_account import EmailAccount
from backend.schemas.auth import LoginRequest, AccountResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple in-memory session (per process). For desktop app this is fine.
_active_account_id: Optional[int] = None


@router.post("/login", response_model=AccountResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    global _active_account_id

    # Verify SMTP credentials first
    try:
        import socket
        smtp = smtplib.SMTP(data.smtp_host, data.smtp_port, timeout=10)
        smtp.ehlo()
        smtp.starttls()
        smtp.login(data.email, data.app_password)
        smtp.quit()
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid email or app password")
    except (smtplib.SMTPException, socket.error) as e:
        raise HTTPException(status_code=400, detail=f"SMTP connection failed: {str(e)}")

    # Upsert account
    result = await db.execute(select(EmailAccount).where(EmailAccount.email == data.email))
    account = result.scalar_one_or_none()

    if account:
        account.hashed_password = hash_password(data.app_password)
        account.app_password_enc = encode_app_password(data.app_password)
        account.smtp_host = data.smtp_host
        account.smtp_port = data.smtp_port
    else:
        account = EmailAccount(
            email=data.email,
            hashed_password=hash_password(data.app_password),
            app_password_enc=encode_app_password(data.app_password),
            smtp_host=data.smtp_host,
            smtp_port=data.smtp_port,
        )
        db.add(account)

    await db.commit()
    await db.refresh(account)
    _active_account_id = account.id
    return account


@router.get("/me", response_model=AccountResponse)
async def get_me(db: AsyncSession = Depends(get_db)):
    if _active_account_id is None:
        raise HTTPException(status_code=401, detail="Not logged in")
    result = await db.execute(
        select(EmailAccount).where(EmailAccount.id == _active_account_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post("/logout")
async def logout():
    global _active_account_id
    _active_account_id = None
    return {"message": "Logged out"}


@router.get("/accounts", response_model=list[AccountResponse])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailAccount))
    return result.scalars().all()


def get_active_account_id() -> Optional[int]:
    return _active_account_id
