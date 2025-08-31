from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DomainBase(BaseModel):
    name: str
    imap_server: str
    imap_port: int = 993
    smtp_server: str
    smtp_port: int = 587
    use_ssl: bool = True
    theme_config: Dict[str, Any] = {}

class DomainCreate(DomainBase):
    pass

class Domain(DomainBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    theme_preferences: Dict[str, Any] = {}
    storage_quota_mb: int = 1000
    email_quota_daily: int = 500

class UserCreate(UserBase):
    password: str
    domain_id: int
    is_admin: bool = False

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    domain_id: int
    storage_used_mb: int = 0
    email_sent_today: int = 0
    last_quota_reset: Optional[datetime]
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        orm_mode = True

class EmailAccountBase(BaseModel):
    email_address: str
    display_name: Optional[str] = None
    imap_username: str

class EmailAccountCreate(EmailAccountBase):
    imap_password: str
    domain_id: int

class EmailAccount(EmailAccountBase):
    id: int
    user_id: int
    domain_id: int
    is_primary: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class ThemeBase(BaseModel):
    name: str
    display_name: str
    css_variables: Dict[str, str]

class ThemeCreate(ThemeBase):
    pass

class Theme(ThemeBase):
    id: int
    is_default: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    domain_id: Optional[int] = None

class EmailMessage(BaseModel):
    id: str
    subject: str
    sender: str
    recipient: List[str]
    date: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    is_read: bool = False
    has_attachments: bool = False
    folder: str = "INBOX"
    thread_id: Optional[str] = None
    message_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    references: Optional[str] = None

class EmailFolder(BaseModel):
    name: str
    display_name: str
    message_count: int
    unread_count: int