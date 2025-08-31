from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User, EmailAccount
from app.schemas.schemas import User as UserSchema, EmailAccount as EmailAccountSchema, EmailAccountCreate
from app.api.routes.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me/accounts", response_model=List[EmailAccountSchema])
async def get_my_email_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(EmailAccount).filter(
        EmailAccount.user_id == current_user.id,
        EmailAccount.is_active == True
    ).all()
    
    return accounts

@router.post("/me/accounts", response_model=EmailAccountSchema)
async def create_email_account(
    account: EmailAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if email account already exists for this user
    existing_account = db.query(EmailAccount).filter(
        EmailAccount.email_address == account.email_address,
        EmailAccount.user_id == current_user.id
    ).first()
    
    if existing_account:
        raise HTTPException(status_code=400, detail="Email account already exists")
    
    # Create new email account
    # Note: In production, password should be encrypted
    db_account = EmailAccount(
        email_address=account.email_address,
        display_name=account.display_name,
        imap_username=account.imap_username,
        imap_password=account.imap_password,  # Should be encrypted in production
        user_id=current_user.id,
        domain_id=account.domain_id,
        is_primary=not bool(db.query(EmailAccount).filter(
            EmailAccount.user_id == current_user.id
        ).first())  # First account is primary
    )
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.put("/me/accounts/{account_id}/primary")
async def set_primary_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account belongs to current user
    account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Set all accounts to non-primary
    db.query(EmailAccount).filter(
        EmailAccount.user_id == current_user.id
    ).update({"is_primary": False})
    
    # Set this account as primary
    account.is_primary = True
    db.commit()
    
    return {"message": "Primary account updated"}

@router.delete("/me/accounts/{account_id}")
async def delete_email_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(EmailAccount).filter(
        EmailAccount.id == account_id,
        EmailAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Soft delete
    account.is_active = False
    db.commit()
    
    return {"message": "Email account deleted"}