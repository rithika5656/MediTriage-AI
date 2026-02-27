"""
User Model.
Represents registered patients in the system.
Stores personal information and authentication credentials.
"""
from datetime import datetime
from app import db, bcrypt


class User(db.Model):
    """
    User model for patient accounts.
    
    Attributes:
        id: Unique identifier
        name: Full name of the patient
        age: Age in years
        gender: Gender (male/female/other)
        email: Unique email address for login
        phone: Contact phone number
        password_hash: Bcrypt hashed password
        created_at: Account creation timestamp
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    chat_history = db.relationship('ChatHistory', backref='user', lazy='dynamic')
    appointments = db.relationship('Appointment', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and store the password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Verify password against stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'email': self.email,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'
