from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict
from datetime import datetime, timezone

from app.database.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User, Domain
from app.models.chat import (
    ChatChannel, ChatMember, ChatMessage, UserPresence, 
    ChatNotification, ChannelType, MessageType, UserStatus
)
from app.schemas.chat import (
    ChatChannelCreate, ChatChannelResponse, ChatMessageResponse,
    ChatMemberResponse, UserPresenceResponse, SendMessageRequest
)

router = APIRouter(prefix="/chat", tags=["chat"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Connection might be closed
                    pass

    async def broadcast_to_channel(self, message: str, channel_members: List[int]):
        for user_id in channel_members:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

@router.get("/channels", response_model=List[ChatChannelResponse])
def get_user_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all channels the user is a member of"""
    channels = db.query(ChatChannel).join(ChatMember).filter(
        ChatMember.user_id == current_user.id,
        ChatChannel.is_active == True
    ).options(
        joinedload(ChatChannel.members).joinedload(ChatMember.user)
    ).all()
    
    result = []
    for channel in channels:
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.channel_id == channel.id,
            ChatMessage.id > db.query(ChatMember.last_read_message_id).filter(
                ChatMember.channel_id == channel.id,
                ChatMember.user_id == current_user.id
            ).scalar() or 0
        ).count()
        
        result.append(ChatChannelResponse(
            id=channel.id,
            name=channel.name,
            description=channel.description,
            channel_type=channel.channel_type,
            created_at=channel.created_at,
            member_count=len(channel.members),
            unread_count=unread_count
        ))
    
    return result

@router.get("/users", response_model=List[ChatMemberResponse])
def get_domain_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users in the same domain for direct messaging"""
    users = db.query(User).filter(
        User.domain_id == current_user.domain_id,
        User.is_active == True,
        User.id != current_user.id  # Exclude current user
    ).options(joinedload(User.user_presence)).all()
    
    return [ChatMemberResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        status=user.user_presence.status if user.user_presence else UserStatus.OFFLINE,
        last_seen=user.user_presence.last_seen if user.user_presence else None
    ) for user in users]

@router.post("/channels", response_model=ChatChannelResponse)
def create_channel(
    channel_data: ChatChannelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat channel"""
    channel = ChatChannel(
        domain_id=current_user.domain_id,
        name=channel_data.name,
        description=channel_data.description,
        channel_type=channel_data.channel_type,
        created_by=current_user.id
    )
    
    db.add(channel)
    db.flush()  # Get the channel ID
    
    # Add creator as admin member
    creator_member = ChatMember(
        channel_id=channel.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(creator_member)
    
    # Add other members if specified
    if channel_data.member_ids:
        for member_id in channel_data.member_ids:
            if member_id != current_user.id:  # Don't add creator twice
                member = ChatMember(
                    channel_id=channel.id,
                    user_id=member_id
                )
                db.add(member)
    
    db.commit()
    db.refresh(channel)
    
    return ChatChannelResponse(
        id=channel.id,
        name=channel.name,
        description=channel.description,
        channel_type=channel.channel_type,
        created_at=channel.created_at,
        member_count=len(channel_data.member_ids) + 1 if channel_data.member_ids else 1,
        unread_count=0
    )

@router.post("/channels/direct")
def create_direct_message_channel(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or get existing direct message channel between two users"""
    # Check if DM channel already exists
    existing_channel = db.query(ChatChannel).join(ChatMember, ChatChannel.id == ChatMember.channel_id).filter(
        ChatChannel.channel_type == ChannelType.DIRECT_MESSAGE,
        ChatChannel.domain_id == current_user.domain_id
    ).group_by(ChatChannel.id).having(
        db.func.count(ChatMember.user_id) == 2
    ).filter(
        db.exists().where(
            db.and_(
                ChatMember.channel_id == ChatChannel.id,
                ChatMember.user_id == current_user.id
            )
        )
    ).filter(
        db.exists().where(
            db.and_(
                ChatMember.channel_id == ChatChannel.id,
                ChatMember.user_id == target_user_id
            )
        )
    ).first()
    
    if existing_channel:
        return {"channel_id": existing_channel.id}
    
    # Create new DM channel
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user or target_user.domain_id != current_user.domain_id:
        raise HTTPException(status_code=404, detail="User not found")
    
    channel = ChatChannel(
        domain_id=current_user.domain_id,
        name=f"{current_user.username}, {target_user.username}",
        channel_type=ChannelType.DIRECT_MESSAGE,
        created_by=current_user.id
    )
    
    db.add(channel)
    db.flush()
    
    # Add both users as members
    for user_id in [current_user.id, target_user_id]:
        member = ChatMember(
            channel_id=channel.id,
            user_id=user_id
        )
        db.add(member)
    
    db.commit()
    
    return {"channel_id": channel.id}

@router.get("/channels/{channel_id}/messages", response_model=List[ChatMessageResponse])
def get_channel_messages(
    channel_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for a specific channel"""
    # Verify user is member of channel
    member = db.query(ChatMember).filter(
        ChatMember.channel_id == channel_id,
        ChatMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this channel")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.channel_id == channel_id,
        ChatMessage.is_deleted == False
    ).options(
        joinedload(ChatMessage.user)
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()
    
    return [ChatMessageResponse(
        id=msg.id,
        channel_id=msg.channel_id,
        user_id=msg.user_id,
        username=msg.user.username,
        content=msg.content,
        message_type=msg.message_type,
        created_at=msg.created_at,
        is_edited=msg.is_edited,
        reply_to_id=msg.reply_to_id
    ) for msg in reversed(messages)]

@router.post("/channels/{channel_id}/messages")
def send_message(
    channel_id: int,
    message_data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a channel"""
    # Verify user is member and can post
    member = db.query(ChatMember).filter(
        ChatMember.channel_id == channel_id,
        ChatMember.user_id == current_user.id
    ).first()
    
    if not member or not member.can_post:
        raise HTTPException(status_code=403, detail="Cannot post to this channel")
    
    message = ChatMessage(
        channel_id=channel_id,
        user_id=current_user.id,
        content=message_data.content,
        message_type=message_data.message_type or MessageType.TEXT,
        reply_to_id=message_data.reply_to_id
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Notify other channel members via WebSocket
    channel_members = db.query(ChatMember.user_id).filter(
        ChatMember.channel_id == channel_id,
        ChatMember.user_id != current_user.id
    ).all()
    
    # Broadcast to WebSocket connections (simplified)
    # In production, you'd want proper message formatting
    
    return {"message": "Message sent", "message_id": message.id}

@router.put("/presence")
def update_presence(
    status: UserStatus,
    status_message: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user presence status"""
    presence = db.query(UserPresence).filter(
        UserPresence.user_id == current_user.id
    ).first()
    
    if not presence:
        presence = UserPresence(
            user_id=current_user.id,
            status=status,
            status_message=status_message
        )
        db.add(presence)
    else:
        presence.status = status
        presence.status_message = status_message
        presence.last_seen = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Presence updated"}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, user_id)
    
    # Update user presence to online
    presence = db.query(UserPresence).filter(
        UserPresence.user_id == user_id
    ).first()
    
    if presence:
        presence.status = UserStatus.ONLINE
        presence.last_seen = datetime.now(timezone.utc)
        db.commit()
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages here
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        
        # Update user presence to offline
        if presence:
            presence.status = UserStatus.OFFLINE
            presence.last_seen = datetime.now(timezone.utc)
            db.commit()