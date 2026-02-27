"""
Chat History Model.
Stores all conversation messages between patients and the system.
Includes symptom data, risk scores, and triage classifications.
"""
from datetime import datetime
from app import db


class ChatHistory(db.Model):
    """
    Chat history model for storing conversations.
    
    Attributes:
        id: Unique message identifier
        user_id: Foreign key to user
        message: Patient's message text
        response: System's response text
        message_type: Type of message (symptom/followup/advice/appointment)
        risk_score: Calculated risk score (0-10+)
        phase: Triage phase (query/appointment/emergency)
        extracted_data: JSON containing extracted symptom data
        session_id: Groups messages in a single conversation session
        created_at: Message timestamp
    """
    __tablename__ = 'chat_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(50), default='chat')
    risk_score = db.Column(db.Integer, default=0)
    phase = db.Column(db.String(20), default='query')  # query, appointment, emergency
    extracted_data = db.Column(db.JSON, default=dict)  # Stores symptom extraction results
    session_id = db.Column(db.String(50), index=True)  # Groups conversation sessions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert chat message to dictionary for API responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'response': self.response,
            'message_type': self.message_type,
            'risk_score': self.risk_score,
            'phase': self.phase,
            'extracted_data': self.extracted_data,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<ChatHistory {self.id} - User {self.user_id}>'
