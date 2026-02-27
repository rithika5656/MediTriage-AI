# create_db.py
"""
Run this script once to create all database tables from your Flask models.
Usage: python create_db.py
"""
from app import create_app, db

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created successfully.")
