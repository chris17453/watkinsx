from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Form, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User, EmailAccount, Domain
from app.schemas.schemas import EmailMessage, EmailFolder
from app.api.routes.auth import get_current_user
from app.services.email_service import email_service

router = APIRouter()

class SendMessageRequest(BaseModel):
    to: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    # Note: attachments will be handled separately for now

@router.get("/accounts", response_model=List[dict])
async def get_user_email_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(EmailAccount).filter(
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).all()
    
    return [
        {
            "id": account.id,
            "email_address": account.email_address,
            "display_name": account.display_name,
            "is_primary": account.is_primary
        }
        for account in accounts
    ]

@router.get("/folders")
async def get_folders(
    account_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        folders = await email_service.get_folders(domain, email_account)
        return folders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch folders: {str(e)}")

@router.get("/messages", response_model=List[EmailMessage])
async def get_messages(
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        messages = await email_service.get_messages(domain, email_account, folder, limit)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

@router.get("/message/{message_id}")
async def get_message(
    message_id: str,
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        message = await email_service.get_message_content(domain, email_account, message_id, folder)
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch message: {str(e)}")

@router.post("/send")
async def send_message(
    message_data: SendMessageRequest,
    account_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        # For now, no attachments support via JSON API
        # Attachments would need a separate multipart endpoint
        attachment_list = []
        
        success = await email_service.send_message(
            domain, email_account, message_data.to, message_data.subject, 
            message_data.body_text, message_data.body_html,
            message_data.cc, message_data.bcc, attachment_list
        )
        
        return {"success": success, "message": "Email sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/move/{message_id}")
async def move_message(
    message_id: str,
    account_id: int = Query(...),
    from_folder: str = Query(...),
    to_folder: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        success = await email_service.move_message(domain, email_account, message_id, from_folder, to_folder)
        return {"success": success, "message": "Message moved successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move message: {str(e)}")

@router.delete("/message/{message_id}")
async def delete_message(
    message_id: str,
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        success = await email_service.delete_message(domain, email_account, message_id, folder)
        return {"success": success, "message": "Message deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")

@router.post("/message/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        success = await email_service.mark_as_read(domain, email_account, message_id, folder)
        return {"success": success, "message": "Message marked as read"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark message as read: {str(e)}")

@router.post("/message/{message_id}/unread")
async def mark_message_as_unread(
    message_id: str,
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        success = await email_service.mark_as_unread(domain, email_account, message_id, folder)
        return {"success": success, "message": "Message marked as unread"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark message as unread: {str(e)}")

@router.get("/search")
async def search_messages(
    account_id: int = Query(...),
    query: str = Query(...),
    folder: str = Query("INBOX"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        # For now, return filtered messages based on subject/sender
        # In production, this would use IMAP SEARCH capabilities
        messages = await email_service.get_messages(domain, email_account, folder, limit)
        
        # Simple client-side filtering
        query_lower = query.lower()
        filtered_messages = [
            msg for msg in messages
            if query_lower in (msg.subject or "").lower() 
            or query_lower in (msg.sender or "").lower()
            or any(query_lower in recipient.lower() for recipient in msg.recipient)
        ]
        
        return filtered_messages
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search messages: {str(e)}")

@router.get("/statistics")
async def get_email_statistics(
    account_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        folders = await email_service.get_folders(domain, email_account)
        
        total_messages = sum(f.message_count for f in folders)
        total_unread = sum(f.unread_count for f in folders)
        
        return {
            "total_messages": total_messages,
            "total_unread": total_unread,
            "folders": [
                {
                    "name": f.name,
                    "message_count": f.message_count,
                    "unread_count": f.unread_count
                }
                for f in folders
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@router.get("/threads")
async def get_threaded_messages(
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        threads = await email_service.get_threaded_messages(domain, email_account, folder, limit)
        
        # Convert to list format with thread metadata
        result = []
        for thread_id, messages in threads.items():
            result.append({
                "thread_id": thread_id,
                "message_count": len(messages),
                "subject": messages[0].subject if messages else "",
                "latest_date": max(msg.date for msg in messages) if messages else None,
                "participants": list(set([msg.sender for msg in messages] + 
                                       [addr for msg in messages for addr in msg.recipient])),
                "has_unread": any(not msg.is_read for msg in messages),
                "messages": messages
            })
        
        # Sort threads by latest message date
        result.sort(key=lambda thread: thread["latest_date"] or "", reverse=True)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get threaded messages: {str(e)}")

@router.get("/thread/{thread_id}")
async def get_thread(
    thread_id: str,
    account_id: int = Query(...),
    folder: str = Query("INBOX"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    email_account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).first()
    
    if not email_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    domain = db.query(Domain).filter(Domain.id == email_account.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    try:
        messages = await email_service.get_thread_messages(domain, email_account, thread_id, folder)
        return messages
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get thread messages: {str(e)}")