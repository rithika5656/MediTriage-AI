"""
Application Entry Point.
Runs the Flask development server.
"""
import os
from app import create_app

# Get environment (default to development)
env = os.environ.get('FLASK_ENV', 'development')

# Create the application
app = create_app(env)

if __name__ == '__main__':
    # Run the development server
    print("=" * 50)
    print("  MediTriage AI - Backend API Server")
    print("=" * 50)
    print(f"  Environment: {env}")
    print(f"  API Base URL: http://localhost:5000/api")
    print("=" * 50)
    print("\nAvailable Endpoints:")
    print("  POST /api/auth/signup     - Register new user")
    print("  POST /api/auth/login      - User login")
    print("  GET  /api/auth/profile    - Get user profile")
    print("  POST /api/chat/message    - Send chat message")
    print("  GET  /api/chat/history    - Get chat history")
    print("  GET  /api/doctors         - List doctors")
    print("  GET  /api/doctors/<id>/slots - Get available slots")
    print("  POST /api/appointments    - Book appointment")
    print("  GET  /api/appointments    - Get user appointments")
    print("  GET  /api/health          - Health check")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
