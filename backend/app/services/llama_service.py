"""
llama_service.py
Groq-powered Llama service for multilingual medical triage.
Handles conversation history and Tanglish/Tamil/English responses.
"""
import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Use Groq as the Llama provider
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'groq')

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)
MODEL = "llama-3.3-70b-specdec"

def build_prompt(user_input, history=""):
    return f"""
You are a professional medical triage assistant. Your goal is to assess user symptoms and provide advice.

IMPORTANT LANGUAGE RULES:
- Support English, Tamil, and Tanglish (Tamil words in English script).
- Reply ONLY in the language style used by the user.
- If the user uses Tanglish (e.g., "thala vali", "erichal"), you MUST reply in Tanglish.
- Be conversational, empathetic, and professional.
- Ask one follow-up question at a time to gather missing info (duration, severity, associated symptoms).

CONVERSATION STYLE (Tanglish Examples):
- User: "thala vali" -> Assistant: "Ungal thala vali eppo start aachu?"
- User: "2 days ah iruku" -> Assistant: "Ungal thala vali ethukku enna severity nu urayuma, example ah 1-10 scale la ethukku enna iruku?"
- User: "8" -> Assistant: "Ungal thala vali ku enna associated symptoms iruku, example ah fever, vomiting, light sensitivity adhula enna iruku?"

Your task:
1. Analyze the message and history.
2. Extract: symptoms, duration_days, severity (1-10), emergency_flag.
3. Generate a helpful reply message.

Return strict JSON format:
{{
  "symptoms": [],
  "duration_days": null,
  "severity": null,
  "emergency_flag": false,
  "reply_message": "your response here"
}}

Conversation History:
{history}

Current User Message: "{user_input}"
JSON Output:
"""

def extract_json(text):
    try:
        # Remove any markdown code block formatting
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            raise ValueError("No valid JSON found.")

def extract_medical_data(user_input, chat_history_list=None):
    """
    Sends request to Llama (via Groq) and returns structured triage output.
    """
    history_str = ""
    if chat_history_list:
        # Format history for the prompt: "User: msg\nAssistant: reply"
        history_str = "\n".join([f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}" for msg in chat_history_list[-5:]])

    prompt = build_prompt(user_input, history_str)
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        raw_output = response.choices[0].message.content.strip()
        structured_data = extract_json(raw_output)
        return structured_data
    except Exception as e:
        print(f"Llama API Error: {e}")
        return {
            "symptoms": [],
            "duration_days": None,
            "severity": None,
            "emergency_flag": False,
            "reply_message": "I'm having trouble processing that right now. Could you please describe your symptoms again?",
            "error": str(e)
        }
