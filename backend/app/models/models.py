from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Domain(Base):
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    imap_server = Column(String, nullable=False)
    imap_port = Column(Integer, default=993)
    smtp_server = Column(String, nullable=False)
    smtp_port = Column(Integer, default=587)
    use_ssl = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    theme_config = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="domain")
    chat_channels = relationship("ChatChannel", foreign_keys="ChatChannel.domain_id")
    file_storages = relationship("FileStorage", back_populates="domain")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    theme_preferences = Column(JSON, default={})
    storage_quota_mb = Column(Integer, default=1000)  # 1GB default
    storage_used_mb = Column(Integer, default=0)
    email_quota_daily = Column(Integer, default=500)  # 500 emails per day
    email_sent_today = Column(Integer, default=0)
    last_quota_reset = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    domain = relationship("Domain", back_populates="users")
    email_accounts = relationship("EmailAccount", back_populates="user")
    rss_feeds = relationship("RSSFeed", back_populates="user")
    
    # Chat relationships
    chat_memberships = relationship("ChatMember", foreign_keys="ChatMember.user_id")
    chat_messages = relationship("ChatMessage", foreign_keys="ChatMessage.user_id")
    user_presence = relationship("UserPresence", uselist=False, back_populates="user")
    chat_notifications = relationship("ChatNotification", foreign_keys="ChatNotification.user_id")
    
    # File storage relationships
    file_storages = relationship("FileStorage", back_populates="user")
    
    # Contact relationships
    contacts = relationship("Contact", back_populates="user")

class EmailAccount(Base):
    __tablename__ = "email_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    email_address = Column(String, nullable=False)
    display_name = Column(String)
    imap_username = Column(String, nullable=False)
    imap_password = Column(String, nullable=False)  # encrypted
    user_id = Column(Integer, ForeignKey("users.id"))
    domain_id = Column(Integer, ForeignKey("domains.id"))
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="email_accounts")

class Theme(Base):
    __tablename__ = "themes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    display_name = Column(String)
    css_variables = Column(JSON)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())