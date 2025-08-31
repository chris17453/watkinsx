from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(200), nullable=True)
    job_title = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Multi-tenant support
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    domain = relationship("Domain")
    user = relationship("User", back_populates="contacts")

class ContactGroup(Base):
    __tablename__ = "contact_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Multi-tenant support
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    domain = relationship("Domain")
    user = relationship("User")
    memberships = relationship("ContactGroupMembership", back_populates="group", cascade="all, delete-orphan")

class ContactGroupMembership(Base):
    __tablename__ = "contact_group_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("contact_groups.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contact = relationship("Contact")
    group = relationship("ContactGroup", back_populates="memberships")