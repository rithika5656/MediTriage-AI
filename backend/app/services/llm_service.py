import os
import requests

import json
import re
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

def build_prompt(user_input):
    return f"""
You are a medical triage assistant.

Extract the following from the user's message:
- symptoms (list of strings)
- temperature (number or null)
- duration (number of days or null)
- severity (1-5 or null)
- emergency_flag (true/false)
- llm_reply (reply to user in same language as input)

IMPORTANT RULES:
1. Reply ONLY in valid JSON.
2. Do NOT add extra text.
3. Reply in same language as user.
4. emergency_flag must be true if chest pain, breathing issue, unconsciousness, or high fever > 103F.

Few-shot Examples:

User: "rendu naala kaichal iruku romba kashtam"
Output:
{{
  "symptoms": ["fever"],
  "temperature": null,
  "duration": 2,
  "severity": 4,
  "emergency_flag": false,
  "llm_reply": "Ungaluku 2 naal fever irukku. Konjam rest edungal. Severe aanaal doctor consult pannunga."
}}

User: "I have chest pain and breathing difficulty since 1 day"
Output:
{{
  "symptoms": ["chest pain", "breathing difficulty"],
  "temperature": null,
  "duration": 1,
  "severity": 5,
  "emergency_flag": true,
  "llm_reply": "This may be serious. Please seek immediate medical attention."
}}

User: "எனக்கு 4 நாளாக 103 fever இருக்கு"
Output:
{{
  "symptoms": ["fever"],
  "temperature": 103,
  "duration": 4,
  "severity": 5,
  "emergency_flag": true,
  "llm_reply": "உங்களுக்கு அதிக காய்ச்சல் உள்ளது. உடனடியாக மருத்துவரை அணுகவும்."
}}

Now analyze this message:

User: "{user_input}"

Return JSON only:
"""

def extract_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            raise ValueError("No valid JSON found.")

def extract_medical_data(user_input):
    prompt = build_prompt(user_input)
    try:
        provider = os.getenv('LLM_PROVIDER', 'openai')
        if provider == 'openai':
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            raw_output = response.choices[0].message.content.strip()
        elif provider == 'gemini':
            import requests
            GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
            GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
            response = requests.post(url, headers=headers, json=data, timeout=15)
            response.raise_for_status()
            result = response.json()
            raw_output = result['candidates'][0]['content']['parts'][0]['text']
        else:
            return {
                "symptoms": [],
                "temperature": None,
                "duration": None,
                "severity": None,
                "emergency_flag": False,
                "llm_reply": "Sorry, unsupported LLM provider.",
                "error": "Unsupported provider"
            }
        structured_data = extract_json(raw_output)
        return structured_data
    except Exception as e:
        return {
            "symptoms": [],
            "temperature": None,
            "duration": None,
            "severity": None,
            "emergency_flag": False,
            "llm_reply": "Sorry, we could not process your request. Please try again.",
            "error": str(e)
        }
