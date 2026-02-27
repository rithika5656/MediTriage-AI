"""
Doctor Model.
Stores information about available doctors and their schedules.
Used for appointment booking and specialization matching.
"""
from datetime import datetime
from app import db


class Doctor(db.Model):
    """
    Doctor model for healthcare providers.
    
    Attributes:
        id: Unique identifier
        name: Doctor's full name
        specialization: Medical specialty (e.g., General Medicine, Cardiology)
        qualification: Medical qualifications/degrees
        experience_years: Years of medical practice
        available_slots: JSON array of available time slots
        rating: Average patient rating (1-5)
        is_available: Whether doctor is currently accepting appointments
        created_at: Record creation timestamp
    """
    __tablename__ = 'doctors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False, index=True)
    qualification = db.Column(db.String(200))
    experience_years = db.Column(db.Integer, default=0)
    available_slots = db.Column(db.JSON, default=list)  # List of available time slots
    rating = db.Column(db.Float, default=4.0)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    appointments = db.relationship('Appointment', backref='doctor', lazy='dynamic')
    
    def to_dict(self):
        """Convert doctor object to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'specialization': self.specialization,
            'qualification': self.qualification,
            'experience_years': self.experience_years,
            'available_slots': self.available_slots,
            'rating': self.rating,
            'is_available': self.is_available
        }
    
    def __repr__(self):
        return f'<Doctor {self.name} - {self.specialization}>'
