"""
MediTriage AI Service
=====================
Modular AI triage engine. Supports OpenAI and Groq (Llama 3.3).
Future-ready: plug in facial verification, stress detection, med-optimizer here.

Author : MediTriage – AI Health Core
Version: 2.0.0 (Production-Ready)
"""

import os
import json
import re
import logging
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT  (do NOT alter in production without review)
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are MediTriage, an AI medical triage assistant used in hospitals and clinics.
Your role is to:
  1. Understand user symptoms described in ANY language (English, Tamil, Hindi, etc.)
  2. Translate and interpret symptoms accurately
  3. Estimate clinical severity from 0 to 10
  4. Be calm, professional, empathetic — NEVER diagnose
  5. Always recommend professional medical consultation

SEVERITY SCALE:
  0–3  → Stable  (Green)  — Self-manageable, monitor at home
  4–6  → Monitor (Yellow) — Medical attention advised within 24–48 hours
  7–10 → High Risk (Red)  — Urgent or emergency care required immediately

EMERGENCY TRIGGERS (always score 8–10):
  - Chest pain, shortness of breath, difficulty breathing
  - Unconsciousness, seizures, unresponsiveness
  - Severe allergic reaction (anaphylaxis)
  - Signs of stroke (FAST: Face drooping, Arm weakness, Speech difficulty, Time)
  - Uncontrolled bleeding, burns >20% body surface
  - Suicidal ideation or self-harm risk

OUTPUT FORMAT (strict JSON — no markdown, no extra text):
{
  "triage_score": <integer 0–10>,
  "risk_level": "<Stable | Monitor | High Risk>",
  "medical_advice": "<2–4 sentences, calm, professional, actionable>",
  "detected_symptoms": ["<symptom1>", "<symptom2>"],
  "recommended_action": "<Home care | Book appointment | Emergency room immediately>"
}

RULES:
  - STRICT LANGUAGE MATCHING: You MUST reply in the EXACT SAME language the user typed in. 
    * If user types in Tanglish (Tamil words in English letters like 'kachal', 'thala vali'), your `medical_advice` and `recommended_action` MUST be in Tanglish.
    * If user types in pure Tamil script (like 'தலைவலி'), you MUST reply in pure Tamil script.
    * If user types in English, you MUST reply in English.
  - health_stability_score is computed by the server: 100 - (triage_score * 8), min 0
  - NEVER include extra keys not listed above
  - If uncertain, err on the side of caution (higher score)
  - If input is gibberish / non-medical, return triage_score: 0, risk_level: "Stable",
  
SPECIAL CASE INSTRUCTIONS (Follow verbatim if matched or requested):
  1. "Thala Vali" (Headache - Mild) -> Score 1-2. Mention: Possible Causes (Dehydration, Lack of sleep, Stress, Screen overuse, Skipped meals). Home Care: 1-2 glass warm water kudiunga, 20-30 mins rest eduńga, Screen time konjam avoid pannunga, Forehead la cool cloth apply pannalaam, Light ah oil massage pannalaam, Proper sleep eduńga. Safe OTC: Mild paracetamol (if no allergy). "But repeated headache na doctor consult pannunga".
  2. "Odambu Vali" (Body Pain - Mild) -> Score 1-2. Mention: Possible Causes (Viral fatigue, Physical strain, Less sleep, Stress). Home Care: Warm water bath, Gentle stretching, Turmeric milk (night), Rest important, Hydration maintain pannunga. "If pain severe ah irundha or fever irundha -> monitor".
  3. "Kai Kaal Vali" (Limb Pain) -> Score 1-2. Mention: Causes (Muscle strain, Vitamin deficiency, Overwork, Long sitting). Home Care: Light stretching, Warm compress, Elevate legs while resting, Avoid heavy lifting for 1-2 days, Proper sleep. "If swelling / redness / numbness irundha -> doctor".
  4. "Kachal" (Fever - Low Grade < 100F) -> Score 3. Home Care: Plenty of fluids, ORS or electrolyte drink, Light food, Rest, Lukewarm sponge if needed. Safe OTC: Paracetamol (if required). "Doctor consult if: Fever > 102F, More than 3 days, Severe weakness, Continuous vomiting".
  5. IF USER ASKS "Any remedies" or "ethachu home remedies iruka" -> strictly respond with detailed natural/home remedies based on their symptoms in the language they used.
    medical_advice: "I could not identify any medical symptoms. Please describe how you are feeling."
