from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class RSSFeed(Base):
    __tablename__ = "rss_feeds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    last_fetched = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="rss_feeds")
    entries = relationship("RSSEntry", back_populates="feed", cascade="all, delete-orphan")

class RSSEntry(Base):
    __tablename__ = "rss_entries"

    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("rss_feeds.id"), nullable=False)
    title = Column(String(500), nullable=False)
    link = Column(String(1000), nullable=False)
    description = Column(Text)
    content = Column(Text)
    author = Column(String(255))
    published_date = Column(DateTime(timezone=True))
    guid = Column(String(500), unique=True, index=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    feed = relationship("RSSFeed", back_populates="entries")