from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from backend.core.database import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("email_accounts.id"), nullable=True)
    to_address = Column(String, nullable=False)
    cc = Column(String, nullable=True)
    bcc = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    body_preview = Column(String, nullable=True)  # First 200 chars
    status = Column(String, default="pending")  # pending | sent | failed
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    retries = Column(Integer, default=0)
    is_bulk = Column(Integer, default=0)  # 0=single, 1=bulk
