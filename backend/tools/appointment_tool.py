"""
Appointment suggestion helper used by the planner and appointment agent.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Dict, List


SPECIALIST_MAP = [
    ("chest pain", "Cardiologist", "Cardiology", "City Heart Center"),
    ("breathing", "Pulmonologist", "Respiratory Medicine", "BreathWell Medical"),
    ("fever", "General Physician", "General Medicine", "City Health Clinic"),
    ("headache", "Neurologist", "Neurology", "NeuroCare Specialists"),
    ("stomach", "Gastroenterologist", "Gastroenterology", "Digestive Health Center"),
    ("skin", "Dermatologist", "Dermatology", "Skin & Wellness Clinic"),
]


def build_appointment_recommendation(symptoms: List[str], priority: str) -> Dict[str, str]:
    symptom_text = " ".join(symptoms).lower()
    specialist = "General Physician"
    department = "General Medicine"
    hospital_name = "City Health Clinic"

    for keyword, specialist_name, department_name, hospital in SPECIALIST_MAP:
        if keyword in symptom_text:
            specialist = specialist_name
            department = department_name
            hospital_name = hospital
            break

    base_offset = {
        "Emergency": 0,
        "High Priority": 1,
        "Medium Priority": 3,
        "Low Priority": 7,
    }.get(priority, 3)
    suggested_time = datetime.utcnow() + timedelta(days=base_offset)

    return {
        "appointment_id": f"appt-{uuid.uuid4().hex[:8]}",
        "specialist": specialist,
        "department": department,
        "hospital_name": hospital_name,
        "hospital_location": "123 Wellness Blvd, City Center",
        "appointment_type": "In-person" if priority in {"Emergency", "High Priority", "Medium Priority"} else "Teleconsultation",
        "urgency_level": "Urgent" if priority == "Emergency" else "Soon" if priority in {"High Priority", "Medium Priority"} else "Routine",
        "suggested_datetime": suggested_time.replace(microsecond=0).isoformat() + "Z",
        "hospital_preparation_checklist": [
            "Bring government ID and insurance information.",
            "Carry a list of current medicines and allergies.",
            "Bring previous reports or discharge summaries.",
            "Arrive 15 minutes early for registration.",
        ],
        "follow_up": "Call the clinic if you need to reschedule.",
    }
