from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.chat import ChannelType, MessageType, UserStatus

class ChatChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    channel_type: ChannelType = ChannelType.PUBLIC
    member_ids: Optional[List[int]] = None

class ChatChannelResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    channel_type: ChannelType
    created_at: datetime
    member_count: int
    unread_count: int
    
    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    content: str
    message_type: Optional[MessageType] = MessageType.TEXT
    reply_to_id: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    channel_id: int
    user_id: int
    username: str
    content: str
    message_type: MessageType
    created_at: datetime
    is_edited: bool
    reply_to_id: Optional[int]
    
    class Config:
        from_attributes = True

class ChatMemberResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: str
    status: UserStatus
    last_seen: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserPresenceResponse(BaseModel):
    user_id: int
    status: UserStatus
    status_message: Optional[str]
    last_seen: datetime
    
    class Config:
        from_attributes = True