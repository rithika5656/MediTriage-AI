"""
Chat Service Module.
Manages the conversational flow between patients and the system.
Integrates NLP processing, triage logic, and response generation.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

from app import db
from app.models import ChatHistory, User
from app.services.nlp_processor import NLPProcessor
from app.services.triage_logic import TriageEngine


class ChatService:
    """
    Service class for managing chat conversations.
    
    Responsibilities:
        - Process incoming messages
        - Maintain conversation context
        - Generate appropriate responses
        - Trigger triage assessment
        - Store chat history
    """
    
    # Conversation states
    STATE_INITIAL = 'initial'
    STATE_COLLECTING = 'collecting'
    STATE_ASSESSING = 'assessing'
    STATE_COMPLETE = 'complete'
    
    # Response templates
    RESPONSES = {
        'greeting': [
            "Hello! I'm your virtual health assistant. How can I help you today?",
            "Hi there! Please describe your symptoms and I'll help assess your condition.",
            "Welcome! I'm here to help understand your health concerns. What brings you in today?",
        ],
        'symptom_acknowledged': [
            "I understand you're experiencing {symptoms}. Let me ask a few more questions to better assess your condition.",
            "Thank you for sharing. I've noted that you have {symptoms}. I need some additional information.",
        ],
        'ask_temperature': [
            "Do you have a fever? If yes, what is your current body temperature?",
            "Have you measured your temperature? Please share if you have.",
        ],
        'ask_duration': [
            "How long have you been experiencing these symptoms?",
            "When did these symptoms start?",
        ],
        'ask_severity': [
            "On a scale of 1 to 5 (1 being mild, 5 being severe), how would you rate your discomfort?",
            "How severe are your symptoms? Please rate from 1 (mild) to 5 (severe).",
        ],
        'ask_conditions': [
            "Do you have any existing medical conditions? (e.g., diabetes, heart disease, asthma)",
            "Are there any pre-existing health conditions I should know about?",
        ],
        'need_more_info': [
            "Could you tell me more about your symptoms?",
            "I need a bit more information. What symptoms are you experiencing?",
        ],
        'query_phase': [
            "Based on your symptoms, your condition appears to be mild. Here's my advice:\n\n"
            "• Get plenty of rest\n"
            "• Stay well hydrated\n"
            "• Take over-the-counter medication if needed\n"
            "• Monitor your symptoms\n\n"
            "If your symptoms worsen, please consider booking an appointment.",
        ],
        'appointment_phase': [
            "Based on your symptoms, I recommend scheduling an appointment with a doctor.\n\n"
            "Your symptoms suggest you should see a specialist in: {specialists}\n\n"
            "Would you like me to help you book an appointment?",
        ],
        'emergency_phase': [
            "🚨 **URGENT MEDICAL ATTENTION REQUIRED**\n\n"
            "Based on your symptoms, you need immediate medical care.\n\n"
            "**Please take the following actions:**\n"
            "• Call emergency services (911) if symptoms are severe\n"
            "• Go to the nearest emergency room\n"
            "• Do not drive yourself\n\n"
            "Would you like information about nearby emergency facilities?",
        ],
        'farewell': [
            "Take care! Feel free to return if you have more questions.",
            "I hope you feel better soon. Don't hesitate to reach out if you need help.",
        ],
    }
    
    # Conversation context storage (in production, use Redis or database)
    _conversation_contexts: Dict[int, Dict] = {}
    
    def __init__(self):
        """Initialize chat service with NLP processor and triage engine."""
        self.nlp = NLPProcessor()
        self.triage = TriageEngine()
    
    def get_or_create_session(self, user_id: int) -> str:
        """
        Get existing session or create new one for user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Session identifier
        """
        if user_id not in self._conversation_contexts:
            session_id = str(uuid.uuid4())
            self._conversation_contexts[user_id] = {
                'session_id': session_id,
                'state': self.STATE_INITIAL,
                'collected_data': {},
                'messages': [],
                'created_at': datetime.utcnow().isoformat(),
            }
        return self._conversation_contexts[user_id]['session_id']
    
    def reset_session(self, user_id: int) -> str:
        """
        Reset conversation session for user.
        
        Args:
            user_id: User identifier
        
        Returns:
            New session identifier
        """
        if user_id in self._conversation_contexts:
            del self._conversation_contexts[user_id]
        return self.get_or_create_session(user_id)
    
    def process_message(self, user_id: int, message: str) -> Dict[str, Any]:
        """
        Process incoming user message and generate response.
        
        Args:
            user_id: User identifier
            message: User's message text
        
        Returns:
            Response dictionary with message, phase, and metadata
        """
        # Get or create session
        session_id = self.get_or_create_session(user_id)
        context = self._conversation_contexts[user_id]
        
        # Process message through NLP
        nlp_result = self.nlp.process_message(
            message, 
            context.get('collected_data', {})
        )
        
        extracted_data = nlp_result['extracted_data']
        intent = nlp_result['intent']
        missing_fields = nlp_result['missing_fields']
        
        # Update context with new data
        self._update_context(user_id, extracted_data)
        
        # Generate response based on intent and state
        response = self._generate_response(
            user_id, intent, extracted_data, missing_fields, message
        )
        
        # Store in chat history (non-critical - don't let DB errors break chat)
        try:
            self._save_chat_history(user_id, session_id, message, response)
        except Exception as e:
            print(f"[WARNING] Failed to save chat history: {e}")
        
        return response
    
    def _update_context(self, user_id: int, extracted_data: Dict):
        """
        Update conversation context with new extracted data.
        
        Args:
            user_id: User identifier
            extracted_data: Newly extracted data
        """
        context = self._conversation_contexts[user_id]
        collected = context.get('collected_data', {})
        
        # Merge symptoms
        existing_symptoms = collected.get('symptoms', [])
        new_symptoms = extracted_data.get('symptoms', [])
        collected['symptoms'] = list(set(existing_symptoms + new_symptoms))
        
        # Update other fields if provided
        if extracted_data.get('temperature'):
            collected['temperature'] = extracted_data['temperature']
        if extracted_data.get('duration_days'):
            collected['duration_days'] = extracted_data['duration_days']
        if extracted_data.get('severity'):
            collected['severity'] = extracted_data['severity']
        
        # Merge conditions
        existing_conditions = collected.get('existing_conditions', [])
        new_conditions = extracted_data.get('existing_conditions', [])
        collected['existing_conditions'] = list(set(existing_conditions + new_conditions))
        
        context['collected_data'] = collected
        
        # Update state based on collected data completeness
        if collected.get('symptoms'):
            context['state'] = self.STATE_COLLECTING
    
    def _generate_response(
        self, 
        user_id: int, 
        intent: str, 
        extracted_data: Dict,
        missing_fields: List[str],
        original_message: str
    ) -> Dict[str, Any]:
        """
        Generate appropriate response based on current state and data.
        
        Args:
            user_id: User identifier
            intent: Classified intent
            extracted_data: Extracted symptom data
            missing_fields: Fields that still need data
            original_message: Original user message
        
        Returns:
            Response dictionary
        """
        context = self._conversation_contexts[user_id]
        collected_data = context.get('collected_data', {})
        
        # Handle specific intents
        if intent == 'greeting' and not collected_data.get('symptoms'):
            return self._create_response(
                self.RESPONSES['greeting'][0],
                phase='greeting',
                action='await_symptoms'
            )
        
        if intent == 'farewell':
            return self._create_response(
                self.RESPONSES['farewell'][0],
                phase='farewell',
                action='end_conversation'
            )
        
        # Check if we have symptoms
        symptoms = collected_data.get('symptoms', [])
        
        if not symptoms:
            return self._create_response(
                self.RESPONSES['need_more_info'][0],
                phase='collecting',
                action='await_symptoms'
            )
        
        # Check for emergency keywords first
        if self.triage.check_emergency_keywords(original_message):
            triage_result = self.triage.get_triage_summary(collected_data, original_message)
            context['state'] = self.STATE_COMPLETE
            
            return self._create_response(
                self.RESPONSES['emergency_phase'][0],
                phase='emergency',
                action='emergency_alert',
                triage_data=triage_result
            )
        
        # If we have key missing fields, ask follow-up questions
        if 'severity' in missing_fields and len(symptoms) >= 1:
            return self._create_response(
                self._format_symptom_acknowledgment(symptoms) + "\n\n" + 
                self.RESPONSES['ask_severity'][0],
                phase='collecting',
                action='await_severity'
            )
        
        if 'duration' in missing_fields and collected_data.get('severity'):
            return self._create_response(
                self.RESPONSES['ask_duration'][0],
                phase='collecting',
                action='await_duration'
            )
        
        if 'temperature' in missing_fields and collected_data.get('duration_days'):
            return self._create_response(
                self.RESPONSES['ask_temperature'][0],
                phase='collecting',
                action='await_temperature'
            )
        
        # If we have enough data, perform triage assessment
        if symptoms and (collected_data.get('severity') or collected_data.get('duration_days')):
            return self._perform_triage_assessment(user_id, collected_data, original_message)
        
        # Default: acknowledge symptoms and ask for more info
        return self._create_response(
            self._format_symptom_acknowledgment(symptoms) + "\n\n" +
            self.RESPONSES['ask_severity'][0],
            phase='collecting',
            action='await_more_info'
        )
    
    def _perform_triage_assessment(
        self, 
        user_id: int, 
        collected_data: Dict,
        original_message: str
    ) -> Dict[str, Any]:
        """
        Perform triage assessment and generate final recommendation.
        
        Args:
            user_id: User identifier
            collected_data: All collected symptom data
            original_message: Original message for keyword checking
        
        Returns:
            Triage response dictionary
        """
        context = self._conversation_contexts[user_id]
        triage_result = self.triage.get_triage_summary(collected_data, original_message)
        
        phase = triage_result['phase']
        context['state'] = self.STATE_COMPLETE
        
        if phase == 'query':
            response_text = self.RESPONSES['query_phase'][0]
            response_text += f"\n\n**Risk Score:** {triage_result['risk_score']}/10"
            
            return self._create_response(
                response_text,
                phase='query',
                action='provide_advice',
                triage_data=triage_result
            )
        
        elif phase == 'appointment':
            specialists = ', '.join(triage_result['recommended_specialists'])
            response_text = self.RESPONSES['appointment_phase'][0].format(
                specialists=specialists
            )
            response_text += f"\n\n**Risk Score:** {triage_result['risk_score']}/10"
            
            return self._create_response(
                response_text,
                phase='appointment',
                action='suggest_appointment',
                triage_data=triage_result,
                recommended_specialists=triage_result['recommended_specialists']
            )
        
        else:  # emergency
            return self._create_response(
                self.RESPONSES['emergency_phase'][0],
                phase='emergency',
                action='emergency_alert',
                triage_data=triage_result
            )
    
    def _format_symptom_acknowledgment(self, symptoms: List[str]) -> str:
        """Format symptom acknowledgment message."""
        if len(symptoms) == 1:
            return f"I understand you're experiencing **{symptoms[0]}**."
        elif len(symptoms) == 2:
            return f"I understand you're experiencing **{symptoms[0]}** and **{symptoms[1]}**."
        else:
            symptom_list = ', '.join(symptoms[:-1]) + f', and {symptoms[-1]}'
            return f"I understand you're experiencing **{symptom_list}**."
    
    def _create_response(
        self,
        message: str,
        phase: str,
        action: str,
        triage_data: Dict = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create standardized response dictionary.
        
        Args:
            message: Response message text
            phase: Current conversation phase
            action: Suggested next action
            triage_data: Triage assessment results
            **kwargs: Additional response metadata
        
        Returns:
            Response dictionary
        """
        response = {
            'message': message,
            'phase': phase,
            'action': action,
            'timestamp': datetime.utcnow().isoformat(),
        }
        
        if triage_data:
            response['triage'] = {
                'risk_score': triage_data.get('risk_score', 0),
                'phase': triage_data.get('phase', 'query'),
                'priority': triage_data.get('priority', 'low'),
                'recommendations': triage_data.get('recommendations', []),
                'detected_symptoms': triage_data.get('detected_symptoms', []),
                'recommended_specialists': triage_data.get('recommended_specialists', []),
            }
        
        response.update(kwargs)
        return response
    
    def _save_chat_history(
        self,
        user_id: int,
        session_id: str,
        message: str,
        response: Dict
    ) -> ChatHistory:
        """
        Save chat message and response to database.
        
        Args:
            user_id: User identifier
            session_id: Conversation session identifier
            message: User's message
            response: System response
        
        Returns:
            Created ChatHistory record
        """
        context = self._conversation_contexts.get(user_id, {})
        collected_data = context.get('collected_data', {})
        
        # Sanitise: convert sets to lists for JSON serialisation
        safe_data = {
            k: list(v) if isinstance(v, set) else v
            for k, v in collected_data.items()
        }
        
        triage_data = response.get('triage', {})
        
        chat_record = ChatHistory(
            user_id=user_id,
            message=message,
            response=response['message'],
            message_type=response.get('action', 'chat'),
            risk_score=int(triage_data.get('risk_score', 0)),
            phase=response.get('phase', 'query'),
            extracted_data=safe_data,
            session_id=session_id
        )
        
        try:
            db.session.add(chat_record)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[WARNING] DB commit failed: {e}")
        
        return chat_record
    
    def get_chat_history(self, user_id: int, limit: int = 50) -> List[Dict]:
        """
        Retrieve chat history for a user.
        
        Args:
            user_id: User identifier
            limit: Maximum number of messages to retrieve
        
        Returns:
            List of chat history dictionaries
        """
        history = ChatHistory.query.filter_by(user_id=user_id)\
            .order_by(ChatHistory.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [chat.to_dict() for chat in reversed(history)]
    
    def get_session_context(self, user_id: int) -> Dict:
        """
        Get current session context for user.
        
        Args:
            user_id: User identifier
        
        Returns:
            Session context dictionary
        """
        return self._conversation_contexts.get(user_id, {})
