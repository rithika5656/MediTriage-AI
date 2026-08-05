"""LangGraph orchestrator builder for the MediTriage planner."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List

from memory import ConversationMemory
from tools import PatientHistoryTool, PDFSearchTool

if TYPE_CHECKING:
    from agents import AppointmentAgent, DrugSafetyAgent, MedicalResearchAgent, ReportAgent, TriageAgent


class LangGraphBuilder:
    """Creates a lightweight planner graph for agent orchestration."""

    def __init__(
        self,
        memory: ConversationMemory,
        triage_agent: TriageAgent,
        research_agent: MedicalResearchAgent,
        drug_agent: DrugSafetyAgent,
        appointment_agent: AppointmentAgent,
        report_agent: ReportAgent,
        pdf_search_tool: PDFSearchTool,
    ) -> None:
        self.memory = memory
        self.history_tool = PatientHistoryTool(memory)
        self.triage_agent = triage_agent
        self.research_agent = research_agent
        self.drug_agent = drug_agent
        self.appointment_agent = appointment_agent
        self.report_agent = report_agent
        self.pdf_search_tool = pdf_search_tool

    def build(self, user_id: int, message: str, uploaded_documents_available: bool) -> Dict[str, Any]:
        """Build and execute the planner graph for a user request."""
        graph_steps: List[Dict[str, Any]] = []
        history = self.history_tool.get_recent_context(user_id=user_id, limit=5)

        graph_steps.append({
            "step": "input_received",
            "status": "completed",
            "details": {
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
        })

        intent = self._determine_intent(message)
        graph_steps.append({
            "step": "intent_detection",
            "status": "completed",
            "intent": intent,
        })

        symptoms = self._extract_symptoms(message)
        medications = self._extract_medicines(message)
        allergies = self._extract_allergies(message)

        graph_steps.append({
            "step": "context_retrieval",
            "status": "completed",
            "history_count": len(history),
            "recent_symptoms": self.history_tool.get_recent_symptoms(user_id=user_id),
        })

        triage = self.triage_agent.analyze(message=message, symptoms=symptoms, context={"history": history})
        graph_steps.append({
            "step": "triage_agent",
            "status": "completed",
            "priority": triage["priority"],
            "risk_score": triage["risk_score"],
        })

        research = self._run_research(intent, message, user_id, uploaded_documents_available, graph_steps)
        drug_safety = self._run_drug_safety(intent, medications, allergies, graph_steps)
        appointment = self._run_appointment(intent, symptoms, triage, graph_steps)

        final_payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": message,
            "intent": intent,
            "symptoms": symptoms,
            "triage": triage,
            "medical_research": research,
            "drug_safety": drug_safety,
            "appointment": appointment,
            "history": history,
            "trace": graph_steps,
        }

        report = self.report_agent.build_report(final_payload)
        graph_steps.append({
            "step": "report_agent",
            "status": "completed",
            "report_fields": list(report.keys()),
        })

        final_payload["report"] = report
        final_payload["final_recommendations"] = self._compose_recommendations(final_payload)
        final_payload["final_message"] = self._compose_final_message(final_payload)
        final_payload["trace"] = graph_steps

        return final_payload

    def _determine_intent(self, message: str) -> str:
        normalized = message.lower()
        if any(word in normalized for word in ["appointment", "doctor", "specialist", "book", "visit"]):
            return "appointment"
        if any(word in normalized for word in ["medication", "medicine", "drug", "interaction", "allergy"]):
            return "drug_safety"
        if any(word in normalized for word in ["what", "how", "why", "research", "paper", "guideline", "study"]):
            return "medical_research"
        if any(word in normalized for word in ["report", "pdf", "summary"]):
            return "report"
        return "triage"

    def _extract_symptoms(self, message: str) -> List[str]:
        terms = ["chest pain", "fever", "cough", "headache", "stomach pain", "nausea", "vomit", "breathing difficulty", "dizziness", "rash"]
        found = [term for term in terms if term in message.lower()]
        return found

    def _extract_medicines(self, message: str) -> List[str]:
        known = ["aspirin", "ibuprofen", "paracetamol", "warfarin", "metformin", "amoxicillin", "insulin"]
        return [med for med in known if med in message.lower()]

    def _extract_allergies(self, message: str) -> List[str]:
        normalized = message.lower()
        if "allerg" not in normalized:
            return []
        return [token.strip(".,") for token in normalized.split() if token.startswith("allerg") or token in {"penicillin", "nuts", "aspirin", "ibuprofen"}]

    def _run_research(self, intent: str, message: str, user_id: int, uploaded_documents_available: bool, graph_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        research = {
            "used_rag": False,
            "answer": "No research was required for this request.",
            "citations": [],
            "retrieved_context": [],
        }
        if intent in {"medical_research", "triage"} or uploaded_documents_available:
            research = self.research_agent.research(query=message, user_id=user_id)
            graph_steps.append({
                "step": "research_agent",
                "status": "completed",
                "used_rag": research.get("used_rag", False),
                "citation_count": len(research.get("citations", [])),
            })
        return research

    def _run_drug_safety(self, intent: str, medications: List[str], allergies: List[str], graph_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        if intent == "drug_safety" or medications or allergies:
            drug_safety = self.drug_agent.analyze(medications=medications, allergies=allergies)
            graph_steps.append({
                "step": "drug_safety_agent",
                "status": "completed",
                "warnings": drug_safety.get("warnings", []),
            })
            return drug_safety
        return {
            "safe": True,
            "warnings": [],
            "recommendation": "No medication review was needed.",
            "structured": {"medications_reviewed": [], "allergies_reviewed": [], "warning_count": 0},
        }

    def _run_appointment(self, intent: str, symptoms: List[str], triage: Dict[str, Any], graph_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        if intent == "appointment" or triage["priority"] in {"Emergency", "High Priority", "Medium Priority"}:
            appointment = self.appointment_agent.recommend(symptoms=symptoms, priority=triage["priority"])
            graph_steps.append({
                "step": "appointment_agent",
                "status": "completed",
                "specialist": appointment.get("specialist"),
                "department": appointment.get("department"),
            })
            return appointment
        return {
            "specialist": "General Physician",
            "department": "General Medicine",
            "suggested_datetime": datetime.utcnow().isoformat() + "Z",
            "hospital_preparation_checklist": [
                "Bring your ID and insurance card.",
                "Bring any recent medical records.",
            ],
        }

    def _compose_recommendations(self, payload: Dict[str, Any]) -> List[str]:
        recommendations = [payload["triage"]["follow_up"]]
        if payload["drug_safety"].get("warnings"):
            recommendations.extend(payload["drug_safety"]["warnings"])
        if payload["appointment"]:
            recommendations.append(
                f"See a {payload['appointment']['specialist']} in {payload['appointment']['department']}."
            )
        if payload["medical_research"].get("used_rag"):
            recommendations.append("Review the cited medical documentation for additional guidance.")
        return recommendations

    def _compose_final_message(self, payload: Dict[str, Any]) -> str:
        parts = [
            f"Triage result: {payload['triage']['priority']}.",
            payload['triage']['reason'],
            payload['medical_research']['answer'],
            payload['drug_safety']['recommendation'],
        ]
        if payload['appointment']:
            parts.append(
                f"Suggestion: consult a {payload['appointment']['specialist']} ({payload['appointment']['department']})."
            )
        if payload['medical_research'].get('used_rag'):
            parts.append("This answer includes information retrieved from medical documents.")
        else:
            parts.append("This response is based on general medical knowledge.")
        return " ".join([part for part in parts if part])
