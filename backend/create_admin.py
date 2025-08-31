#!/usr/bin/env python3
"""
Script to create an admin user and initial domain setup.
Run this after setting up the database and before first login.
"""

import sys
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.models import User, Domain, Base
from app.core.security import get_password_hash

def create_admin_user():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if domain exists
        domain = db.query(Domain).first()
        if not domain:
            print("Creating default domain...")
            domain = Domain(
                name="localhost",
                imap_server="localhost",
                imap_port=993,
                smtp_server="localhost",
                smtp_port=587,
                use_ssl=True
            )
            db.add(domain)
            db.commit()
            db.refresh(domain)
            print(f"Created domain: {domain.name}")
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.is_admin == True).first()
        if admin_user:
            print(f"Admin user already exists: {admin_user.username}")
            return
        
        # Get user input
        print("\nCreating admin user...")
        username = input("Admin username: ")
        email = input("Admin email: ")
        password = input("Admin password: ")
        full_name = input("Full name (optional): ") or None
        
        # Create admin user
        admin_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_admin=True,
            is_active=True,
            domain_id=domain.id
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"\n✅ Admin user created successfully!")
        print(f"Username: {admin_user.username}")
        print(f"Email: {admin_user.email}")
        print(f"Domain: {domain.name}")
        print(f"\nYou can now login at http://localhost:3000")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        sys.exit(1)
    
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()