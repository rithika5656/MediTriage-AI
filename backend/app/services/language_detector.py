"""
language_detector.py
Detects whether input text is English, Tamil, or Tanglish (Tamil in Latin script).
Uses langdetect for language detection and custom logic for Tanglish.
"""
from langdetect import detect
import re

# Common Tanglish patterns (expand as needed)
TANGLISH_PATTERNS = [
    r"kaichal", r"vali", r"iruku", r"suvasa", r"prachanai", r"thala", r"kali", r"thookam", r"kudikkiren"
]

def detect_language(text):
    """
    Detects the language of the input text.
    Returns:
        'en' for English
        'ta' for Tamil
        'tanglish' for Tamil written in Latin script
    """
    try:
        # Try langdetect first
        lang = detect(text)
        if lang == 'ta':
            return 'ta'
        elif lang == 'en':
            # Check for Tanglish patterns in English-detected text
            text_lower = text.lower()
            for pattern in TANGLISH_PATTERNS:
                if re.search(pattern, text_lower):
                    return 'tanglish'
            return 'en'
        else:
            # Fallback: check for Tanglish patterns
            text_lower = text.lower()
            for pattern in TANGLISH_PATTERNS:
                if re.search(pattern, text_lower):
                    return 'tanglish'
            return lang
    except Exception as e:
        # Fallback: check for Tanglish patterns
        text_lower = text.lower()
        for pattern in TANGLISH_PATTERNS:
            if re.search(pattern, text_lower):
                return 'tanglish'
        return 'en'  # Default to English
