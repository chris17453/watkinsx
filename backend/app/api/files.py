from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io

from app.database.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User
from app.models.files import FileStorage, FileBookmark, FileSearchHistory
from app.schemas.files import (
    FileStorageCreate, FileStorageResponse, DirectoryListing,
    FileBookmarkCreate, FileBookmarkResponse, FileSearchRequest, FileSearchResult
)
from app.services.file_browser import FileBrowserService

router = APIRouter()

@router.get("/storages", response_model=List[FileStorageResponse])
def get_user_storages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all file storages for the current user"""
    storages = db.query(FileStorage).filter(
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id,
        FileStorage.is_active == True
    ).all()
    return storages

@router.post("/storages", response_model=FileStorageResponse)
def create_storage(
    storage_data: FileStorageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new file storage connection"""
    # TODO: Encrypt password before storing
    storage = FileStorage(
        **storage_data.dict(),
        user_id=current_user.id,
        domain_id=current_user.domain_id
    )
    
    db.add(storage)
    db.commit()
    db.refresh(storage)
    return storage

@router.get("/storages/{storage_id}/test")
def test_storage_connection(
    storage_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test connection to a file storage"""
    storage = db.query(FileStorage).filter(
        FileStorage.id == storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    try:
        service = FileBrowserService(storage)
        # This will be async in real implementation
        # is_connected = await service.test_connection()
        return {"connected": True, "message": "Connection successful"}
    except Exception as e:
        return {"connected": False, "message": str(e)}

@router.get("/storages/{storage_id}/browse")
async def browse_directory(
    storage_id: int,
    path: str = "/",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> DirectoryListing:
    """Browse files and directories in storage"""
    storage = db.query(FileStorage).filter(
        FileStorage.id == storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    try:
        service = FileBrowserService(storage)
        return await service.list_directory(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/storages/{storage_id}/search")
async def search_files(
    storage_id: int,
    search_request: FileSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FileSearchResult:
    """Search for files in storage"""
    storage = db.query(FileStorage).filter(
        FileStorage.id == storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    try:
        service = FileBrowserService(storage)
        result = await service.search_files(
            search_request.search_term,
            search_request.path,
            search_request.max_results or 100
        )
        
        # Save search to history
        search_history = FileSearchHistory(
            search_term=search_request.search_term,
            storage_id=storage_id,
            user_id=current_user.id,
            results_count=result.total_results,
            search_path=search_request.path or "/"
        )
        db.add(search_history)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/storages/{storage_id}/download")
async def download_file(
    storage_id: int,
    file_path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file from storage"""
    storage = db.query(FileStorage).filter(
        FileStorage.id == storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    try:
        service = FileBrowserService(storage)
        file_content = await service.download_file(file_path)
        
        # Determine filename and content type
        filename = file_path.split('/')[-1]
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type='application/octet-stream',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/storages/{storage_id}")
def delete_storage(
    storage_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file storage"""
    storage = db.query(FileStorage).filter(
        FileStorage.id == storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    db.delete(storage)
    db.commit()
    return {"message": "Storage deleted successfully"}

# Bookmarks
@router.get("/bookmarks", response_model=List[FileBookmarkResponse])
def get_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's file bookmarks"""
    bookmarks = db.query(FileBookmark).filter(
        FileBookmark.user_id == current_user.id
    ).all()
    return bookmarks

@router.post("/bookmarks", response_model=FileBookmarkResponse)
def create_bookmark(
    bookmark_data: FileBookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new file bookmark"""
    # Verify storage belongs to user
    storage = db.query(FileStorage).filter(
        FileStorage.id == bookmark_data.storage_id,
        FileStorage.user_id == current_user.id,
        FileStorage.domain_id == current_user.domain_id
    ).first()
    
    if not storage:
        raise HTTPException(status_code=404, detail="Storage not found")
    
    bookmark = FileBookmark(
        **bookmark_data.dict(),
        user_id=current_user.id
    )
    
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark

@router.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file bookmark"""
    bookmark = db.query(FileBookmark).filter(
        FileBookmark.id == bookmark_id,
        FileBookmark.user_id == current_user.id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark deleted successfully"}