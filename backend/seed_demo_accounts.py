#!/usr/bin/env python3
"""
Seed demo accounts for quick testing
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import user as user_models
from app.auth import get_password_hash

def seed_demo_accounts():
    """Create demo accounts if they don't exist"""
    db = SessionLocal()
    
    try:
        demo_accounts = [
            {
                'username': 'demo',
                'email': 'demo@example.com',
                'full_name': 'Demo User',
                'password': 'demo123'
            },
            {
                'username': 'admin',
                'email': 'admin@example.com',
                'full_name': 'Admin User',
                'password': 'admin123'
            }
        ]
        
        for account in demo_accounts:
            # Check if user already exists
            existing_user = db.query(user_models.User).filter(
                user_models.User.username == account['username']
            ).first()
            
            if existing_user:
                print(f"✓ User '{account['username']}' already exists")
                continue
            
            # Create new user
            hashed_password = get_password_hash(account['password'])
            new_user = user_models.User(
                username=account['username'],
                email=account['email'],
                full_name=account['full_name'],
                hashed_password=hashed_password,
                is_active=True
            )
            
            db.add(new_user)
            db.commit()
            print(f"✓ Created demo account: {account['username']} / {account['password']}")
        
        print("\n✅ Demo accounts ready!")
        print("\nQuick Login Credentials:")
        print("  • demo / demo123")
        print("  • admin / admin123")
        
    except Exception as e:
        print(f"❌ Error creating demo accounts: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables if they don't exist
    user_models.Base.metadata.create_all(bind=engine)
    
    # Seed demo accounts
    seed_demo_accounts()
