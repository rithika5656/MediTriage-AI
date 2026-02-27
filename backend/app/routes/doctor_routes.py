"""
Doctor Routes.
Handles doctor listing and availability queries.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.appointment_service import AppointmentService
from app.models import Doctor

doctor_bp = Blueprint('doctors', __name__)

# Initialize service
appointment_service = AppointmentService()


@doctor_bp.route('', methods=['GET'])
def get_doctors():
    """
    Get list of all doctors.
    
    Query Parameters:
        - specialization: Filter by medical specialty
        - available: If 'true', only return available doctors
    
    Returns:
        - 200: List of doctors
    """
    specialization = request.args.get('specialization')
    available_only = request.args.get('available', 'true').lower() == 'true'
    
    doctors = appointment_service.get_doctors_by_specialization(
        specialization=specialization,
        available_only=available_only
    )
    
    return jsonify({
        'doctors': doctors,
        'count': len(doctors)
    }), 200


@doctor_bp.route('/specializations', methods=['GET'])
def get_specializations():
    """
    Get list of all available medical specializations.
    
    Returns:
        - 200: List of unique specializations
    """
    specializations = Doctor.query.with_entities(
        Doctor.specialization
    ).distinct().all()
    
    spec_list = [s[0] for s in specializations]
    
    return jsonify({
        'specializations': sorted(spec_list),
        'count': len(spec_list)
    }), 200


@doctor_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """
    Get details of a specific doctor.
    
    URL Parameters:
        - doctor_id: ID of the doctor
    
    Returns:
        - 200: Doctor details
        - 404: Doctor not found
    """
    doctor = Doctor.query.get(doctor_id)
    
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    return jsonify({'doctor': doctor.to_dict()}), 200


@doctor_bp.route('/<int:doctor_id>/slots', methods=['GET'])
def get_doctor_slots(doctor_id):
    """
    Get available time slots for a specific doctor.
    
    URL Parameters:
        - doctor_id: ID of the doctor
    
    Query Parameters:
        - date: Specific date to check (YYYY-MM-DD format)
    
    Returns:
        - 200: List of available time slots
        - 404: Doctor not found
    """
    doctor = Doctor.query.get(doctor_id)
    
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    date_str = request.args.get('date')
    date = None
    
    if date_str:
        from datetime import datetime
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    slots = appointment_service.get_available_slots(
        doctor_id=doctor_id,
        date=date
    )
    
    return jsonify({
        'doctor': doctor.to_dict(),
        'available_slots': slots,
        'count': len(slots)
    }), 200


@doctor_bp.route('/search', methods=['GET'])
def search_doctors():
    """
    Search doctors by name or specialization.
    
    Query Parameters:
        - q: Search query (searches name and specialization)
    
    Returns:
        - 200: List of matching doctors
    """
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'error': 'Search query is required'}), 400
    
    doctors = Doctor.query.filter(
        (Doctor.name.ilike(f'%{query}%')) |
        (Doctor.specialization.ilike(f'%{query}%'))
    ).filter(Doctor.is_available == True).all()
    
    return jsonify({
        'doctors': [d.to_dict() for d in doctors],
        'count': len(doctors),
        'query': query
    }), 200
