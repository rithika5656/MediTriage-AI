"""
Chat Routes.
Handles conversational chat interface for symptom collection and triage.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.chat_service import ChatService
from app.services.appointment_service import AppointmentService

chat_bp = Blueprint('chat', __name__)

# Initialize services
chat_service = ChatService()
appointment_service = AppointmentService()


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Process a chat message from the user.
    Extracts symptoms, performs NLP analysis, and returns appropriate response.
    
    Request Body:
        - message: User's message text (required)
    
    Returns:
        - 200: Response with triage assessment if applicable
        - 400: Missing message
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Process message through chat service
    response = chat_service.process_message(user_id, message)
    
    # If emergency phase, include hospital information
    if response.get('phase') == 'emergency':
        response['hospitals'] = appointment_service.get_nearby_hospitals()
    
    # If appointment phase, include recommended doctors
    if response.get('phase') == 'appointment':
        specialists = response.get('recommended_specialists', ['General Medicine'])
        doctors = []
        for spec in specialists[:2]:  # Get doctors for top 2 specializations
            doctors.extend(appointment_service.get_doctors_by_specialization(spec))
        response['recommended_doctors'] = doctors[:5]  # Limit to 5 doctors
    
    return jsonify(response), 200


@chat_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """
    Get chat history for the current user.
    
    Query Parameters:
        - limit: Maximum number of messages to retrieve (default: 50)
    
    Returns:
        - 200: List of chat messages
    """
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    
    history = chat_service.get_chat_history(user_id, limit=limit)
    
    return jsonify({
        'history': history,
        'count': len(history)
    }), 200


@chat_bp.route('/session', methods=['GET'])
@jwt_required()
def get_session():
    """
    Get current conversation session context.
    
    Returns:
        - 200: Current session data including collected symptoms
    """
    user_id = get_jwt_identity()
    context = chat_service.get_session_context(user_id)
    
    return jsonify({
        'session': context,
        'has_active_session': bool(context)
    }), 200


@chat_bp.route('/session/reset', methods=['POST'])
@jwt_required()
def reset_session():
    """
    Reset the current conversation session.
    Clears collected symptoms and starts fresh.
    
    Returns:
        - 200: New session created
    """
    user_id = get_jwt_identity()
    new_session_id = chat_service.reset_session(user_id)
    
    return jsonify({
        'message': 'Session reset successfully',
        'session_id': new_session_id
    }), 200


@chat_bp.route('/quick-responses', methods=['GET'])
def get_quick_responses():
    """
    Get list of quick response options for the chat UI.
    These are common responses users can tap instead of typing.
    
    Returns:
        - 200: List of quick response options
    """
    quick_responses = [
        {
            'category': 'symptoms',
            'options': [
                'I have a headache',
                'I have fever',
                'I have a cough',
                'I have body aches',
                'I have stomach pain',
                'I feel nauseous'
            ]
        },
        {
            'category': 'severity',
            'options': [
                'Mild (1/5)',
                'Moderate (2/5)',
                'Noticeable (3/5)',
                'Severe (4/5)',
                'Very severe (5/5)'
            ]
        },
        {
            'category': 'duration',
            'options': [
                'Just started today',
                'For about 2-3 days',
                'For about a week',
                'More than a week'
            ]
        },
        {
            'category': 'temperature',
            'options': [
                'No fever',
                'Low fever (99-100°F)',
                'Moderate fever (100-102°F)',
                'High fever (above 102°F)'
            ]
        },
        {
            'category': 'actions',
            'options': [
                'Book an appointment',
                'Start over',
                'Talk to a doctor'
            ]
        }
    ]
    
    return jsonify({'quick_responses': quick_responses}), 200
