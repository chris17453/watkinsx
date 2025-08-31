from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List

from app.database.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User
from app.models.contacts import Contact, ContactGroup, ContactGroupMembership
from app.schemas.contacts import (
    ContactCreate, ContactUpdate, ContactResponse,
    ContactGroupCreate, ContactGroupResponse,
    ContactGroupMembershipCreate, ContactSearchRequest,
    ContactImportRequest
)

router = APIRouter()

# Contact CRUD operations
@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    group_id: int = None,
    favorites_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contacts for the current user with optional filtering"""
    query = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Contact.first_name.ilike(search_term),
                Contact.last_name.ilike(search_term),
                Contact.email.ilike(search_term),
                Contact.company.ilike(search_term)
            )
        )
    
    if group_id:
        query = query.join(ContactGroupMembership).filter(
            ContactGroupMembership.group_id == group_id
        )
    
    if favorites_only:
        query = query.filter(Contact.is_favorite == True)
    
    contacts = query.offset(skip).limit(limit).all()
    return contacts

@router.post("/contacts", response_model=ContactResponse)
def create_contact(
    contact_data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new contact"""
    # Check if contact with same email already exists for this user
    existing_contact = db.query(Contact).filter(
        Contact.email == contact_data.email,
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    ).first()
    
    if existing_contact:
        raise HTTPException(
            status_code=400, 
            detail="Contact with this email already exists"
        )
    
    contact = Contact(
        **contact_data.dict(),
        user_id=current_user.id,
        domain_id=current_user.domain_id
    )
    
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return contact

@router.put("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check email uniqueness if email is being updated
    if contact_data.email and contact_data.email != contact.email:
        existing_contact = db.query(Contact).filter(
            Contact.email == contact_data.email,
            Contact.user_id == current_user.id,
            Contact.domain_id == current_user.domain_id,
            Contact.id != contact_id
        ).first()
        
        if existing_contact:
            raise HTTPException(
                status_code=400, 
                detail="Contact with this email already exists"
            )
    
    update_data = contact_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted successfully"}

@router.post("/contacts/search", response_model=List[ContactResponse])
def search_contacts(
    search_request: ContactSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Advanced contact search"""
    search_term = f"%{search_request.query}%"
    
    contacts = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id,
        or_(
            Contact.first_name.ilike(search_term),
            Contact.last_name.ilike(search_term),
            Contact.email.ilike(search_term),
            Contact.company.ilike(search_term),
            Contact.phone.ilike(search_term),
            Contact.job_title.ilike(search_term)
        )
    ).limit(search_request.limit).all()
    
    return contacts

@router.post("/contacts/import")
def import_contacts(
    import_request: ContactImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk import contacts"""
    created_count = 0
    updated_count = 0
    errors = []
    
    for contact_data in import_request.contacts:
        try:
            existing_contact = db.query(Contact).filter(
                Contact.email == contact_data.email,
                Contact.user_id == current_user.id,
                Contact.domain_id == current_user.domain_id
            ).first()
            
            if existing_contact:
                # Update existing contact
                update_data = contact_data.dict(exclude_unset=True)
                for field, value in update_data.items():
                    setattr(existing_contact, field, value)
                updated_count += 1
            else:
                # Create new contact
                contact = Contact(
                    **contact_data.dict(),
                    user_id=current_user.id,
                    domain_id=current_user.domain_id
                )
                db.add(contact)
                created_count += 1
                
        except Exception as e:
            errors.append(f"Error importing {contact_data.email}: {str(e)}")
    
    db.commit()
    
    return {
        "created": created_count,
        "updated": updated_count,
        "errors": errors
    }

# Contact Group operations
@router.get("/contact-groups", response_model=List[ContactGroupResponse])
def get_contact_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contact groups for the current user"""
    groups = db.query(ContactGroup).filter(
        ContactGroup.user_id == current_user.id,
        ContactGroup.domain_id == current_user.domain_id
    ).all()
    
    # Add member count to each group
    for group in groups:
        group.member_count = db.query(ContactGroupMembership).filter(
            ContactGroupMembership.group_id == group.id
        ).count()
    
    return groups

@router.post("/contact-groups", response_model=ContactGroupResponse)
def create_contact_group(
    group_data: ContactGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new contact group"""
    group = ContactGroup(
        **group_data.dict(),
        user_id=current_user.id,
        domain_id=current_user.domain_id
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Add member count
    group.member_count = 0
    
    return group

@router.delete("/contact-groups/{group_id}")
def delete_contact_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a contact group"""
    group = db.query(ContactGroup).filter(
        ContactGroup.id == group_id,
        ContactGroup.user_id == current_user.id,
        ContactGroup.domain_id == current_user.domain_id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Contact group not found")
    
    db.delete(group)
    db.commit()
    return {"message": "Contact group deleted successfully"}

@router.post("/contact-groups/{group_id}/members")
def add_contact_to_group(
    group_id: int,
    membership_data: ContactGroupMembershipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a contact to a group"""
    # Verify group belongs to user
    group = db.query(ContactGroup).filter(
        ContactGroup.id == group_id,
        ContactGroup.user_id == current_user.id,
        ContactGroup.domain_id == current_user.domain_id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Contact group not found")
    
    # Verify contact belongs to user
    contact = db.query(Contact).filter(
        Contact.id == membership_data.contact_id,
        Contact.user_id == current_user.id,
        Contact.domain_id == current_user.domain_id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check if membership already exists
    existing_membership = db.query(ContactGroupMembership).filter(
        ContactGroupMembership.contact_id == membership_data.contact_id,
        ContactGroupMembership.group_id == group_id
    ).first()
    
    if existing_membership:
        raise HTTPException(status_code=400, detail="Contact already in group")
    
    membership = ContactGroupMembership(
        contact_id=membership_data.contact_id,
        group_id=group_id
    )
    
    db.add(membership)
    db.commit()
    return {"message": "Contact added to group successfully"}

@router.delete("/contact-groups/{group_id}/members/{contact_id}")
def remove_contact_from_group(
    group_id: int,
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a contact from a group"""
    # Verify group belongs to user
    group = db.query(ContactGroup).filter(
        ContactGroup.id == group_id,
        ContactGroup.user_id == current_user.id,
        ContactGroup.domain_id == current_user.domain_id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Contact group not found")
    
    # Find and remove membership
    membership = db.query(ContactGroupMembership).filter(
        ContactGroupMembership.contact_id == contact_id,
        ContactGroupMembership.group_id == group_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Contact not in group")
    
    db.delete(membership)
    db.commit()
    return {"message": "Contact removed from group successfully"}