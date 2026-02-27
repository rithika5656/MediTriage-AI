"""
Triage Logic Engine.
Implements rule-based risk scoring system for patient symptom assessment.
Classifies cases into Query, Appointment, or Emergency phases.
"""


class TriageEngine:
    """
    Risk scoring and triage classification engine.
    
    Uses weighted symptom analysis to calculate risk scores
    and determine appropriate care phase.
    
    Risk Score Thresholds:
        - Score <= 3: Query Phase (basic health advice)
        - Score 4-6: Appointment Phase (schedule doctor visit)
        - Score > 6: Emergency Phase (immediate medical attention)
    """
    
    # Symptom risk weights
    SYMPTOM_WEIGHTS = {
        # High-risk symptoms (Emergency indicators)
        'chest pain': 4,
        'chest_pain': 4,
        'difficulty breathing': 4,
        'breathing difficulty': 4,
        'shortness of breath': 4,
        'severe bleeding': 4,
        'unconscious': 5,
        'fainting': 3,
        'seizure': 4,
        'stroke': 5,
        'heart attack': 5,
        'severe allergic reaction': 4,
        'anaphylaxis': 5,
        'poisoning': 4,
        'severe burn': 3,
        'head injury': 3,
        'suicidal': 5,
        
        # Medium-risk symptoms
        'high fever': 2,
        'vomiting blood': 3,
        'blood in stool': 3,
        'severe pain': 3,
        'persistent vomiting': 2,
        'severe headache': 2,
        'confusion': 3,
        'numbness': 2,
        'vision problems': 2,
        'sudden weakness': 3,
        
        # Lower-risk symptoms
        'fever': 1,
        'cough': 1,
        'cold': 1,
        'headache': 1,
        'body ache': 1,
        'fatigue': 1,
        'nausea': 1,
        'diarrhea': 1,
        'sore throat': 1,
        'runny nose': 1,
        'mild pain': 1,
        'rash': 1,
    }
    
    # Emergency keywords that trigger immediate emergency phase
    EMERGENCY_KEYWORDS = [
        'chest pain', 'heart attack', 'stroke', 'unconscious',
        'severe bleeding', 'cannot breathe', "can't breathe",
        'difficulty breathing', 'seizure', 'poisoning',
        'suicidal', 'overdose', 'anaphylaxis', 'choking'
    ]
    
    # Condition modifiers
    CONDITION_MODIFIERS = {
        'diabetes': 1,
        'heart disease': 2,
        'hypertension': 1,
        'asthma': 1,
        'copd': 2,
        'cancer': 2,
        'immunocompromised': 2,
        'pregnant': 1,
        'elderly': 1,  # Age > 65
    }
    
    def __init__(self):
        """Initialize the triage engine."""
        self.current_score = 0
        self.detected_symptoms = []
        self.risk_factors = []
    
    def calculate_risk_score(self, extracted_data):
        """
        Calculate total risk score based on extracted symptom data.
        
        Args:
            extracted_data: Dictionary containing:
                - symptoms: List of detected symptoms
                - temperature: Body temperature in Fahrenheit
                - duration_days: How long symptoms have persisted
                - severity: Pain/discomfort level (1-5)
                - existing_conditions: Pre-existing medical conditions
        
        Returns:
            Integer risk score (0-10+)
        """
        score = 0
        self.detected_symptoms = []
        self.risk_factors = []
        
        # 1. Score based on symptoms
        symptoms = extracted_data.get('symptoms', [])
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            for keyword, weight in self.SYMPTOM_WEIGHTS.items():
                if keyword in symptom_lower:
                    score += weight
                    self.detected_symptoms.append({
                        'symptom': symptom,
                        'weight': weight
                    })
                    break
        
        # 2. Temperature scoring
        temperature = extracted_data.get('temperature')
        if temperature:
            try:
                temp = float(temperature)
                if temp >= 104:
                    score += 3
                    self.risk_factors.append('Very high fever (≥104°F)')
                elif temp >= 102:
                    score += 2
                    self.risk_factors.append('High fever (≥102°F)')
                elif temp >= 100.4:
                    score += 1
                    self.risk_factors.append('Fever (≥100.4°F)')
            except (ValueError, TypeError):
                pass
        
        # 3. Duration scoring
        duration = extracted_data.get('duration_days')
        if duration:
            try:
                days = int(duration)
                if days > 7:
                    score += 3
                    self.risk_factors.append('Symptoms lasting > 7 days')
                elif days > 3:
                    score += 2
                    self.risk_factors.append('Symptoms lasting > 3 days')
                elif days > 1:
                    score += 1
            except (ValueError, TypeError):
                pass
        
        # 4. Severity scoring (1-5 scale)
        severity = extracted_data.get('severity')
        if severity:
            try:
                sev = int(severity)
                if sev >= 5:
                    score += 3
                    self.risk_factors.append('Severe symptoms (5/5)')
                elif sev >= 4:
                    score += 2
                    self.risk_factors.append('High severity (4/5)')
                elif sev >= 3:
                    score += 1
            except (ValueError, TypeError):
                pass
        
        # 5. Existing conditions scoring
        conditions = extracted_data.get('existing_conditions', [])
        for condition in conditions:
            condition_lower = condition.lower()
            for cond, weight in self.CONDITION_MODIFIERS.items():
                if cond in condition_lower:
                    score += weight
                    self.risk_factors.append(f'Pre-existing: {condition}')
                    break
        
        # 6. Age-based scoring
        age = extracted_data.get('age')
        if age:
            try:
                age_val = int(age)
                if age_val >= 65:
                    score += 1
                    self.risk_factors.append('Elderly patient (65+)')
                elif age_val <= 5:
                    score += 1
                    self.risk_factors.append('Young child (≤5 years)')
            except (ValueError, TypeError):
                pass
        
        self.current_score = score
        return score
    
    def check_emergency_keywords(self, text):
        """
        Check if text contains emergency keywords.
        
        Args:
            text: User message text
        
        Returns:
            Boolean indicating if emergency keywords detected
        """
        text_lower = text.lower()
        for keyword in self.EMERGENCY_KEYWORDS:
            if keyword in text_lower:
                return True
        return False
    
    def classify_phase(self, risk_score, message=''):
        """
        Classify the case into appropriate triage phase.
        
        Args:
            risk_score: Calculated risk score
            message: Original user message for emergency keyword check
        
        Returns:
            Dictionary with phase, priority, and recommendations
        """
        # Check for emergency keywords first
        if self.check_emergency_keywords(message):
            return {
                'phase': 'emergency',
                'priority': 'critical',
                'risk_score': max(risk_score, 7),
                'message': '🚨 EMERGENCY DETECTED - Please seek immediate medical attention!',
                'action': 'immediate_care',
                'recommendations': [
                    'Call emergency services (911) immediately',
                    'Go to the nearest emergency room',
                    'Do not drive yourself if possible',
                    'Have someone stay with you'
                ]
            }
        
        # Classify based on risk score
        if risk_score <= 3:
            return {
                'phase': 'query',
                'priority': 'low',
                'risk_score': risk_score,
                'message': 'Your symptoms appear to be mild. Here is some health advice.',
                'action': 'health_advice',
                'recommendations': [
                    'Rest and stay hydrated',
                    'Monitor your symptoms',
                    'Take over-the-counter medication if needed',
                    'Contact a doctor if symptoms worsen'
                ]
            }
        elif risk_score <= 6:
            return {
                'phase': 'appointment',
                'priority': 'medium',
                'risk_score': risk_score,
                'message': 'Based on your symptoms, we recommend scheduling an appointment with a doctor.',
                'action': 'book_appointment',
                'recommendations': [
                    'Schedule an appointment within 24-48 hours',
                    'Prepare a list of your symptoms',
                    'Bring any relevant medical records',
                    'Continue monitoring your symptoms'
                ]
            }
        else:
            return {
                'phase': 'emergency',
                'priority': 'high',
                'risk_score': risk_score,
                'message': '⚠️ Your symptoms require urgent medical attention.',
                'action': 'urgent_care',
                'recommendations': [
                    'Visit an urgent care center or emergency room',
                    'Do not delay seeking medical help',
                    'Have someone accompany you if possible',
                    'Bring a list of your medications'
                ]
            }
    
    def get_specialist_recommendation(self, symptoms):
        """
        Recommend appropriate medical specialist based on symptoms.
        
        Args:
            symptoms: List of detected symptoms
        
        Returns:
            List of recommended specializations
        """
        specializations = set()
        
        symptom_to_specialist = {
            # Cardiology
            'chest pain': 'Cardiology',
            'heart': 'Cardiology',
            'palpitations': 'Cardiology',
            'high blood pressure': 'Cardiology',
            
            # Pulmonology
            'breathing': 'Pulmonology',
            'cough': 'Pulmonology',
            'asthma': 'Pulmonology',
            'wheezing': 'Pulmonology',
            
            # Gastroenterology
            'stomach': 'Gastroenterology',
            'digestion': 'Gastroenterology',
            'nausea': 'Gastroenterology',
            'vomiting': 'Gastroenterology',
            'diarrhea': 'Gastroenterology',
            
            # Neurology
            'headache': 'Neurology',
            'migraine': 'Neurology',
            'dizziness': 'Neurology',
            'numbness': 'Neurology',
            'seizure': 'Neurology',
            
            # Orthopedics
            'joint pain': 'Orthopedics',
            'back pain': 'Orthopedics',
            'fracture': 'Orthopedics',
            'muscle': 'Orthopedics',
            
            # Dermatology
            'skin': 'Dermatology',
            'rash': 'Dermatology',
            'allergy': 'Dermatology',
            
            # ENT
            'ear': 'ENT',
            'nose': 'ENT',
            'throat': 'ENT',
            'sore throat': 'ENT',
            
            # General
            'fever': 'General Medicine',
            'cold': 'General Medicine',
            'fatigue': 'General Medicine',
        }
        
        symptoms_text = ' '.join(symptoms).lower()
        
        for keyword, specialist in symptom_to_specialist.items():
            if keyword in symptoms_text:
                specializations.add(specialist)
        
        # Default to General Medicine if no specific match
        if not specializations:
            specializations.add('General Medicine')
        
        return list(specializations)
    
    def get_triage_summary(self, extracted_data, message=''):
        """
        Generate complete triage summary.
        
        Args:
            extracted_data: Extracted symptom data
            message: Original user message
        
        Returns:
            Complete triage assessment dictionary
        """
        risk_score = self.calculate_risk_score(extracted_data)
        classification = self.classify_phase(risk_score, message)
        specialists = self.get_specialist_recommendation(
            extracted_data.get('symptoms', [])
        )
        
        return {
            **classification,
            'detected_symptoms': self.detected_symptoms,
            'risk_factors': self.risk_factors,
            'recommended_specialists': specialists,
            'extracted_data': extracted_data
        }
