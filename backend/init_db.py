#!/usr/bin/env python
"""
Initialize the database with tables
"""

from app.database import engine
from app.models.user import Base
# Import all models to ensure they're registered with SQLAlchemy
from app.models import user, document

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_database()