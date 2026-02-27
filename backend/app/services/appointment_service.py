"""
Appointment Service Module.
Handles appointment booking, scheduling, and management.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from app import db
from app.models import Appointment, Doctor, User


class AppointmentService:
    """
    Service class for managing appointments.
    
    Responsibilities:
        - Find available doctors by specialization
        - Get available time slots
        - Book appointments
        - Manage appointment status
        - Handle emergency priority bookings
    """
    
    def __init__(self):
        """Initialize appointment service."""
        pass
    
    def get_doctors_by_specialization(
        self, 
        specialization: str = None,
        available_only: bool = True
    ) -> List[Dict]:
        """
        Get list of doctors, optionally filtered by specialization.
        
        Args:
            specialization: Filter by medical specialty
            available_only: Only return available doctors
        
        Returns:
            List of doctor dictionaries
        """
        query = Doctor.query
        
        if specialization:
            query = query.filter(
                Doctor.specialization.ilike(f'%{specialization}%')
            )
        
        if available_only:
            query = query.filter(Doctor.is_available == True)
        
        doctors = query.order_by(Doctor.rating.desc()).all()
        return [doc.to_dict() for doc in doctors]
    
    def get_available_slots(
        self, 
        doctor_id: int,
        date: datetime = None
    ) -> List[Dict]:
        """
        Get available time slots for a doctor.
        
        Args:
            doctor_id: Doctor identifier
            date: Specific date to check (defaults to upcoming days)
        
        Returns:
            List of available time slot dictionaries
        """
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return []
        
        # Get doctor's base available slots
        base_slots = doctor.available_slots or []
        
        # Generate actual datetime slots for the next 7 days
        available_slots = []
        start_date = date or datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        # Get existing appointments for this doctor
        existing_appointments = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.status.in_(['pending', 'confirmed']),
            Appointment.time_slot >= start_date,
            Appointment.time_slot < start_date + timedelta(days=7)
        ).all()
        
        booked_times = {apt.time_slot for apt in existing_appointments}
        
        # Generate slots for next 7 days
        for day_offset in range(7):
            current_date = start_date + timedelta(days=day_offset)
            
            # Skip if it's a past date
            if current_date.date() < datetime.utcnow().date():
                continue
            
            for slot_time in base_slots:
                try:
                    # Parse time from slot (e.g., "09:00", "14:30")
                    hour, minute = map(int, slot_time.split(':'))
                    slot_datetime = current_date.replace(hour=hour, minute=minute)
                    
                    # Skip past times for today
                    if slot_datetime <= datetime.utcnow():
                        continue
                    
                    # Check if slot is not already booked
                    if slot_datetime not in booked_times:
                        available_slots.append({
                            'datetime': slot_datetime.isoformat(),
                            'date': slot_datetime.strftime('%Y-%m-%d'),
                            'time': slot_time,
                            'day': slot_datetime.strftime('%A'),
                            'formatted': slot_datetime.strftime('%B %d, %Y at %I:%M %p')
                        })
                except (ValueError, AttributeError):
                    continue
        
        return available_slots[:20]  # Limit to 20 slots
    
    def book_appointment(
        self,
        user_id: int,
        doctor_id: int,
        time_slot: str,
        symptoms_summary: str = None,
        priority: str = 'normal',
        notes: str = None
    ) -> Dict[str, Any]:
        """
        Book an appointment with a doctor.
        
        Args:
            user_id: Patient user ID
            doctor_id: Doctor ID
            time_slot: ISO format datetime string
            symptoms_summary: Summary of patient symptoms
            priority: Priority level (normal/high/emergency)
            notes: Additional notes
        
        Returns:
            Booking result dictionary
        """
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        # Validate doctor exists
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return {'success': False, 'error': 'Doctor not found'}
        
        # Parse time slot
        try:
            slot_datetime = datetime.fromisoformat(time_slot.replace('Z', '+00:00'))
        except ValueError:
            return {'success': False, 'error': 'Invalid time slot format'}
        
        # Check if slot is still available
        existing = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.time_slot == slot_datetime,
            Appointment.status.in_(['pending', 'confirmed'])
        ).first()
        
        if existing:
            return {'success': False, 'error': 'Time slot is no longer available'}
        
        # Create appointment
        appointment = Appointment(
            user_id=user_id,
            doctor_id=doctor_id,
            time_slot=slot_datetime,
            status='pending',
            priority_flag=priority,
            symptoms_summary=symptoms_summary,
            notes=notes
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return {
            'success': True,
            'appointment': appointment.to_dict(),
            'message': f'Appointment booked with Dr. {doctor.name} on {slot_datetime.strftime("%B %d, %Y at %I:%M %p")}'
        }
    
    def book_emergency_appointment(
        self,
        user_id: int,
        specialization: str,
        symptoms_summary: str
    ) -> Dict[str, Any]:
        """
        Book emergency priority appointment with next available doctor.
        
        Args:
            user_id: Patient user ID
            specialization: Required medical specialty
            symptoms_summary: Summary of emergency symptoms
        
        Returns:
            Emergency booking result dictionary
        """
        # Find available doctors for the specialization
        doctors = self.get_doctors_by_specialization(specialization)
        
        if not doctors:
            # Fall back to general medicine
            doctors = self.get_doctors_by_specialization('General Medicine')
        
        if not doctors:
            return {
                'success': False,
                'error': 'No doctors available. Please call emergency services.',
                'emergency_contact': '911'
            }
        
        # Try to book with the first available doctor
        for doctor_data in doctors:
            slots = self.get_available_slots(doctor_data['id'])
            
            if slots:
                # Book the earliest available slot
                result = self.book_appointment(
                    user_id=user_id,
                    doctor_id=doctor_data['id'],
                    time_slot=slots[0]['datetime'],
                    symptoms_summary=symptoms_summary,
                    priority='emergency',
                    notes='EMERGENCY BOOKING - Priority Patient'
                )
                
                if result['success']:
                    result['emergency'] = True
                    result['message'] = f"🚨 EMERGENCY appointment booked with Dr. {doctor_data['name']}"
                    return result
        
        return {
            'success': False,
            'error': 'No immediate slots available. Please visit the nearest emergency room.',
            'emergency_contact': '911'
        }
    
    def get_user_appointments(
        self,
        user_id: int,
        status: str = None,
        upcoming_only: bool = False
    ) -> List[Dict]:
        """
        Get appointments for a user.
        
        Args:
            user_id: User identifier
            status: Filter by status
            upcoming_only: Only return future appointments
        
        Returns:
            List of appointment dictionaries
        """
        query = Appointment.query.filter(Appointment.user_id == user_id)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        if upcoming_only:
            query = query.filter(Appointment.time_slot >= datetime.utcnow())
        
        appointments = query.order_by(Appointment.time_slot.asc()).all()
        return [apt.to_dict() for apt in appointments]
    
    def update_appointment_status(
        self,
        appointment_id: int,
        status: str,
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Update appointment status.
        
        Args:
            appointment_id: Appointment identifier
            status: New status
            user_id: Optional user ID for authorization check
        
        Returns:
            Update result dictionary
        """
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return {'success': False, 'error': 'Appointment not found'}
        
        if user_id and appointment.user_id != user_id:
            return {'success': False, 'error': 'Unauthorized'}
        
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if status not in valid_statuses:
            return {'success': False, 'error': f'Invalid status. Must be one of: {valid_statuses}'}
        
        appointment.status = status
        db.session.commit()
        
        return {
            'success': True,
            'appointment': appointment.to_dict(),
            'message': f'Appointment status updated to {status}'
        }
    
    def cancel_appointment(self, appointment_id: int, user_id: int) -> Dict[str, Any]:
        """
        Cancel an appointment.
        
        Args:
            appointment_id: Appointment identifier
            user_id: User ID for authorization
        
        Returns:
            Cancellation result dictionary
        """
        return self.update_appointment_status(
            appointment_id=appointment_id,
            status='cancelled',
            user_id=user_id
        )
    
    def get_nearby_hospitals(self) -> List[Dict]:
        """
        Get list of nearby hospitals (mock data for demo).
        
        Returns:
            List of hospital information dictionaries
        """
        # Mock hospital data for hackathon demo
        return [
            {
                'name': 'City General Hospital',
                'address': '123 Medical Center Dr',
                'phone': '(555) 123-4567',
                'distance': '0.5 miles',
                'emergency': True,
                'wait_time': '15 mins'
            },
            {
                'name': 'St. Mary\'s Medical Center',
                'address': '456 Healthcare Ave',
                'phone': '(555) 234-5678',
                'distance': '1.2 miles',
                'emergency': True,
                'wait_time': '25 mins'
            },
            {
                'name': 'Regional Medical Center',
                'address': '789 Hospital Blvd',
                'phone': '(555) 345-6789',
                'distance': '2.0 miles',
                'emergency': True,
                'wait_time': '10 mins'
            },
            {
                'name': 'Community Health Hospital',
                'address': '321 Wellness Way',
                'phone': '(555) 456-7890',
                'distance': '3.5 miles',
                'emergency': True,
                'wait_time': '30 mins'
            },
        ]
