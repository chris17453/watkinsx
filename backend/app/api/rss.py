from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User
from app.models.rss import RSSFeed, RSSEntry
from app.services.rss_service import RSSService
from app.schemas.rss import (
    RSSFeedCreate, RSSFeedResponse, RSSFeedUpdate,
    RSSEntryResponse, RSSFeedWithStats
)

router = APIRouter(prefix="/rss", tags=["rss"])
rss_service = RSSService()

@router.get("/feeds", response_model=List[RSSFeedWithStats])
def get_user_feeds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all RSS feeds for the current user"""
    feeds = rss_service.get_user_feeds(db, current_user.id)
    
    # Add stats to each feed
    feed_stats = []
    for feed in feeds:
        unread_count = db.query(RSSEntry).filter(
            RSSEntry.feed_id == feed.id,
            RSSEntry.is_read == False
        ).count()
        
        total_count = db.query(RSSEntry).filter(
            RSSEntry.feed_id == feed.id
        ).count()
        
        feed_data = RSSFeedWithStats(
            id=feed.id,
            title=feed.title,
            url=feed.url,
            description=feed.description,
            is_active=feed.is_active,
            last_fetched=feed.last_fetched,
            created_at=feed.created_at,
            unread_count=unread_count,
            total_count=total_count
        )
        feed_stats.append(feed_data)
    
    return feed_stats

@router.post("/feeds", response_model=RSSFeedResponse)
def add_feed(
    feed_data: RSSFeedCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new RSS feed"""
    feed = rss_service.add_feed(db, current_user.id, feed_data.url, feed_data.title)
    
    if not feed:
        raise HTTPException(status_code=400, detail="Failed to add RSS feed")
    
    # Try to fetch initial data
    try:
        rss_service.update_feed(db, feed)
    except Exception as e:
        print(f"Warning: Failed to fetch initial feed data: {str(e)}")
    
    return RSSFeedResponse(
        id=feed.id,
        title=feed.title,
        url=feed.url,
        description=feed.description,
        is_active=feed.is_active,
        last_fetched=feed.last_fetched,
        created_at=feed.created_at
    )

@router.put("/feeds/{feed_id}", response_model=RSSFeedResponse)
def update_feed(
    feed_id: int,
    feed_data: RSSFeedUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an RSS feed"""
    feed = db.query(RSSFeed).filter(
        RSSFeed.id == feed_id,
        RSSFeed.user_id == current_user.id
    ).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # Update fields
    if feed_data.title is not None:
        feed.title = feed_data.title
    if feed_data.is_active is not None:
        feed.is_active = feed_data.is_active
    
    db.commit()
    db.refresh(feed)
    
    return RSSFeedResponse(
        id=feed.id,
        title=feed.title,
        url=feed.url,
        description=feed.description,
        is_active=feed.is_active,
        last_fetched=feed.last_fetched,
        created_at=feed.created_at
    )

@router.delete("/feeds/{feed_id}")
def delete_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an RSS feed"""
    feed = db.query(RSSFeed).filter(
        RSSFeed.id == feed_id,
        RSSFeed.user_id == current_user.id
    ).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    db.delete(feed)
    db.commit()
    
    return {"message": "Feed deleted successfully"}

@router.post("/feeds/{feed_id}/refresh")
def refresh_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually refresh a specific RSS feed"""
    feed = db.query(RSSFeed).filter(
        RSSFeed.id == feed_id,
        RSSFeed.user_id == current_user.id
    ).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    success = rss_service.update_feed(db, feed)
    
    if success:
        return {"message": "Feed refreshed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to refresh feed")

@router.get("/feeds/{feed_id}/entries", response_model=List[RSSEntryResponse])
def get_feed_entries(
    feed_id: int,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get entries for a specific RSS feed"""
    # Verify user owns this feed
    feed = db.query(RSSFeed).filter(
        RSSFeed.id == feed_id,
        RSSFeed.user_id == current_user.id
    ).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    entries = rss_service.get_feed_entries(db, feed_id, limit, offset)
    
    return [RSSEntryResponse(
        id=entry.id,
        feed_id=entry.feed_id,
        title=entry.title,
        link=entry.link,
        description=entry.description,
        content=entry.content,
        author=entry.author,
        published_date=entry.published_date,
        is_read=entry.is_read,
        created_at=entry.created_at
    ) for entry in entries]

@router.get("/entries", response_model=List[RSSEntryResponse])
def get_all_entries(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all RSS entries for the current user"""
    entries = rss_service.get_all_entries_for_user(
        db, current_user.id, limit, offset, unread_only
    )
    
    return [RSSEntryResponse(
        id=entry.id,
        feed_id=entry.feed_id,
        title=entry.title,
        link=entry.link,
        description=entry.description,
        content=entry.content,
        author=entry.author,
        published_date=entry.published_date,
        is_read=entry.is_read,
        created_at=entry.created_at
    ) for entry in entries]

@router.post("/entries/{entry_id}/read")
def mark_entry_read(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an RSS entry as read"""
    success = rss_service.mark_entry_read(db, entry_id, current_user.id)
    
    if success:
        return {"message": "Entry marked as read"}
    else:
        raise HTTPException(status_code=404, detail="Entry not found")

@router.post("/refresh-all")
def refresh_all_feeds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refresh all RSS feeds for the current user"""
    updated_count = rss_service.update_all_feeds(db, current_user.id)
    
    return {"message": f"Refreshed {updated_count} feeds"}