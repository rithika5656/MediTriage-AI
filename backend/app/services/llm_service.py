"""
llm_service.py
Handles medical data extraction and multilingual response using LLM (OpenAI/Gemini).
"""

import os
import requests

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'


class LLMService:
    def __init__(self, api_key=None, provider='openai'):
        self.provider = provider.lower()
        if self.provider == 'openai':
            self.api_key = api_key or OPENAI_API_KEY
        elif self.provider == 'gemini':
            self.api_key = api_key or GEMINI_API_KEY
        else:
            raise ValueError('Unsupported LLM provider')

    def extract_medical_data(self, user_input, model='gpt-3.5-turbo'):
        """
        Sends user input to LLM and extracts structured medical data.
        Returns: dict with symptoms, temperature, duration, severity, emergency_flag, language, and reply.
        """
        prompt = f'''
        You are a medical triage assistant. Extract the following from the user's message:
        - symptoms
        - temperature
        - duration
        - severity
        - emergency_flag (true/false)
        Return the result as a JSON object.
        Also, reply to the user in the same language as their input.
        User message: {user_input}
        '''
        try:
            if self.provider == 'openai':
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                }
                data = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a multilingual medical triage assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                }
                response = requests.post(OPENAI_URL, headers=headers, json=data, timeout=15)
                response.raise_for_status()
                result = response.json()
                reply_text = result['choices'][0]['message']['content']
            elif self.provider == 'gemini':
                headers = {
                    'Content-Type': 'application/json'
                }
                data = {
                    "contents": [
                        {"parts": [{"text": prompt}]}
                    ]
                }
                url = f"{GEMINI_URL}?key={self.api_key}"
                response = requests.post(url, headers=headers, json=data, timeout=15)
                response.raise_for_status()
                result = response.json()
                # Gemini response parsing
                reply_text = result['candidates'][0]['content']['parts'][0]['text']
            else:
                return {'error': 'Unsupported LLM provider', 'llm_reply': ''}

            import json
            try:
                medical_data = json.loads(reply_text)
            except Exception:
                medical_data = {}
            medical_data['llm_reply'] = reply_text
            return medical_data
        except Exception as e:
            return {
                'error': f'LLM extraction failed: {str(e)}',
                'llm_reply': ''
            }
