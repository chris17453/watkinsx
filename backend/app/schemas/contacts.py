from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ContactCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = False

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None

class ContactResponse(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str]
    email: str
    phone: Optional[str]
    company: Optional[str]
    job_title: Optional[str]
    notes: Optional[str]
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ContactGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None

class ContactGroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    created_at: datetime
    member_count: int
    
    class Config:
        from_attributes = True

class ContactGroupMembershipCreate(BaseModel):
    contact_id: int
    group_id: int

class ContactSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 50

class ContactImportRequest(BaseModel):
    contacts: List[ContactCreate]