"""


class AIService:
    """
    Core AI triage engine.

    Usage:
        service = AIService()
        result  = service.get_triage_assessment("I have chest pain for 2 hours")

    Future hooks (add new methods here):
        - facial_verification_score(image_b64)
        - stress_detection_score(audio_b64)
        - medication_optimizer(medication_list, conditions)
        - risk_heatmap_data(region_id)
    """

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "groq").lower()

        if self.provider == "groq":
            self.api_key = os.getenv("GROQ_API_KEY")
            self.client  = OpenAI(
                api_key  = self.api_key,
                base_url = "https://api.groq.com/openai/v1",
            )
            self.model = "llama-3.3-70b-versatile"   # stable & fast
        else:
            self.api_key = os.getenv("OPENAI_API_KEY")
            self.client  = OpenAI(api_key=self.api_key)
            self.model   = "gpt-4o-mini"

        if not self.api_key:
            logger.warning(
                "⚠  No API key found for provider '%s'. "
                "Set GROQ_API_KEY or OPENAI_API_KEY in your .env file.",
                self.provider,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    def get_triage_assessment(self, user_input: str, history: list = None) -> dict | None:
        """
        Send a symptom description to the LLM and return a structured triage result.

        Parameters
        ----------
        user_input : str
            The patient's free-form symptom text (any language).
        history : list, optional
            List of previous {'role': ..., 'content': ...} messages for context.

        Returns
        -------
        dict
            Structured triage data, or None on complete failure.
        """
        if not user_input or not user_input.strip():
            return self._fallback_empty()

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Inject conversation history (last 6 turns max to stay within token limits)
        if history:
            messages.extend(history[-6:])

        messages.append({"role": "user", "content": user_input.strip()})

        try:
            kwargs = {
                "model":       self.model,
                "messages":    messages,
                "temperature": 0.15,   # low creativity = consistent triage
                "max_tokens":  512,
            }
            # OpenAI supports strict JSON mode; Groq handles it via prompt
            if self.provider == "openai":
                kwargs["response_format"] = {"type": "json_object"}

            response    = self.client.chat.completions.create(**kwargs)
            raw_content = response.choices[0].message.content
            data        = self._parse_json(raw_content)

            # ── Post-process & enrich ────────────────────────────────────────
            triage_score = self._clamp(int(data.get("triage_score", 0)), 0, 10)
            data["triage_score"]           = triage_score
            data["health_stability_score"] = max(0, 100 - triage_score * 8)
            data["risk_level"]             = self._map_risk(triage_score, data.get("risk_level"))
            data.setdefault("detected_symptoms",  [])
            data.setdefault("recommended_action", "Consult a healthcare professional")

            logger.info(
                "Triage complete | score=%d | risk=%s | provider=%s",
                triage_score, data["risk_level"], self.provider,
            )
            return data

        except Exception as exc:
            logger.error("AIService.get_triage_assessment error: %s", exc, exc_info=True)
            return None

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _parse_json(self, text: str) -> dict:
        """Strip markdown fences and parse JSON robustly."""
        try:
            clean = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            # Try to salvage a JSON object buried in prose
            match = re.search(r"\{.*?\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            logger.warning("Could not parse JSON from AI response: %s", text[:200])
            return self._fallback_parse_error()

    def _map_risk(self, score: int, llm_risk: str = "") -> str:
        """Ensure risk_level is consistent with the numeric triage_score."""
        if score <= 3:
            return "Stable"
        if score <= 6:
            return "Monitor"
        return "High Risk"

    @staticmethod
    def _clamp(value: int, lo: int, hi: int) -> int:
        return max(lo, min(hi, value))

    @staticmethod
    def _fallback_empty() -> dict:
        return {
            "triage_score":           0,
            "health_stability_score": 100,
            "risk_level":             "Stable",
            "medical_advice":         "Please describe your symptoms so I can assess your condition.",
            "detected_symptoms":      [],
            "recommended_action":     "Provide symptom description",
        }

    @staticmethod
    def _fallback_parse_error() -> dict:
        return {
            "triage_score":           0,
            "health_stability_score": 100,
            "risk_level":             "Stable",
            "medical_advice":         "AI assistant is temporarily unavailable. Please try again.",
            "detected_symptoms":      [],
            "recommended_action":     "Try again shortly",
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Future Module Stubs
    # ─────────────────────────────────────────────────────────────────────────

    def facial_verification_score(self, image_b64: str) -> dict:
        """STUB: Facial verification module (Phase 2)."""
        raise NotImplementedError("Facial verification module coming in Phase 2")

    def stress_detection_score(self, audio_b64: str) -> dict:
        """STUB: Stress/vocal biomarker detection (Phase 2)."""
        raise NotImplementedError("Stress detection module coming in Phase 2")

    def medication_optimizer(self, medications: list, conditions: list) -> dict:
        """STUB: Medication interaction & optimization engine (Phase 3)."""
        raise NotImplementedError("Medication optimizer coming in Phase 3")

    def risk_heatmap_data(self, region_id: str) -> dict:
        """STUB: Regional outbreak risk heatmap API (Phase 3)."""
        raise NotImplementedError("Risk heatmap module coming in Phase 3")
