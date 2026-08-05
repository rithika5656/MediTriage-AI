"""
Service layer for the planner-driven multi-agent workflow.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from flask import current_app

from app import db
from app.models import ChatHistory, User
from agents import AppointmentAgent, DrugSafetyAgent, PlannerAgent, MedicalResearchAgent, ReportAgent, TriageAgent
from database import REPORT_DIR, UPLOAD_DIR, ensure_storage_paths
from memory import ConversationMemory
from rag import MedicalKnowledgeStore
from tools import PDFSearchTool


class AgentService:
    """Coordinates memory, retrieval, and the specialist agents."""

    def __init__(self) -> None:
        ensure_storage_paths()
        self.memory = ConversationMemory()
        self.knowledge_store = MedicalKnowledgeStore()
        self.pdf_search_tool = PDFSearchTool(self.knowledge_store)
        self.triage_agent = TriageAgent()
        self.research_agent = MedicalResearchAgent(self.pdf_search_tool)
        self.drug_agent = DrugSafetyAgent()
        self.appointment_agent = AppointmentAgent()
        self.report_agent = ReportAgent()
        self.planner = PlannerAgent(
            memory=self.memory,
            research_agent=self.research_agent,
            triage_agent=self.triage_agent,
            drug_agent=self.drug_agent,
            appointment_agent=self.appointment_agent,
            report_agent=self.report_agent,
            pdf_search_tool=self.pdf_search_tool,
        )

    def _get_user(self, user_id: int) -> Optional[User]:
        return User.query.get(user_id)

    def process_chat(self, user_id: int, message: str) -> Dict[str, Any]:
        plan = self.planner.plan(user_id=user_id, message=message, uploaded_documents_available=self.knowledge_store.has_documents())
        risk_level = self._risk_level_for_priority(plan["triage"]["priority"])
        stability_score = max(0, min(100, 100 - (plan["triage"]["risk_score"] * 8)))
        response = {
            "message": plan["final_message"],
            "phase": self._map_phase(plan["triage"]["priority"]),
            "triage_score": plan["triage"]["risk_score"],
            "health_stability_score": stability_score,
            "risk_level": risk_level,
            "medical_advice": plan["final_message"],
            "recommended_action": plan["triage"]["follow_up"],
            "detected_symptoms": plan["symptoms"],
            "triage": {
                "risk_score": plan["triage"]["risk_score"],
                "detected_symptoms": plan["symptoms"],
                "priority": plan["triage"]["priority"],
                "reason": plan["triage"]["reason"],
                "recommended_action": plan["triage"]["follow_up"],
            },
            "medical_research": plan["medical_research"],
            "drug_safety": plan["drug_safety"],
            "appointment": plan["appointment"],
            "agent_trace": plan["trace"],
            "report": plan["report"],
            "final_recommendations": plan["final_recommendations"],
            "timestamp": plan["timestamp"],
        }

        if response["phase"] == "emergency":
            response["hospitals"] = [
                {"name": "City General Hospital", "distance": "2.5 km", "wait_time": "5 mins", "phone": "911"},
                {"name": "St. Mary Emergency Center", "distance": "3.2 km", "wait_time": "12 mins", "phone": "911"},
            ]

        if response["phase"] == "appointment":
            response["recommended_doctors"] = [
                {
                    "name": plan["appointment"]["specialist"],
                    "specialization": plan["appointment"]["department"],
                    "available": True,
                    "next_slot": plan["appointment"]["suggested_datetime"],
                }
            ]

        self.memory.record_turn(
            user_id=user_id,
            message=message,
            response=response["message"],
            symptoms=plan["symptoms"],
            recommendations=plan["final_recommendations"],
            priority=plan["triage"]["priority"],
            metadata={
                "trace": plan["trace"],
                "medical_research": plan["medical_research"],
                "drug_safety": plan["drug_safety"],
                "appointment": plan["appointment"],
            },
        )

        self._save_chat_history(user_id=user_id, message=message, response=response, plan=plan)
        return response

    def upload_document(self, file_storage, user_id: Optional[int] = None) -> Dict[str, Any]:
        ensure_storage_paths()
        upload_folder = Path(UPLOAD_DIR)
        upload_folder.mkdir(parents=True, exist_ok=True)
        original_name = file_storage.filename or f"document-{uuid.uuid4().hex}.pdf"
        filename = f"{uuid.uuid4().hex}-{original_name}"
        destination = upload_folder / filename
        file_storage.save(destination)

        ingestion_result = self.knowledge_store.ingest_pdf(str(destination), document_name=original_name)
        self.memory.record_turn(
            user_id=user_id or 0,
            message=f"Uploaded document: {original_name}",
            response=f"Indexed {ingestion_result['chunks_indexed']} document chunks.",
            symptoms=[],
            recommendations=[f"Uploaded {original_name}"],
            priority="Low Priority",
            metadata={"file_name": original_name, "stored_path": str(destination)},
        )
        return {"success": True, "document": ingestion_result, "stored_path": str(destination)}

    def generate_report(self, user_id: int, message: str | None = None) -> Dict[str, Any]:
        history = self.memory.get_history(user_id, limit=10)
        latest = history[-1] if history else {}
        final_payload = self.planner.plan(
            user_id=user_id,
            message=message or latest.get("message", ""),
            uploaded_documents_available=self.knowledge_store.has_documents(),
        )
        report = self.report_agent.build_report(final_payload)
        pdf_bytes = self.report_agent.export_pdf(report)
        report_path = Path(REPORT_DIR) / f"report-{user_id}-{uuid.uuid4().hex}.pdf"
        report_path.write_bytes(pdf_bytes)
        return {"success": True, "report": report, "pdf_path": str(report_path)}

    def get_history(self, user_id: int, limit: int = 25) -> Dict[str, Any]:
        history = self.memory.get_history(user_id, limit=limit)
        return {"history": history, "count": len(history)}

    def get_agent_status(self) -> Dict[str, Any]:
        return {
            "agents": [
                {"name": "Planner Agent", "status": "ready", "role": "Coordinates workflow and tool selection."},
                {"name": "Triage Agent", "status": "ready", "role": "Assigns Emergency, High, Medium, or Low priority."},
                {"name": "Medical Research Agent", "status": "ready", "role": "Searches uploaded medical documents with RAG."},
                {"name": "Drug Safety Agent", "status": "ready", "role": "Checks interactions and allergy warnings."},
                {"name": "Appointment Agent", "status": "ready", "role": "Suggests specialist, department, and timing."},
                {"name": "Report Agent", "status": "ready", "role": "Builds the structured report and PDF export."},
            ],
            "memory": {
                "documents_indexed": int(self.knowledge_store.has_documents()),
                "storage_ready": True,
            },
        }

    def _map_phase(self, priority: str) -> str:
        if priority == "Emergency":
            return "emergency"
        if priority in {"High Priority", "Medium Priority"}:
            return "appointment"
        return "query"

    def _risk_level_for_priority(self, priority: str) -> str:
        if priority == "Emergency":
            return "red"
        if priority in {"High Priority", "Medium Priority"}:
            return "yellow"
        return "green"

    def _save_chat_history(self, user_id: int, message: str, response: Dict[str, Any], plan: Dict[str, Any]) -> None:
        try:
            history_entry = ChatHistory(
                user_id=user_id,
                message=message,
                response=response["message"],
                message_type="chat",
                risk_score=plan["triage"]["risk_score"],
                phase=response["phase"],
                extracted_data={
                    "symptoms": plan["symptoms"],
                    "priority": plan["triage"]["priority"],
                    "medical_research": plan["medical_research"],
                    "drug_safety": plan["drug_safety"],
                    "appointment": plan["appointment"],
                    "trace": plan["trace"],
                },
                session_id=str(uuid.uuid4()),
            )
            db.session.add(history_entry)
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            current_app.logger.warning("Failed to persist planner chat history: %s", exc)


agent_service = AgentService()
