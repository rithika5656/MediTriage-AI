"""
Authentication Routes.
Handles user registration, login, and profile management.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user account.
    
    Request Body:
        - name: Full name (required)
        - email: Email address (required, unique)
        - password: Password (required, min 6 chars)
        - age: Age in years (required)
        - gender: Gender (required)
        - phone: Phone number (required)
    
    Returns:
        - 201: User created successfully with access token
        - 400: Validation error or email already exists
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'age', 'gender', 'phone']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format (basic check)
    email = data['email'].lower().strip()
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Validate age
    try:
        age = int(data['age'])
        if age < 1 or age > 120:
            return jsonify({'error': 'Please enter a valid age'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Age must be a number'}), 400
    
    # Create new user
    user = User(
        name=data['name'].strip(),
        email=email,
        age=age,
        gender=data['gender'].lower().strip(),
        phone=data['phone'].strip()
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return access token.
    
    Request Body:
        - email: Email address (required)
        - password: Password (required)
    
    Returns:
        - 200: Login successful with access token
        - 401: Invalid credentials
    """
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    email = data['email'].lower().strip()
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate access token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user's profile.
    Requires valid JWT token.
    
    Returns:
        - 200: User profile data
        - 404: User not found
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update current user's profile.
    Requires valid JWT token.
    
    Request Body (all optional):
        - name: Updated name
        - age: Updated age
        - gender: Updated gender
        - phone: Updated phone
    
    Returns:
        - 200: Profile updated successfully
        - 404: User not found
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if data.get('name'):
        user.name = data['name'].strip()
    if data.get('age'):
        try:
            user.age = int(data['age'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Age must be a number'}), 400
    if data.get('gender'):
        user.gender = data['gender'].lower().strip()
    if data.get('phone'):
        user.phone = data['phone'].strip()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user's password.
    Requires valid JWT token.
    
    Request Body:
        - current_password: Current password (required)
        - new_password: New password (required, min 6 chars)
    
    Returns:
        - 200: Password changed successfully
        - 400: Validation error
        - 401: Current password incorrect
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200
