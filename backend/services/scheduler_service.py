import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")


def schedule_email_job(
    job_id: str,
    run_at: datetime,
    func,
    kwargs: dict,
) -> str:
    """Schedule a one-time email job. Returns job_id."""
    scheduler.add_job(
        func,
        trigger=DateTrigger(run_date=run_at),
        id=job_id,
        kwargs=kwargs,
        replace_existing=True,
        misfire_grace_time=300,  # 5 minutes grace
    )
    logger.info(f"Scheduled job {job_id} at {run_at}")
    return job_id


def cancel_job(job_id: str) -> bool:
    try:
        scheduler.remove_job(job_id)
        logger.info(f"Cancelled job {job_id}")
        return True
    except Exception as e:
        logger.warning(f"Could not cancel job {job_id}: {e}")
        return False


def list_jobs() -> list:
    jobs = scheduler.get_jobs()
    return [
        {
            "id": job.id,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "name": job.name,
        }
        for job in jobs
    ]
