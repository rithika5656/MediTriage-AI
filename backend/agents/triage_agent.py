"""
Symptom severity and triage classification.
"""
from __future__ import annotations

from typing import Any, Dict, List

from app.services.triage_logic import TriageEngine


class TriageAgent:
    def __init__(self) -> None:
        self.engine = TriageEngine()

    def analyze(self, message: str, symptoms: List[str], context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        extracted_data = {
            "symptoms": symptoms,
            "temperature": None,
            "duration_days": None,
            "severity": None,
            "existing_conditions": (context or {}).get("conditions", []),
            "age": (context or {}).get("age"),
        }

        assessment = self.engine.get_triage_summary(extracted_data, message=message)
        priority = self._normalize_priority(assessment["priority"])
        risk_score = min(max(assessment["risk_score"], 0), 10)

        return {
            "priority": priority,
            "risk_score": risk_score,
            "reason": assessment.get("message", "A triage assessment was completed."),
            "follow_up": self._follow_up_text(priority),
            "emergency": priority == "Emergency",
            "signals": [item["symptom"] for item in assessment.get("detected_symptoms", [])],
            "risk_factors": assessment.get("risk_factors", []),
            "recommended_specialists": assessment.get("recommended_specialists", []),
            "details": {
                "detected_symptoms": assessment.get("detected_symptoms", []),
                "risk_factors": assessment.get("risk_factors", []),
                "classification": assessment.get("priority"),
            },
        }

    def _normalize_priority(self, priority: str) -> str:
        normalized = priority.lower()
        if normalized in {"critical", "emergency", "high"}:
            return "Emergency"
        if normalized in {"medium", "appointment"}:
            return "Medium Priority"
        if normalized in {"low", "query"}:
            return "Low Priority"
        return "Medium Priority"

    def _follow_up_text(self, priority: str) -> str:
        if priority == "Emergency":
            return "Seek urgent care immediately."
        if priority == "Medium Priority":
            return "Schedule a doctor's appointment soon."
        return "Monitor symptoms and contact a doctor if they worsen."
