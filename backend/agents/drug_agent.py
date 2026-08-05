"""
Medication safety and allergy warning agent.
"""
from __future__ import annotations

from typing import Any, Dict, List


KNOWN_INTERACTIONS = [
    {"pair": {"aspirin", "ibuprofen"}, "warning": "Aspirin and ibuprofen together can increase bleeding risk and stomach irritation."},
    {"pair": {"warfarin", "aspirin"}, "warning": "Warfarin with aspirin can significantly increase bleeding risk."},
    {"pair": {"paracetamol", "alcohol"}, "warning": "Alcohol can worsen liver stress when combined with paracetamol in high amounts."},
    {"pair": {"ibuprofen", "warfarin"}, "warning": "Ibuprofen may increase bleeding risk when taken with warfarin."},
    {"pair": {"aspirin", "alcohol"}, "warning": "Aspirin combined with alcohol can increase stomach irritation and bleeding risk."},
]

ALLERGY_KEYWORDS = {
    "penicillin": "Penicillin",
    "nuts": "Nuts",
    "shellfish": "Shellfish",
    "aspirin": "Aspirin",
    "ibuprofen": "Ibuprofen",
    "sulfa": "Sulfa drugs",
    "latex": "Latex",
}


class DrugSafetyAgent:
    def analyze(self, medications: List[str], allergies: List[str] | None = None) -> Dict[str, Any]:
        normalized_meds = {med.lower().strip() for med in medications if med}
        normalized_allergies = {item.lower().strip() for item in (allergies or []) if item}

        warnings = []
        medication_warnings = []

        for allergy in normalized_allergies:
            for medication in normalized_meds:
                if allergy and allergy in medication:
                    warnings.append(
                        f"Possible allergy concern: {medication.title()} may be unsafe because of reported allergy to {allergy}."
                    )
                    medication_warnings.append({
                        "medication": medication,
                        "allergy": allergy,
                        "type": "allergy_conflict",
                    })

        for interaction in KNOWN_INTERACTIONS:
            if interaction["pair"].issubset(normalized_meds):
                warnings.append(interaction["warning"])
                medication_warnings.append({
                    "medications": sorted(interaction["pair"]),
                    "type": "interaction",
                })

        if not normalized_meds and not normalized_allergies:
            return {
                "safe": True,
                "warnings": [],
                "recommendation": "No medications or allergies were provided for review.",
                "structured": {
                    "medications_reviewed": [],
                    "allergies_reviewed": [],
                    "warning_count": 0,
                    "details": medication_warnings,
                },
            }

        return {
            "safe": len(warnings) == 0,
            "warnings": warnings,
            "recommendation": (
                "No obvious medication conflicts were detected." 
                if not warnings 
                else "Please consult a doctor or pharmacist before continuing these medicines."
            ),
            "structured": {
                "medications_reviewed": sorted(normalized_meds),
                "allergies_reviewed": sorted(normalized_allergies),
                "warning_count": len(warnings),
                "details": medication_warnings,
            },
        }

    def detect_allergy_mentions(self, text: str) -> List[str]:
        normalized = text.lower()
        detected = []
        for keyword, label in ALLERGY_KEYWORDS.items():
            if keyword in normalized:
                detected.append(label)
        return detected
