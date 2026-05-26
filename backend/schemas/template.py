from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TemplateCreate(BaseModel):
    name: str
    subject: str
    html_body: str


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html_body: Optional[str] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    subject: str
    html_body: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
