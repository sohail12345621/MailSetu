from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SendEmailRequest(BaseModel):
    to: str  # Comma-separated for multiple
    cc: Optional[str] = None
    bcc: Optional[str] = None
    subject: str
    html_body: str
    attachment_paths: Optional[List[str]] = []
    account_id: Optional[int] = None


class BulkSendRequest(BaseModel):
    contacts: List[dict]  # Each has at least {"email": "..."}
    subject: str
    html_body: str  # May contain {{name}}, {{company}} etc.
    attachment_paths: Optional[List[str]] = []
    account_id: Optional[int] = None


class EmailLogResponse(BaseModel):
    id: int
    to_address: str
    cc: Optional[str]
    bcc: Optional[str]
    subject: str
    body_preview: Optional[str]
    status: str
    error_message: Optional[str]
    sent_at: datetime
    retries: int
    is_bulk: int

    model_config = {"from_attributes": True}


class BulkSendResult(BaseModel):
    total: int
    sent: int
    failed: int
    results: List[dict]
