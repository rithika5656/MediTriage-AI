"""
translator_service.py
Handles translation between Tamil, Tanglish, and English using googletrans or deep-translator.
"""
from deep_translator import GoogleTranslator

TANGLISH_TO_TAMIL = {
    "kaichal": "காய்ச்சல்",
    "vali": "வலி",
    "thala": "தலை",
    "iruku": "இருக்கு",
    "suvasa": "சுவாச",
    "prachanai": "பிரச்சனை",
    "kai kaal vali": "கை கால வலி",
    # Add more mappings as needed
}

TANGLISH_TO_ENGLISH = {
    # Fever & General
    "kaichal": "fever",
    "jwara": "fever",
    "body heat": "high temperature",
    "suda iruku": "fever",
    "kuliru": "chills",
    "chills varudhu": "chills",
    "body pain": "body pain",
    "sogam": "fatigue",
    "tired ah iruken": "fatigue",
    "weak ah iruku": "weakness",

    # Head Related
    "thala vali": "headache",
    "thalai suthudhu": "dizziness",
    "mayakkam": "dizziness",
    "kan vali": "eye pain",
    "kan suthudhu": "blurred vision",

    # Respiratory
    "irumal": "cough",
    "dry cough": "dry cough",
    "mucus": "phlegm",
    "suvasa prachanai": "breathing difficulty",
    "suvasa kashtam": "shortness of breath",
    "moochu vidra kashtam": "breathing problem",
    "nenju vali": "chest pain",
    "wheezing": "wheezing",

    # Stomach / Digestive
    "vayiru vali": "stomach pain",
    "vayiru erichal": "acidity",
    "vomiting ah iruku": "vomiting",
    "vomit panren": "vomiting",
    "loose motion": "diarrhea",
    "motion problem": "constipation",
    "pasikudhu illa": "loss of appetite",

    # Heart / Emergency
    "heart vali": "chest pain",
    "left side vali": "left chest pain",
    "sudden nenju vali": "sudden chest pain",
    "sudden mayakkam": "fainting",
    "unarvu illa": "unconscious",
    "kangal iruttu": "blackout",
    "high bp": "high blood pressure",
    "low bp": "low blood pressure",

    # Diabetes Related
    "sugar iruku": "diabetes",
    "sugar level high": "high blood sugar",
    "sugar level kammi": "low blood sugar",

    # Skin
    "skin allergy": "skin allergy",
    "itching ah iruku": "itching",
    "sivappu patch": "red rash",
    "rashes": "skin rash",

    # Joint / Ortho
    "kai kaal vali": "joint pain",
    "muttu vali": "knee pain",
    "back vali": "back pain",
    "iduppu vali": "hip pain",

    # Mental Health
    "stress ah iruku": "stress",
    "anxiety ah iruku": "anxiety",
    "thookam varala": "insomnia",
    "depressed ah feel panren": "depression",

    # Duration Related
    "rendu naal": "2 days",
    "moonu naal": "3 days",
    "oru vaaram": "1 week",
    "naala naal": "4 days",

    # Severity Expressions
    "romba severe": "very severe",
    "light ah iruku": "mild",
    "konjam": "mild",
    "romba kashtam": "severe pain"
}

def tanglish_to_english(text):
    for tanglish, english in TANGLISH_TO_ENGLISH.items():
        if tanglish in text.lower():
            return english
    return text

def tanglish_to_tamil(text):
    """
    Converts common Tanglish words to Tamil script.
    """
    for tanglish, tamil in TANGLISH_TO_TAMIL.items():
        text = text.replace(tanglish, tamil)
    return text

def translate_to_english(text, src_lang):
    """
    Translates text from src_lang (ta or auto) to English.
    Handles Tanglish by converting to Tamil and mapping to English.
    """
    if src_lang == 'tanglish':
        # Try direct mapping first
        mapped = tanglish_to_english(text)
        if mapped != text:
            return mapped
        # Otherwise, convert to Tamil and translate
        text = tanglish_to_tamil(text)
        src_lang = 'ta'
    return GoogleTranslator(source=src_lang, target='en').translate(text)

def translate_to_original(text, target_lang, original_input=None):
    """
    Translates English text back to the user's original language.
    For Tanglish, returns both mapped Tanglish and English.
    """
    if target_lang == 'tanglish':
        # For Tanglish, reply with both mapped Tanglish and English
        tanglish_reply = original_input if original_input else text
        english_reply = text
        return f"Tanglish: {tanglish_reply}\nEnglish: {english_reply}"
    elif target_lang == 'ta':
        return GoogleTranslator(source='en', target='ta').translate(text)
    else:
        return text  # English, no translation needed
