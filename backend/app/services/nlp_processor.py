"""
NLP Processor Module.
Handles natural language processing for symptom extraction and intent classification.
Converts unstructured patient text into structured medical data.
"""
import re
from typing import Dict, List, Any, Optional


class NLPProcessor:
    """
    Natural Language Processing engine for medical symptom extraction.
    
    Extracts:
        - Symptoms from natural language descriptions
        - Temperature values
        - Duration of symptoms
        - Severity levels
        - Existing medical conditions
    
    Also handles:
        - Intent classification (symptom_report, question, greeting, etc.)
        - Follow-up question generation
        - Entity normalization
    """
    
    # Common symptom patterns for extraction
    SYMPTOM_PATTERNS = [
        # Pain-related
        r'(?:have|having|feel|feeling|experiencing?)\s+(?:a\s+)?(?:severe\s+|mild\s+|sharp\s+|dull\s+)?(\w+\s+pain)',
        r'(?:my\s+)?(\w+)\s+(?:is\s+)?(?:hurts?|hurting|aching|painful)',
        r'pain\s+in\s+(?:my\s+)?(\w+)',
        
        # General symptoms
        r'(?:have|having|got)\s+(?:a\s+)?(\w+)',
        r'(?:feel|feeling)\s+(\w+)',
        r"(?:i'?m|i\s+am)\s+(?:feeling\s+)?(\w+)",
        
        # Specific conditions
        r'(\w+\s+throat)',
        r'(runny\s+nose)',
        r'(shortness\s+of\s+breath)',
        r'(difficulty\s+breathing)',
        r'(chest\s+pain)',
        r'(high\s+fever)',
        r'(body\s+aches?)',
        r'(loss\s+of\s+(?:taste|smell|appetite))',
    ]
    
    # Known symptoms dictionary with variations
    KNOWN_SYMPTOMS = {
        'headache': ['headache', 'head ache', 'head pain', 'head hurts'],
        'fever': ['fever', 'febrile', 'high temperature', 'feverish'],
        'cough': ['cough', 'coughing', 'dry cough', 'wet cough'],
        'cold': ['cold', 'common cold', 'caught cold'],
        'sore throat': ['sore throat', 'throat pain', 'throat hurts'],
        'runny nose': ['runny nose', 'nasal congestion', 'stuffy nose', 'blocked nose'],
        'body ache': ['body ache', 'body pain', 'muscle pain', 'aching'],
        'fatigue': ['fatigue', 'tired', 'exhausted', 'weakness', 'weak'],
        'nausea': ['nausea', 'nauseous', 'feel sick', 'queasy'],
        'vomiting': ['vomiting', 'vomit', 'throwing up', 'puking'],
        'diarrhea': ['diarrhea', 'loose motion', 'loose stool'],
        'chest pain': ['chest pain', 'chest hurts', 'chest tightness'],
        'breathing difficulty': ['breathing difficulty', 'shortness of breath', 
                                  'difficulty breathing', "can't breathe", 'breathless'],
        'dizziness': ['dizzy', 'dizziness', 'lightheaded', 'vertigo'],
        'rash': ['rash', 'skin rash', 'hives', 'skin irritation'],
        'back pain': ['back pain', 'backache', 'back hurts'],
        'abdominal pain': ['stomach pain', 'abdominal pain', 'tummy ache', 'belly pain'],
        'loss of appetite': ['loss of appetite', 'not hungry', "can't eat"],
        'insomnia': ['insomnia', "can't sleep", 'sleep problems', 'sleepless'],
        'anxiety': ['anxiety', 'anxious', 'worried', 'panic'],
        'joint pain': ['joint pain', 'arthritis', 'joints hurt'],
    }
    
    # Temperature extraction patterns
    TEMPERATURE_PATTERNS = [
        r'(\d{2,3}(?:\.\d)?)\s*°?\s*(?:f|fahrenheit)',
        r'(\d{2,3}(?:\.\d)?)\s*°?\s*(?:c|celsius)',
        r'temperature\s+(?:is\s+)?(\d{2,3}(?:\.\d)?)',
        r'fever\s+(?:of\s+)?(\d{2,3}(?:\.\d)?)',
        r'(\d{2,3}(?:\.\d)?)\s*degrees?',
    ]
    
    # Duration extraction patterns
    DURATION_PATTERNS = [
        r'(?:for|since|past|last)\s+(\d+)\s+(day|days|week|weeks|hour|hours|month|months)',
        r'(\d+)\s+(day|days|week|weeks|hour|hours|month|months)\s+(?:now|ago)',
        r'started\s+(\d+)\s+(day|days|week|weeks|hour|hours)\s+ago',
        r'been\s+(\d+)\s+(day|days|week|weeks)',
    ]
    
    # Severity indicators
    SEVERITY_KEYWORDS = {
        1: ['mild', 'slight', 'little', 'minor', 'barely'],
        2: ['moderate', 'somewhat', 'fairly'],
        3: ['noticeable', 'considerable', 'significant'],
        4: ['severe', 'strong', 'intense', 'bad', 'really bad'],
        5: ['extreme', 'unbearable', 'worst', 'excruciating', 'terrible', 'very severe'],
    }
    
    # Existing conditions patterns
    CONDITION_PATTERNS = [
        r'(?:have|has|diagnosed with|suffering from)\s+(diabetes|hypertension|asthma|heart disease|cancer)',
        r'(?:diabetic|hypertensive|asthmatic)',
        r'history\s+of\s+(\w+)',
    ]
    
    # Intent patterns
    INTENT_PATTERNS = {
        'greeting': [r'^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening))', r'^how\s+are\s+you'],
        'symptom_report': [r'(?:have|having|feel|feeling|experiencing)', r'pain', r'hurts?', r'ache'],
        'question': [r'^(?:what|how|why|when|where|can|should|is|are|do|does)', r'\?$'],
        'appointment': [r'(?:book|schedule|make|want)\s+(?:an?\s+)?appointment', r'see\s+(?:a\s+)?doctor'],
        'emergency': [r'emergency', r'urgent', r'immediately', r'help\s+me'],
        'farewell': [r'^(?:bye|goodbye|thank|thanks)', r'see\s+you'],
    }
    
    # Follow-up questions for data collection
    FOLLOW_UP_QUESTIONS = {
        'temperature': "What is your current body temperature? (e.g., 101°F)",
        'duration': "How long have you been experiencing these symptoms?",
        'severity': "On a scale of 1-5, how severe is your discomfort? (1=mild, 5=severe)",
        'existing_conditions': "Do you have any existing medical conditions? (e.g., diabetes, heart disease, asthma)",
        'additional_symptoms': "Are you experiencing any other symptoms?",
        'medications': "Are you currently taking any medications?",
        'allergies': "Do you have any known allergies?",
    }
    
    def __init__(self):
        """Initialize the NLP processor."""
        self.conversation_context = {}
    
    def extract_symptoms(self, text: str) -> List[str]:
        """
        Extract symptoms from natural language text.
        
        Args:
            text: User's message describing their condition
        
        Returns:
            List of identified symptoms
        """
        symptoms = set()
        text_lower = text.lower()
        
        # Check against known symptoms dictionary
        for symptom, variations in self.KNOWN_SYMPTOMS.items():
            for variation in variations:
                if variation in text_lower:
                    symptoms.add(symptom)
                    break
        
        # Apply regex patterns for additional extraction
        for pattern in self.SYMPTOM_PATTERNS:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                # Clean and validate the extracted symptom
                symptom = match.strip() if isinstance(match, str) else match
                if symptom and len(symptom) > 2:
                    # Check if it's a valid symptom word
                    if self._is_valid_symptom(symptom):
                        symptoms.add(symptom)
        
        return list(symptoms)
    
    def _is_valid_symptom(self, word: str) -> bool:
        """
        Validate if a word is likely a symptom.
        
        Args:
            word: Potential symptom word
        
        Returns:
            Boolean indicating if word is a valid symptom
        """
        # Filter out common non-symptom words
        invalid_words = {'a', 'an', 'the', 'i', 'me', 'my', 'am', 'is', 'are',
                        'have', 'has', 'been', 'was', 'were', 'be', 'being',
                        'very', 'really', 'so', 'too', 'much', 'some', 'any',
                        'good', 'bad', 'okay', 'fine', 'well', 'better', 'worse'}
        
        return word.lower() not in invalid_words and len(word) > 2
    
    def extract_temperature(self, text: str) -> Optional[float]:
        """
        Extract temperature value from text.
        
        Args:
            text: User's message
        
        Returns:
            Temperature in Fahrenheit or None
        """
        text_lower = text.lower()
        
        for pattern in self.TEMPERATURE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                temp = float(match.group(1))
                # Check if it's Celsius and convert
                if 'c' in text_lower or 'celsius' in text_lower:
                    temp = (temp * 9/5) + 32  # Convert to Fahrenheit
                # Validate reasonable temperature range
                if 95 <= temp <= 110:
                    return temp
        
        return None
    
    def extract_duration(self, text: str) -> Optional[int]:
        """
        Extract symptom duration in days.
        
        Args:
            text: User's message
        
        Returns:
            Duration in days or None
        """
        text_lower = text.lower()
        
        for pattern in self.DURATION_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                value = int(match.group(1))
                unit = match.group(2).lower()
                
                # Convert to days
                if 'hour' in unit:
                    return max(1, value // 24)
                elif 'week' in unit:
                    return value * 7
                elif 'month' in unit:
                    return value * 30
                else:  # days
                    return value
        
        return None
    
    def extract_severity(self, text: str) -> Optional[int]:
        """
        Extract severity level (1-5) from text.
        
        Args:
            text: User's message
        
        Returns:
            Severity score (1-5) or None
        """
        text_lower = text.lower()
        
        # Check for explicit severity rating
        explicit_match = re.search(r'(?:severity|level|scale|rate)?\s*:?\s*([1-5])\s*(?:/\s*5|out\s+of\s+5)?', text_lower)
        if explicit_match:
            return int(explicit_match.group(1))
        
        # Check for severity keywords
        for level, keywords in self.SEVERITY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return level
        
        return None
    
    def extract_existing_conditions(self, text: str) -> List[str]:
        """
        Extract pre-existing medical conditions.
        
        Args:
            text: User's message
        
        Returns:
            List of identified conditions
        """
        conditions = []
        text_lower = text.lower()
        
        # Common conditions to look for
        known_conditions = [
            'diabetes', 'diabetic',
            'hypertension', 'high blood pressure',
            'heart disease', 'cardiac',
            'asthma', 'asthmatic',
            'copd',
            'cancer',
            'thyroid',
            'kidney disease',
            'liver disease',
            'pregnancy', 'pregnant',
        ]
        
        for condition in known_conditions:
            if condition in text_lower:
                # Normalize condition names
                normalized = condition.replace('diabetic', 'diabetes')
                normalized = normalized.replace('asthmatic', 'asthma')
                conditions.append(normalized)
        
        return list(set(conditions))
    
    def classify_intent(self, text: str) -> str:
        """
        Classify user intent from message.
        
        Args:
            text: User's message
        
        Returns:
            Intent category string
        """
        text_lower = text.lower().strip()
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return intent
        
        return 'general'
    
    def process_message(self, text: str, user_context: Dict = None) -> Dict[str, Any]:
        """
        Process user message and extract all relevant information.
        
        Args:
            text: User's message
            user_context: Optional context from previous messages
        
        Returns:
            Dictionary with extracted data and intent
        """
        if user_context is None:
            user_context = {}
        
        # Extract all components
        symptoms = self.extract_symptoms(text)
        temperature = self.extract_temperature(text)
        duration = self.extract_duration(text)
        severity = self.extract_severity(text)
        conditions = self.extract_existing_conditions(text)
        intent = self.classify_intent(text)
        
        # Merge with existing context
        all_symptoms = list(set(symptoms + user_context.get('symptoms', [])))
        all_conditions = list(set(conditions + user_context.get('existing_conditions', [])))
        
        extracted_data = {
            'symptoms': all_symptoms,
            'temperature': temperature or user_context.get('temperature'),
            'duration_days': duration or user_context.get('duration_days'),
            'severity': severity or user_context.get('severity'),
            'existing_conditions': all_conditions,
            'intent': intent,
            'raw_message': text,
        }
        
        # Determine what data is still missing
        missing_fields = self._identify_missing_fields(extracted_data)
        
        return {
            'extracted_data': extracted_data,
            'intent': intent,
            'missing_fields': missing_fields,
            'is_complete': len(missing_fields) == 0 and len(all_symptoms) > 0,
        }
    
    def _identify_missing_fields(self, data: Dict) -> List[str]:
        """
        Identify what information is still needed.
        
        Args:
            data: Currently extracted data
        
        Returns:
            List of missing field names
        """
        missing = []
        
        if not data.get('symptoms'):
            missing.append('symptoms')
        if data.get('temperature') is None:
            missing.append('temperature')
        if data.get('duration_days') is None:
            missing.append('duration')
        if data.get('severity') is None:
            missing.append('severity')
        
        return missing
    
    def get_follow_up_question(self, missing_field: str) -> str:
        """
        Get appropriate follow-up question for missing data.
        
        Args:
            missing_field: Name of the missing field
        
        Returns:
            Follow-up question string
        """
        return self.FOLLOW_UP_QUESTIONS.get(
            missing_field,
            "Could you provide more details about your symptoms?"
        )
    
    def generate_response_context(self, extracted_data: Dict) -> Dict[str, Any]:
        """
        Generate context-aware response data.
        
        Args:
            extracted_data: Processed symptom data
        
        Returns:
            Dictionary with response context
        """
        symptoms = extracted_data.get('symptoms', [])
        
        return {
            'has_symptoms': len(symptoms) > 0,
            'symptom_count': len(symptoms),
            'has_temperature': extracted_data.get('temperature') is not None,
            'has_duration': extracted_data.get('duration_days') is not None,
            'has_severity': extracted_data.get('severity') is not None,
            'has_conditions': len(extracted_data.get('existing_conditions', [])) > 0,
            'primary_symptoms': symptoms[:3] if symptoms else [],
        }
