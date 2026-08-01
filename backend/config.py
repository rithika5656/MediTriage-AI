"""
Configuration settings for the Flask application.
Contains environment-specific configurations for development and production.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))


class Config:
    """Base configuration class with common settings."""
    
    # Secret key for JWT and session encryption
    SECRET_KEY = os.environ.get('SECRET_KEY', 'meditriage-secret-key-change-in-production')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Database Configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Settings
    CORS_HEADERS = 'Content-Type'


class DevelopmentConfig(Config):
    """Development environment configuration."""
    
    DEBUG = True
    # Using SQLite for development (easy setup)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///meditriage.db'
    )


class ProductionConfig(Config):
    """Production environment configuration."""
    
    DEBUG = False
    # Use Render-provided DATABASE_URL when available; otherwise fall back to SQLite.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///instance/meditriage.db'
    )


# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
