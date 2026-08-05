"""
Routes package initialization.
Exports all API route blueprints.
"""
from app.routes import agent_routes, auth_routes, chat_routes, appointment_routes, doctor_routes

__all__ = ['agent_routes', 'auth_routes', 'chat_routes', 'appointment_routes', 'doctor_routes']
