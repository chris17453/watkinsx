from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime
import enum

class FileStorageType(enum.Enum):
    SFTP = "SFTP"
    S3 = "S3"
    FTP = "FTP"

class FileStorage(Base):
    __tablename__ = "file_storages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    storage_type = Column(Enum(FileStorageType), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=True)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)  # Should be encrypted
    bucket_name = Column(String(255), nullable=True)  # For S3
    region = Column(String(100), nullable=True)  # For S3
    access_key = Column(String(255), nullable=True)  # For S3
    secret_key = Column(String(500), nullable=True)  # For S3
    base_path = Column(String(500), nullable=True, default="/")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Multi-tenant support
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    domain = relationship("Domain", back_populates="file_storages")
    user = relationship("User", back_populates="file_storages")
    bookmarks = relationship("FileBookmark", back_populates="storage", cascade="all, delete-orphan")

class FileBookmark(Base):
    __tablename__ = "file_bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1000), nullable=False)
    storage_id = Column(Integer, ForeignKey("file_storages.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    storage = relationship("FileStorage", back_populates="bookmarks")
    user = relationship("User")

class FileSearchHistory(Base):
    __tablename__ = "file_search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    search_term = Column(String(500), nullable=False)
    storage_id = Column(Integer, ForeignKey("file_storages.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    results_count = Column(Integer, default=0)
    search_path = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    storage = relationship("FileStorage")
    user = relationship("User")