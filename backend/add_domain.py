#!/usr/bin/env python3
"""
Script to add a new domain with IMAP settings
Usage: python add_domain.py
"""

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.models import Domain

def add_domain():
    db = SessionLocal()
    
    try:
        print("Add New Email Domain")
        print("===================")
        
        name = input("Domain name (e.g., gmail.com): ")
        imap_server = input("IMAP server (e.g., imap.gmail.com): ")
        imap_port = int(input("IMAP port (default 993): ") or 993)
        smtp_server = input("SMTP server (e.g., smtp.gmail.com): ")
        smtp_port = int(input("SMTP port (default 587): ") or 587)
        use_ssl = input("Use SSL? (y/n, default y): ").lower() != 'n'
        
        domain = Domain(
            name=name,
            imap_server=imap_server,
            imap_port=imap_port,
            smtp_server=smtp_server,
            smtp_port=smtp_port,
            use_ssl=use_ssl,
            is_active=True
        )
        
        db.add(domain)
        db.commit()
        db.refresh(domain)
        
        print(f"\n✅ Domain '{name}' added successfully!")
        print(f"Domain ID: {domain.id}")
        print(f"IMAP: {imap_server}:{imap_port} (SSL: {use_ssl})")
        print(f"SMTP: {smtp_server}:{smtp_port}")
        
    except Exception as e:
        print(f"❌ Error adding domain: {e}")
        db.rollback()
    
    finally:
        db.close()

if __name__ == "__main__":
    add_domain()