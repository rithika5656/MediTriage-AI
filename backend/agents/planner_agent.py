"""
Planner agent that coordinates all specialty agents through a LangGraph-style builder.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from agents.appointment_agent import AppointmentAgent
from agents.drug_agent import DrugSafetyAgent
from agents.research_agent import MedicalResearchAgent
from agents.report_agent import ReportAgent
from agents.triage_agent import TriageAgent
from graph.langgraph_builder import LangGraphBuilder
from memory import ConversationMemory
from tools.pdf_search_tool import PDFSearchTool


class PlannerAgent:
    def __init__(
        self,
        memory: ConversationMemory,
        research_agent: MedicalResearchAgent,
        triage_agent: TriageAgent,
        drug_agent: DrugSafetyAgent,
        appointment_agent: AppointmentAgent,
        report_agent: ReportAgent,
        pdf_search_tool: PDFSearchTool,
    ) -> None:
        self.memory = memory
        self.builder = LangGraphBuilder(
            memory=memory,
            triage_agent=triage_agent,
            research_agent=research_agent,
            drug_agent=drug_agent,
            appointment_agent=appointment_agent,
            report_agent=report_agent,
            pdf_search_tool=pdf_search_tool,
        )

    def plan(self, user_id: int, message: str, uploaded_documents_available: bool = False) -> Dict[str, Any]:
        return self.builder.build(
            user_id=user_id,
            message=message,
            uploaded_documents_available=uploaded_documents_available,
        )
