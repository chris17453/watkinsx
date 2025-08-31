from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database.database import get_db
from app.models.models import Domain, User, EmailAccount
from app.schemas.schemas import Domain as DomainSchema, DomainCreate, User as UserSchema
from app.api.routes.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

def verify_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Domain Management
@router.get("/domains", response_model=List[DomainSchema])
async def get_all_domains(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Domain)
    
    if search:
        query = query.filter(Domain.name.ilike(f"%{search}%"))
    
    domains = query.offset(skip).limit(limit).all()
    return domains

@router.post("/domains", response_model=DomainSchema)
async def create_domain(
    domain: DomainCreate,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    # Check if domain already exists
    existing_domain = db.query(Domain).filter(Domain.name == domain.name).first()
    if existing_domain:
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    db_domain = Domain(**domain.dict())
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    
    return db_domain

@router.put("/domains/{domain_id}", response_model=DomainSchema)
async def update_domain(
    domain_id: int,
    domain_update: DomainCreate,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    for key, value in domain_update.dict().items():
        setattr(domain, key, value)
    
    db.commit()
    db.refresh(domain)
    return domain

@router.delete("/domains/{domain_id}")
async def delete_domain(
    domain_id: int,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Check if domain has users
    user_count = db.query(func.count(User.id)).filter(User.domain_id == domain_id).scalar()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete domain with existing users")
    
    db.delete(domain)
    db.commit()
    return {"message": "Domain deleted successfully"}

@router.post("/domains/{domain_id}/toggle")
async def toggle_domain_status(
    domain_id: int,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    domain.is_active = not domain.is_active
    db.commit()
    
    return {"message": f"Domain {'activated' if domain.is_active else 'deactivated'} successfully"}

# User Management
@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    domain_id: Optional[int] = None,
    search: Optional[str] = None,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if domain_id:
        query = query.filter(User.domain_id == domain_id)
    
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    domain_id: int
    full_name: Optional[str] = None
    is_admin: bool = False
    storage_quota_mb: int = 1000
    email_quota_daily: int = 500

@router.post("/users")
async def create_user(
    user_data: UserCreateRequest,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    # Check if user already exists (by email in domain)
    existing_user = db.query(User).filter(
        (User.email == user_data.email) & (User.domain_id == user_data.domain_id)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email address already exists in this domain")
    
    # Check if domain exists
    domain = db.query(Domain).filter(Domain.id == user_data.domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_admin=user_data.is_admin,
        domain_id=user_data.domain_id,
        storage_quota_mb=user_data.storage_quota_mb,
        email_quota_daily=user_data.email_quota_daily,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Auto-create email account for the new user
    email_account = EmailAccount(
        user_id=db_user.id,
        domain_id=db_user.domain_id,
        email_address=db_user.email,
        display_name=db_user.full_name or db_user.username,
        imap_username=db_user.email,
        imap_password=user_data.password,  # Store the plaintext password for IMAP
        is_primary=True,
        is_active=True
    )
    db.add(email_account)
    db.commit()
    
    return {"message": "User created successfully", "user_id": db_user.id}

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None
    storage_quota_mb: Optional[int] = None
    email_quota_daily: Optional[int] = None

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)
    if user_data.storage_quota_mb is not None:
        user.storage_quota_mb = user_data.storage_quota_mb
    if user_data.email_quota_daily is not None:
        user.email_quota_daily = user_data.email_quota_daily
    
    db.commit()
    db.refresh(user)
    
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated email accounts
    db.query(EmailAccount).filter(EmailAccount.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: int,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}

class PasswordResetRequest(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    password_data: PasswordResetRequest,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}

# System Statistics
@router.get("/statistics")
async def get_system_statistics(
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    total_domains = db.query(func.count(Domain.id)).scalar()
    active_domains = db.query(func.count(Domain.id)).filter(Domain.is_active == True).scalar()
    
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    admin_users = db.query(func.count(User.id)).filter(User.is_admin == True).scalar()
    
    total_email_accounts = db.query(func.count(EmailAccount.id)).scalar()
    active_email_accounts = db.query(func.count(EmailAccount.id)).filter(EmailAccount.is_active == True).scalar()
    
    return {
        "domains": {
            "total": total_domains,
            "active": active_domains,
            "inactive": total_domains - active_domains
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users,
            "admins": admin_users
        },
        "email_accounts": {
            "total": total_email_accounts,
            "active": active_email_accounts,
            "inactive": total_email_accounts - active_email_accounts
        }
    }

# Email Account Management (Admin view)
@router.get("/email-accounts")
async def get_all_email_accounts(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    domain_id: Optional[int] = None,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    query = db.query(EmailAccount).join(User)
    
    if user_id:
        query = query.filter(EmailAccount.user_id == user_id)
    
    if domain_id:
        query = query.filter(EmailAccount.domain_id == domain_id)
    
    accounts = query.offset(skip).limit(limit).all()
    
    result = []
    for account in accounts:
        user = db.query(User).filter(User.id == account.user_id).first()
        domain = db.query(Domain).filter(Domain.id == account.domain_id).first()
        
        result.append({
            "id": account.id,
            "email_address": account.email_address,
            "display_name": account.display_name,
            "is_primary": account.is_primary,
            "is_active": account.is_active,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name
            },
            "domain": {
                "id": domain.id,
                "name": domain.name
            },
            "created_at": account.created_at
        })
    
    return result

@router.delete("/email-accounts/{account_id}")
async def delete_email_account(
    account_id: int,
    admin_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "Email account deleted successfully"}