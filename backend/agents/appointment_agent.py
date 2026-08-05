"""
Appointment recommendation agent.
"""
from __future__ import annotations

from typing import Any, Dict, List

from tools.appointment_tool import build_appointment_recommendation


class AppointmentAgent:
    def recommend(self, symptoms: List[str], priority: str) -> Dict[str, Any]:
        recommendation = build_appointment_recommendation(symptoms=symptoms, priority=priority)
        return {
            "appointment_id": recommendation["appointment_id"],
            "specialist": recommendation["specialist"],
            "department": recommendation["department"],
            "hospital_name": recommendation["hospital_name"],
            "hospital_location": recommendation["hospital_location"],
            "appointment_type": recommendation["appointment_type"],
            "urgency_level": recommendation["urgency_level"],
            "suggested_datetime": recommendation["suggested_datetime"],
            "hospital_preparation_checklist": recommendation["hospital_preparation_checklist"],
            "follow_up": recommendation["follow_up"],
        }
