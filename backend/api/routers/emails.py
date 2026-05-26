from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
import json

from backend.core.database import get_db
from backend.core.security import decode_app_password
from backend.models.email_account import EmailAccount
from backend.models.email_log import EmailLog
from backend.schemas.email import SendEmailRequest, BulkSendRequest, EmailLogResponse, BulkSendResult
from backend.services.smtp_service import send_email
from backend.services.csv_service import parse_csv, substitute_variables
from backend.api.routers.auth import get_active_account_id

router = APIRouter(prefix="/emails", tags=["emails"])


async def _get_account(account_id: Optional[int], db: AsyncSession) -> EmailAccount:
    aid = account_id or get_active_account_id()
    if not aid:
        raise HTTPException(status_code=401, detail="No active account. Please login.")
    result = await db.execute(select(EmailAccount).where(EmailAccount.id == aid))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post("/send")
async def send_single(req: SendEmailRequest, db: AsyncSession = Depends(get_db)):
    account = await _get_account(req.account_id, db)

    result = await send_email(
        smtp_host=account.smtp_host,
        smtp_port=account.smtp_port,
        sender_email=account.email,
        app_password=decode_app_password(account.app_password_enc),
        to=req.to,
        subject=req.subject,
        html_body=req.html_body,
        cc=req.cc,
        bcc=req.bcc,
        attachment_paths=req.attachment_paths,
    )

    log = EmailLog(
        account_id=account.id,
        to_address=req.to,
        cc=req.cc,
        bcc=req.bcc,
        subject=req.subject,
        body_preview=req.html_body[:200],
        status="sent" if result["success"] else "failed",
        error_message=result.get("error"),
        retries=result.get("retries", 0),
        is_bulk=0,
    )
    db.add(log)
    await db.commit()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return {"message": "Email sent successfully", "log_id": log.id}


@router.post("/bulk", response_model=BulkSendResult)
async def send_bulk(req: BulkSendRequest, db: AsyncSession = Depends(get_db)):
    account = await _get_account(req.account_id, db)

    sent = 0
    failed = 0
    results = []

    for contact in req.contacts:
        email = contact.get("email", "").strip()
        if not email:
            continue

        personalized_body = substitute_variables(req.html_body, contact)
        personalized_subject = substitute_variables(req.subject, contact)

        result = await send_email(
            smtp_host=account.smtp_host,
            smtp_port=account.smtp_port,
            sender_email=account.email,
            app_password=decode_app_password(account.app_password_enc),
            to=email,
            subject=personalized_subject,
            html_body=personalized_body,
            attachment_paths=req.attachment_paths,
        )

        log = EmailLog(
            account_id=account.id,
            to_address=email,
            subject=personalized_subject,
            body_preview=personalized_body[:200],
            status="sent" if result["success"] else "failed",
            error_message=result.get("error"),
            retries=result.get("retries", 0),
            is_bulk=1,
        )
        db.add(log)

        if result["success"]:
            sent += 1
        else:
            failed += 1

        results.append({
            "email": email,
            "status": "sent" if result["success"] else "failed",
            "error": result.get("error"),
        })

    await db.commit()
    return BulkSendResult(total=len(req.contacts), sent=sent, failed=failed, results=results)


@router.get("/logs", response_model=List[EmailLogResponse])
async def get_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(EmailLog).order_by(EmailLog.sent_at.desc())
    if status:
        query = query.where(EmailLog.status == status)
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(EmailLog.id)))
    sent = await db.scalar(select(func.count(EmailLog.id)).where(EmailLog.status == "sent"))
    failed = await db.scalar(select(func.count(EmailLog.id)).where(EmailLog.status == "failed"))
    return {"total": total, "sent": sent, "failed": failed, "pending": total - sent - failed}


@router.delete("/logs/{log_id}")
async def delete_log(log_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailLog).where(EmailLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    await db.delete(log)
    await db.commit()
    return {"message": "Deleted"}


@router.post("/parse-csv")
async def parse_csv_upload(file: UploadFile = File(...)):
    content = await file.read()
    try:
        contacts = parse_csv(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {str(e)}")
    return {"contacts": contacts, "count": len(contacts)}
