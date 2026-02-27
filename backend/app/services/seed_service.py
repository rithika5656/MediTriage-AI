"""
Seed Service Module.
Populates initial data for the application (doctors, etc.).
"""
from app import db
from app.models import Doctor


def seed_doctors():
    """
    Seed the database with initial doctor data.
    Only runs if doctors table is empty.
    """
    # Check if doctors already exist
    if Doctor.query.first():
        return
    
    doctors_data = [
        {
            'name': 'Dr. Sarah Johnson',
            'specialization': 'General Medicine',
            'qualification': 'MD, MBBS',
            'experience_years': 12,
            'available_slots': ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'],
            'rating': 4.8
        },
        {
            'name': 'Dr. Michael Chen',
            'specialization': 'Cardiology',
            'qualification': 'MD, DM Cardiology',
            'experience_years': 15,
            'available_slots': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
            'rating': 4.9
        },
        {
            'name': 'Dr. Emily Rodriguez',
            'specialization': 'Pulmonology',
            'qualification': 'MD, Pulmonary Medicine',
            'experience_years': 10,
            'available_slots': ['09:30', '10:30', '11:30', '14:30', '15:30'],
            'rating': 4.7
        },
        {
            'name': 'Dr. James Wilson',
            'specialization': 'Gastroenterology',
            'qualification': 'MD, DM Gastro',
            'experience_years': 14,
            'available_slots': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
            'rating': 4.6
        },
        {
            'name': 'Dr. Amanda Foster',
            'specialization': 'Neurology',
            'qualification': 'MD, DM Neurology',
            'experience_years': 11,
            'available_slots': ['10:00', '11:00', '12:00', '15:00', '16:00'],
            'rating': 4.8
        },
        {
            'name': 'Dr. Robert Kim',
            'specialization': 'Orthopedics',
            'qualification': 'MS Orthopedics',
            'experience_years': 13,
            'available_slots': ['09:00', '09:30', '10:00', '14:00', '14:30', '15:00'],
            'rating': 4.7
        },
        {
            'name': 'Dr. Lisa Thompson',
            'specialization': 'Dermatology',
            'qualification': 'MD Dermatology',
            'experience_years': 8,
            'available_slots': ['10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00'],
            'rating': 4.9
        },
        {
            'name': 'Dr. David Martinez',
            'specialization': 'ENT',
            'qualification': 'MS ENT',
            'experience_years': 9,
            'available_slots': ['09:00', '09:30', '10:00', '14:00', '14:30', '15:00', '15:30'],
            'rating': 4.5
        },
        {
            'name': 'Dr. Jennifer Brown',
            'specialization': 'General Medicine',
            'qualification': 'MD, MBBS, FCPS',
            'experience_years': 7,
            'available_slots': ['08:00', '08:30', '09:00', '09:30', '10:00', '13:00', '13:30', '14:00'],
            'rating': 4.6
        },
        {
            'name': 'Dr. William Anderson',
            'specialization': 'Cardiology',
            'qualification': 'MD, DM Cardiology, FACC',
            'experience_years': 20,
            'available_slots': ['11:00', '11:30', '12:00', '16:00', '16:30', '17:00'],
            'rating': 4.9
        },
    ]
    
    for doc_data in doctors_data:
        doctor = Doctor(**doc_data)
        db.session.add(doctor)
    
    db.session.commit()
    print(f"Seeded {len(doctors_data)} doctors successfully.")
