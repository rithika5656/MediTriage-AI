"""
Chat Routes.
Handles conversational chat interface for symptom collection and triage.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.chat_service import ChatService
from app.services.appointment_service import AppointmentService
from app.services.llama_service import extract_medical_data

chat_bp = Blueprint('chat', __name__)


import os
chat_service = ChatService()
appointment_service = AppointmentService()
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'llama')


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Chat endpoint for medical triage using OpenAI.
    Accepts multilingual user input, extracts structured medical data, and replies in same language.
    Returns formatted response for frontend.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    user_input = data.get('message', '').strip()
    if not user_input:
        return jsonify({'error': 'Message is required'}), 400

    try:
        if LLM_PROVIDER in ['openai', 'groq', 'llama']:
            # Fetch recent history for context
            history = chat_service.get_chat_history(user_id, limit=5)
            # Standardize history for LLM (role, content)
            chat_history_list = []
            for h in history:
                chat_history_list.append({'role': 'user', 'content': h.get('message', '')})
                chat_history_list.append({'role': 'assistant', 'content': h.get('response', '')})

            result = extract_medical_data(user_input, chat_history_list)
            
            phase = 'collecting'
            severity = result.get('severity')
            if severity is None:
                try:
                    severity = int(severity) if severity else 0
                except (ValueError, TypeError):
                    severity = 0
            elif isinstance(severity, str) and severity.isdigit():
                severity = int(severity)
            
            if result.get('emergency_flag'):
                phase = 'emergency'
            elif severity and severity > 3:
                phase = 'appointment'
            elif result.get('symptoms'):
                phase = 'query'

            response = {
                'message': result.get('reply_message', 'Could you provide more details about how you are feeling?'),
                'phase': phase,
                'triage': {
                    'risk_score': severity or 0,
                    'detected_symptoms': result.get('symptoms', [])
                }
            }
        else:
            response = chat_service.process_message(user_id, user_input)
            phase = response.get('phase', 'collecting')

        if phase == 'appointment':
            doctors = []
            # Get some default specialists if none determined
            specialists = ['General Physician', 'Neurologist', 'Cardiologist']
            for spec in specialists[:2]:
                docs = appointment_service.get_doctors_by_specialization(spec)
                docs = [d.to_dict() if hasattr(d, 'to_dict') else d for d in docs]
                doctors.extend(docs)
            response['recommended_doctors'] = doctors[:5]
            
        elif phase == 'emergency':
            response['hospitals'] = [
                {'name': 'City General Hospital', 'distance': '2.5 km', 'wait_time': '5 mins', 'phone': '911'},
                {'name': 'St. Mary Emergency Center', 'distance': '3.2 km', 'wait_time': '12 mins', 'phone': '911'}
            ]

        return jsonify(response), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to process medical triage',
            'details': str(e)
        }), 500


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
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
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
