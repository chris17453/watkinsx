from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Domain, User
from app.schemas.schemas import Domain as DomainSchema, DomainCreate
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DomainSchema])
async def get_domains(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        # Regular users can only see their own domain
        domains = db.query(Domain).filter(Domain.id == current_user.domain_id).all()
    else:
        # Admins can see all domains
        domains = db.query(Domain).filter(Domain.is_active == True).offset(skip).limit(limit).all()
    
    return domains

@router.post("/", response_model=DomainSchema)
async def create_domain(
    domain: DomainCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow admins to create domains
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if domain already exists
    if db.query(Domain).filter(Domain.name == domain.name).first():
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    db_domain = Domain(**domain.dict())
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    
    return db_domain

@router.get("/{domain_id}", response_model=DomainSchema)
async def get_domain(
    domain_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Users can only access their own domain unless they're admin
    if not current_user.is_admin and domain.id != current_user.domain_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return domain