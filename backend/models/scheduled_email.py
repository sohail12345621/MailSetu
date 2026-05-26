from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from backend.core.database import Base


class ScheduledEmail(Base):
    __tablename__ = "scheduled_emails"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, nullable=True)
    to_address = Column(String, nullable=False)
    cc = Column(String, nullable=True)
    bcc = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    html_body = Column(Text, nullable=False)
    attachments = Column(Text, nullable=True)  # JSON list of file paths
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    job_id = Column(String, nullable=True, unique=True)
    status = Column(String, default="scheduled")  # scheduled | sent | cancelled | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
