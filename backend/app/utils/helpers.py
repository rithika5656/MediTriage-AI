"""
Helper Utilities Module.
Common utility functions used across the application.
"""
from datetime import datetime, date


def format_datetime(dt, format_str='%B %d, %Y at %I:%M %p'):
    """
    Format a datetime object to a human-readable string.
    
    Args:
        dt: datetime object or ISO string
        format_str: strftime format string
    
    Returns:
        Formatted date string
    """
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    
    if isinstance(dt, datetime):
        return dt.strftime(format_str)
    
    return str(dt)


def calculate_age(birth_date):
    """
    Calculate age from birth date.
    
    Args:
        birth_date: date object or string (YYYY-MM-DD)
    
    Returns:
        Age in years
    """
    if isinstance(birth_date, str):
        birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
    
    today = date.today()
    age = today.year - birth_date.year
    
    # Adjust if birthday hasn't occurred this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    
    return age


def sanitize_input(text):
    """
    Sanitize user input by removing potentially harmful characters.
    
    Args:
        text: Input string
    
    Returns:
        Sanitized string
    """
    if not text:
        return ''
    
    # Remove null bytes and other control characters
    sanitized = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    
    return sanitized.strip()


def validate_email(email):
    """
    Basic email validation.
    
    Args:
        email: Email string
    
    Returns:
        Boolean indicating if email is valid
    """
    if not email:
        return False
    
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone):
    """
    Basic phone number validation.
    
    Args:
        phone: Phone number string
    
    Returns:
        Boolean indicating if phone is valid
    """
    if not phone:
        return False
    
    # Remove common formatting characters
    cleaned = ''.join(char for char in phone if char.isdigit())
    
    # Check length (7-15 digits is typical range)
    return 7 <= len(cleaned) <= 15
