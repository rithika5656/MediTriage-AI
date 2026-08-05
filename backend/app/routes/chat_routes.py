"""
Chat Routes.
Handles conversational chat interface for symptom collection and triage.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.agent_service import agent_service
from app.services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__)


chat_service = ChatService()


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Chat endpoint powered by the planner agent workflow."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    user_input = data.get('message', '').strip()
    if not user_input:
        return jsonify({'error': 'Message is required'}), 400

    try:
        response = agent_service.process_chat(int(user_id), user_input)
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
    return jsonify(agent_service.get_history(user_id, limit=limit)), 200


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
