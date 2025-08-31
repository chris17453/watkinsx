import feedparser
import requests
from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.rss import RSSFeed, RSSEntry
from app.models.models import User
from app.database.database import get_db

class RSSService:
    def __init__(self):
        self.timeout = 30
    
    def fetch_feed(self, url: str) -> Optional[Dict]:
        """Fetch and parse RSS feed from URL"""
        try:
            response = requests.get(url, timeout=self.timeout)
            if response.status_code == 200:
                feed = feedparser.parse(response.text)
                return feed
            else:
                print(f"Failed to fetch RSS feed {url}: HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"Error fetching RSS feed {url}: {str(e)}")
            return None
    
    def update_feed(self, db: Session, feed: RSSFeed) -> bool:
        """Update a specific RSS feed with new entries"""
        try:
            parsed_feed = self.fetch_feed(feed.url)
            if not parsed_feed:
                return False
            
            # Update feed metadata
            if hasattr(parsed_feed, 'feed'):
                feed.title = parsed_feed.feed.get('title', feed.title)
                feed.description = parsed_feed.feed.get('description', feed.description)
            
            feed.last_fetched = datetime.now(timezone.utc)
            
            # Process entries
            new_entries_count = 0
            for entry in parsed_feed.entries:
                guid = entry.get('id', entry.get('link', ''))
                if not guid:
                    continue
                
                # Check if entry already exists
                existing = db.query(RSSEntry).filter(
                    RSSEntry.feed_id == feed.id,
                    RSSEntry.guid == guid
                ).first()
                
                if existing:
                    continue
                
                # Parse published date
                published_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
                
                # Create new entry
                new_entry = RSSEntry(
                    feed_id=feed.id,
                    title=entry.get('title', 'Untitled'),
                    link=entry.get('link', ''),
                    description=entry.get('description', ''),
                    content=entry.get('content', [{}])[0].get('value', '') if entry.get('content') else '',
                    author=entry.get('author', ''),
                    published_date=published_date,
                    guid=guid
                )
                
                db.add(new_entry)
                new_entries_count += 1
            
            db.commit()
            print(f"Updated feed '{feed.title}': {new_entries_count} new entries")
            return True
            
        except Exception as e:
            print(f"Error updating RSS feed {feed.id}: {str(e)}")
            db.rollback()
            return False
    
    def update_all_feeds(self, db: Session, user_id: Optional[int] = None):
        """Update all active RSS feeds for a user or all users"""
        query = db.query(RSSFeed).filter(RSSFeed.is_active == True)
        if user_id:
            query = query.filter(RSSFeed.user_id == user_id)
        
        feeds = query.all()
        
        successful_updates = 0
        for feed in feeds:
            if self.update_feed(db, feed):
                successful_updates += 1
        
        print(f"Updated {successful_updates}/{len(feeds)} RSS feeds")
        
        return successful_updates
    
    def get_user_feeds(self, db: Session, user_id: int) -> List[RSSFeed]:
        """Get all RSS feeds for a user"""
        return db.query(RSSFeed).filter(RSSFeed.user_id == user_id).all()
    
    def get_feed_entries(self, db: Session, feed_id: int, limit: int = 50, offset: int = 0) -> List[RSSEntry]:
        """Get entries for a specific feed"""
        return db.query(RSSEntry).filter(
            RSSEntry.feed_id == feed_id
        ).order_by(
            RSSEntry.published_date.desc().nullslast(),
            RSSEntry.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    def get_all_entries_for_user(self, db: Session, user_id: int, limit: int = 50, offset: int = 0, unread_only: bool = False) -> List[RSSEntry]:
        """Get all entries for user's feeds"""
        query = db.query(RSSEntry).join(RSSFeed).filter(
            RSSFeed.user_id == user_id,
            RSSFeed.is_active == True
        )
        
        if unread_only:
            query = query.filter(RSSEntry.is_read == False)
        
        return query.order_by(
            RSSEntry.published_date.desc().nullslast(),
            RSSEntry.created_at.desc()
        ).offset(offset).limit(limit).all()
    
    def mark_entry_read(self, db: Session, entry_id: int, user_id: int) -> bool:
        """Mark an RSS entry as read"""
        entry = db.query(RSSEntry).join(RSSFeed).filter(
            RSSEntry.id == entry_id,
            RSSFeed.user_id == user_id
        ).first()
        
        if entry:
            entry.is_read = True
            db.commit()
            return True
        
        return False
    
    def add_feed(self, db: Session, user_id: int, url: str, title: str = None) -> Optional[RSSFeed]:
        """Add a new RSS feed for a user"""
        try:
            # Check if feed already exists for this user
            existing = db.query(RSSFeed).filter(
                RSSFeed.user_id == user_id,
                RSSFeed.url == url
            ).first()
            
            if existing:
                return existing
            
            new_feed = RSSFeed(
                user_id=user_id,
                url=url,
                title=title or "New Feed",
                is_active=True
            )
            
            db.add(new_feed)
            db.commit()
            db.refresh(new_feed)
            
            return new_feed
            
        except Exception as e:
            print(f"Error adding RSS feed: {str(e)}")
            db.rollback()
            return None