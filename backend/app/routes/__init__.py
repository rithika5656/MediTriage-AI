"""
Routes package initialization.
Exports all API route blueprints.
"""
from app.routes import auth_routes, chat_routes, appointment_routes, doctor_routes

__all__ = ['auth_routes', 'chat_routes', 'appointment_routes', 'doctor_routes']
