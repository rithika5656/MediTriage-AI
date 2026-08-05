"""
Flask Application Factory Module.
Initializes the Flask app with all extensions, blueprints, and configurations.
"""
import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import config
from database import UPLOAD_DIR, ensure_storage_paths

# Initialize extensions (without app binding)
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app(config_name='default'):
    """
    Application factory function.
    Creates and configures the Flask application.
    
    Args:
        config_name: Configuration environment ('development', 'production', 'default')
    
    Returns:
        Configured Flask application instance
    """
    if config_name == 'default':
        config_name = os.environ.get('FLASK_ENV', 'production')

    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    app.config.setdefault('MAX_CONTENT_LENGTH', 25 * 1024 * 1024)
    app.config.setdefault('UPLOAD_FOLDER', str(UPLOAD_DIR))
    ensure_storage_paths()
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Enable CORS for frontend communication
    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "https://medi-triage-ai-three.vercel.app",
                "https://www.medi-triage-ai-three.vercel.app"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }},
        supports_credentials=True
    )
    
    # Register blueprints (API routes)
    from app.routes import agent_routes, auth_routes, chat_routes, appointment_routes, doctor_routes
    
    app.register_blueprint(agent_routes.agent_bp, url_prefix='/api')
    app.register_blueprint(auth_routes.auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_routes.chat_bp, url_prefix='/api/chat')
    app.register_blueprint(appointment_routes.appointment_bp, url_prefix='/api/appointments')
    app.register_blueprint(doctor_routes.doctor_bp, url_prefix='/api/doctors')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        # Seed initial doctor data
        from app.services.seed_service import seed_doctors
        seed_doctors()

    @app.route('/')
    def index():
        return {'status': 'healthy', 'service': 'MediTriage API'}

    @app.route('/api')
    @app.route('/api/')
    def api_root():
        return {'status': 'healthy', 'service': 'MediTriage API'}

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'MediTriage API is running'}

    @app.route('/api/analyze-face/', methods=['POST'])
    def analyze_face():
        return jsonify({
            'success': False,
            'error': 'Face severity analysis is not configured for this deployment.'
        }), 501

    @app.route('/api/emergency-direct-request/', methods=['POST'])
    def emergency_direct_request():
        data = request.get_json(silent=True) or {}
        phone_number = data.get('phone_number', '')
        location = data.get('location', {})
        return jsonify({
            'success': True,
            'message': 'Emergency dispatch request received.',
            'phone_number': phone_number,
            'location': location,
            'dispatch_id': 'demo-dispatch'
        }), 200
    
    return app
