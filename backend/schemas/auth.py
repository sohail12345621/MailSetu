from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    app_password: str
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587


class AccountResponse(BaseModel):
    id: int
    email: str
    smtp_host: str
    smtp_port: int
    is_active: bool

    model_config = {"from_attributes": True}
