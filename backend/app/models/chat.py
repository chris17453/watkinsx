from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class ChannelType(enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    DIRECT_MESSAGE = "direct_message"

class MessageType(enum.Enum):
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    SYSTEM = "system"

class UserStatus(enum.Enum):
    ONLINE = "online"
    AWAY = "away"
    BUSY = "busy"
    OFFLINE = "offline"

class ChatChannel(Base):
    __tablename__ = "chat_channels"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    channel_type = Column(Enum(ChannelType), default=ChannelType.PUBLIC)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    domain = relationship("Domain")
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("ChatMember", back_populates="channel", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="channel", cascade="all, delete-orphan")

class ChatMember(Base):
    __tablename__ = "chat_members"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("chat_channels.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_admin = Column(Boolean, default=False)
    can_post = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_read_message_id = Column(Integer, ForeignKey("chat_messages.id"))

    # Relationships
    channel = relationship("ChatChannel", back_populates="members")
    user = relationship("User")
    last_read_message = relationship("ChatMessage", foreign_keys=[last_read_message_id])

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("chat_channels.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    file_url = Column(String(500))  # For file/image messages
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"))
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True))

    # Relationships
    channel = relationship("ChatChannel", back_populates="messages")
    user = relationship("User")
    reply_to = relationship("ChatMessage", remote_side=[id])

class UserPresence(Base):
    __tablename__ = "user_presence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    status = Column(Enum(UserStatus), default=UserStatus.OFFLINE)
    status_message = Column(String(255))
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")

class ChatNotification(Base):
    __tablename__ = "chat_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("chat_channels.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=False)
    is_read = Column(Boolean, default=False)
    sound_played = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    channel = relationship("ChatChannel")
    message = relationship("ChatMessage")