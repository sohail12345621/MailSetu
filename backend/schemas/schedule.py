from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ScheduleCreate(BaseModel):
    to: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    subject: str
    html_body: str
    scheduled_at: datetime
    attachment_paths: Optional[List[str]] = []
    account_id: Optional[int] = None


class ScheduleResponse(BaseModel):
    id: int
    to_address: str
    subject: str
    scheduled_at: datetime
    job_id: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
