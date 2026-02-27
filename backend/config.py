"""
Configuration settings for the Flask application.
Contains environment-specific configurations for development and production.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


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
    # PostgreSQL for production
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://user:password@localhost/meditriage'
    )


# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
