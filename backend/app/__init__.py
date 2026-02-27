"""
Flask Application Factory Module.
Initializes the Flask app with all extensions, blueprints, and configurations.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import config

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
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints (API routes)
    from app.routes import auth_routes, chat_routes, appointment_routes, doctor_routes
    
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
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'MediTriage API is running'}
    
    return app
