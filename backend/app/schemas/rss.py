from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

class RSSFeedCreate(BaseModel):
    url: HttpUrl
    title: Optional[str] = None

class RSSFeedUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

class RSSFeedResponse(BaseModel):
    id: int
    title: str
    url: str
    description: Optional[str]
    is_active: bool
    last_fetched: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class RSSFeedWithStats(RSSFeedResponse):
    unread_count: int
    total_count: int

class RSSEntryResponse(BaseModel):
    id: int
    feed_id: int
    title: str
    link: str
    description: Optional[str]
    content: Optional[str]
    author: Optional[str]
    published_date: Optional[datetime]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True