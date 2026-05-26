from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
import json

from backend.core.database import get_db
from backend.core.security import decode_app_password
from backend.models.scheduled_email import ScheduledEmail
from backend.models.email_account import EmailAccount
from backend.schemas.schedule import ScheduleCreate, ScheduleResponse
from backend.services.scheduler_service import schedule_email_job, cancel_job
from backend.services.smtp_service import send_email
from backend.api.routers.auth import get_active_account_id

router = APIRouter(prefix="/schedule", tags=["schedule"])


async def _execute_scheduled_email(scheduled_id: int):
    """Called by APScheduler when email is due."""
    from backend.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ScheduledEmail).where(ScheduledEmail.id == scheduled_id)
        )
        sched = result.scalar_one_or_none()
        if not sched or sched.status != "scheduled":
            return

        acc_result = await db.execute(
            select(EmailAccount).where(EmailAccount.id == sched.account_id)
        )
        account = acc_result.scalar_one_or_none()
        if not account:
            sched.status = "failed"
            await db.commit()
            return

        paths = json.loads(sched.attachments) if sched.attachments else []
        result = await send_email(
            smtp_host=account.smtp_host,
            smtp_port=account.smtp_port,
            sender_email=account.email,
            app_password=decode_app_password(account.app_password_enc),
            to=sched.to_address,
            cc=sched.cc,
            bcc=sched.bcc,
            subject=sched.subject,
            html_body=sched.html_body,
            attachment_paths=paths,
        )
        sched.status = "sent" if result["success"] else "failed"
        await db.commit()


@router.post("/", response_model=ScheduleResponse)
async def create_schedule(data: ScheduleCreate, db: AsyncSession = Depends(get_db)):
    aid = data.account_id or get_active_account_id()
    if not aid:
        raise HTTPException(status_code=401, detail="No active account")

    job_id = str(uuid.uuid4())
    sched = ScheduledEmail(
        account_id=aid,
        to_address=data.to,
        cc=data.cc,
        bcc=data.bcc,
        subject=data.subject,
        html_body=data.html_body,
        scheduled_at=data.scheduled_at,
        job_id=job_id,
        attachments=json.dumps(data.attachment_paths),
        status="scheduled",
    )
    db.add(sched)
    await db.commit()
    await db.refresh(sched)

    schedule_email_job(
        job_id=job_id,
        run_at=data.scheduled_at,
        func=_execute_scheduled_email,
        kwargs={"scheduled_id": sched.id},
    )
    return sched


@router.get("/", response_model=List[ScheduleResponse])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScheduledEmail).order_by(ScheduledEmail.scheduled_at.desc())
    )
    return result.scalars().all()


@router.delete("/{job_id}")
async def cancel_schedule(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScheduledEmail).where(ScheduledEmail.job_id == job_id)
    )
    sched = result.scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=404, detail="Scheduled email not found")

    cancel_job(job_id)
    sched.status = "cancelled"
    await db.commit()
    return {"message": "Cancelled"}
