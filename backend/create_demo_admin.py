#!/usr/bin/env python3
"""
Script to create demo admin user automatically
"""

from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.models import User, Domain, Base
from app.core.security import get_password_hash

def create_demo_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if domain exists
        domain = db.query(Domain).first()
        if not domain:
            print("Creating demo domain...")
            domain = Domain(
                name="demo.localhost",
                imap_server="demo.localhost",
                imap_port=993,
                smtp_server="demo.localhost", 
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
        
        # Create demo admin user
        admin_user = User(
            username="admin",
            email="admin@demo.localhost",
            hashed_password=get_password_hash("admin123"),
            full_name="Demo Admin",
            is_admin=True,
            is_active=True,
            domain_id=domain.id
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"\n✅ Demo admin user created!")
        print(f"Username: {admin_user.username}")
        print(f"Password: admin123")
        print(f"Email: {admin_user.email}")
        print(f"Domain: {domain.name}")
        print(f"\nLogin at: http://localhost:3000")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_admin()