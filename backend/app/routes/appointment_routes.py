"""
Appointment Routes.
Handles appointment booking, retrieval, and management.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.appointment_service import AppointmentService

appointment_bp = Blueprint('appointments', __name__)

# Initialize service
appointment_service = AppointmentService()


@appointment_bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    """
    Get all appointments for the current user.
    
    Query Parameters:
        - status: Filter by status (pending/confirmed/completed/cancelled)
        - upcoming: If 'true', only return future appointments
    
    Returns:
        - 200: List of appointments
    """
    user_id = get_jwt_identity()
    status = request.args.get('status')
    upcoming = request.args.get('upcoming', '').lower() == 'true'
    
    appointments = appointment_service.get_user_appointments(
        user_id=user_id,
        status=status,
        upcoming_only=upcoming
    )
    
    return jsonify({
        'appointments': appointments,
        'count': len(appointments)
    }), 200


@appointment_bp.route('', methods=['POST'])
@jwt_required()
def book_appointment():
    """
    Book a new appointment.
    
    Request Body:
        - doctor_id: ID of the doctor (required)
        - time_slot: ISO datetime string for the slot (required)
        - symptoms_summary: Brief description of symptoms (optional)
        - notes: Additional notes (optional)
        - priority: Priority level - normal/high/emergency (optional, default: normal)
    
    Returns:
        - 201: Appointment booked successfully
        - 400: Validation error or slot unavailable
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('doctor_id'):
        return jsonify({'error': 'doctor_id is required'}), 400
    if not data.get('time_slot'):
        return jsonify({'error': 'time_slot is required'}), 400
    
    result = appointment_service.book_appointment(
        user_id=user_id,
        doctor_id=data['doctor_id'],
        time_slot=data['time_slot'],
        symptoms_summary=data.get('symptoms_summary'),
        priority=data.get('priority', 'normal'),
        notes=data.get('notes')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@appointment_bp.route('/emergency', methods=['POST'])
@jwt_required()
def book_emergency():
    """
    Book an emergency priority appointment.
    Automatically finds the next available slot with a suitable doctor.
    
    Request Body:
        - specialization: Required medical specialty (optional, defaults to General Medicine)
        - symptoms_summary: Description of emergency symptoms (required)
    
    Returns:
        - 201: Emergency appointment booked
        - 400: No availability or validation error
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('symptoms_summary'):
        return jsonify({'error': 'symptoms_summary is required for emergency booking'}), 400
    
    result = appointment_service.book_emergency_appointment(
        user_id=user_id,
        specialization=data.get('specialization', 'General Medicine'),
        symptoms_summary=data['symptoms_summary']
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@appointment_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """
    Get details of a specific appointment.
    
    URL Parameters:
        - appointment_id: ID of the appointment
    
    Returns:
        - 200: Appointment details
        - 404: Appointment not found
    """
    user_id = get_jwt_identity()
    
    from app.models import Appointment
    appointment = Appointment.query.filter_by(
        id=appointment_id,
        user_id=user_id
    ).first()
    
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    return jsonify({'appointment': appointment.to_dict()}), 200


@appointment_bp.route('/<int:appointment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_appointment(appointment_id):
    """
    Cancel an appointment.
    
    URL Parameters:
        - appointment_id: ID of the appointment to cancel
    
    Returns:
        - 200: Appointment cancelled successfully
        - 400: Cannot cancel or appointment not found
    """
    user_id = get_jwt_identity()
    
    result = appointment_service.cancel_appointment(
        appointment_id=appointment_id,
        user_id=user_id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@appointment_bp.route('/<int:appointment_id>/status', methods=['PUT'])
@jwt_required()
def update_status(appointment_id):
    """
    Update appointment status.
    
    URL Parameters:
        - appointment_id: ID of the appointment
    
    Request Body:
        - status: New status (pending/confirmed/completed/cancelled)
    
    Returns:
        - 200: Status updated successfully
        - 400: Invalid status or update failed
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('status'):
        return jsonify({'error': 'status is required'}), 400
    
    result = appointment_service.update_appointment_status(
        appointment_id=appointment_id,
        status=data['status'],
        user_id=user_id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@appointment_bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """
    Get list of nearby hospitals for emergencies.
    
    Returns:
        - 200: List of nearby hospitals with contact info
    """
    hospitals = appointment_service.get_nearby_hospitals()
    
    return jsonify({
        'hospitals': hospitals,
        'emergency_number': '911'
    }), 200
