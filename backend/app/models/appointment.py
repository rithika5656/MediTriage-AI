"""
Appointment Model.
Stores patient appointment bookings with doctors.
Tracks appointment status and priority for emergency cases.
"""
from datetime import datetime
from app import db


class Appointment(db.Model):
    """
    Appointment model for doctor bookings.
    
    Attributes:
        id: Unique appointment identifier
        user_id: Foreign key to patient
        doctor_id: Foreign key to doctor
        time_slot: Scheduled appointment time
        status: Appointment status (pending/confirmed/completed/cancelled)
        priority_flag: Emergency priority level (normal/high/emergency)
        symptoms_summary: Brief summary of patient symptoms
        notes: Additional notes or special requirements
        created_at: Booking timestamp
        updated_at: Last update timestamp
    """
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False, index=True)
    time_slot = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled
    priority_flag = db.Column(db.String(20), default='normal')  # normal, high, emergency
    symptoms_summary = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert appointment to dictionary for API responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id,
            'doctor_name': self.doctor.name if self.doctor else None,
            'doctor_specialization': self.doctor.specialization if self.doctor else None,
            'time_slot': self.time_slot.isoformat() if self.time_slot else None,
            'status': self.status,
            'priority_flag': self.priority_flag,
            'symptoms_summary': self.symptoms_summary,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Appointment {self.id} - User {self.user_id}>'
