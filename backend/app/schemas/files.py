from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.files import FileStorageType

class FileStorageCreate(BaseModel):
    name: str
    storage_type: FileStorageType
    host: str
    port: Optional[int] = None
    username: str
    password: str
    bucket_name: Optional[str] = None
    region: Optional[str] = None
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    base_path: Optional[str] = "/"

class FileStorageResponse(BaseModel):
    id: int
    name: str
    storage_type: FileStorageType
    host: str
    port: Optional[int]
    username: str
    bucket_name: Optional[str]
    region: Optional[str]
    base_path: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class FileItem(BaseModel):
    name: str
    path: str
    size: Optional[int] = None
    modified: Optional[datetime] = None
    is_directory: bool = False
    permissions: Optional[str] = None

class DirectoryListing(BaseModel):
    current_path: str
    parent_path: Optional[str]
    items: List[FileItem]
    total_files: int
    total_directories: int

class FileBookmarkCreate(BaseModel):
    name: str
    path: str
    storage_id: int

class FileBookmarkResponse(BaseModel):
    id: int
    name: str
    path: str
    storage_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FileSearchRequest(BaseModel):
    storage_id: int
    search_term: str
    path: Optional[str] = None
    file_types: Optional[List[str]] = None
    max_results: Optional[int] = 100

class FileSearchResult(BaseModel):
    items: List[FileItem]
    search_term: str
    total_results: int
    search_path: str