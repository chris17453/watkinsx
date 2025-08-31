from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User, Domain, EmailAccount
from app.schemas.schemas import Token, User as UserSchema
from app.core.security import create_access_token, verify_password, verify_token
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    domain_id: int = payload.get("domain_id")
    
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(
        User.email == email, 
        User.domain_id == domain_id,
        User.is_active == True
    ).first()
    
    if user is None:
        raise credentials_exception
        
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Extract domain from email if format is email@domain
    if "@" in form_data.username:
        local_part, domain_name = form_data.username.split("@", 1)
        domain = db.query(Domain).filter(Domain.name == domain_name, Domain.is_active == True).first()
        if not domain:
            raise HTTPException(status_code=400, detail="Domain not found")
    else:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    
    user = db.query(User).filter(
        User.email == form_data.username,
        User.domain_id == domain.id,
        User.is_active == True
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Auto-create email account if it doesn't exist
    existing_email_account = db.query(EmailAccount).filter(
        EmailAccount.user_id == user.id,
        EmailAccount.email_address == user.email
    ).first()
    
    if not existing_email_account:
        # Create email account with same credentials as user login
        email_account = EmailAccount(
            user_id=user.id,
            domain_id=user.domain_id,
            email_address=user.email,
            display_name=user.full_name or user.username,
            imap_username=user.email,
            imap_password=form_data.password,  # Store the plaintext password for IMAP
            is_primary=True,  # First account is always primary
            is_active=True
        )
        db.add(email_account)
        db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "domain_id": user.domain_id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user