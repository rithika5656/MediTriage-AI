"""
Structured patient report generation and PDF export.
"""
from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List


class ReportAgent:
    def build_report(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "title": "MediTriage Patient Report",
            "timestamp": payload.get("timestamp"),
            "triage_priority": payload.get("triage", {}).get("priority", "Unknown"),
            "triage_reason": payload.get("triage", {}).get("reason", ""),
            "risk_score": payload.get("triage", {}).get("risk_score", 0),
            "risk_factors": payload.get("triage", {}).get("risk_factors", []),
            "symptoms": payload.get("symptoms", []),
            "medical_findings": payload.get("medical_research", {}),
            "suggested_specialist": payload.get("appointment", {}).get("specialist"),
            "department": payload.get("appointment", {}).get("department"),
            "hospital_name": payload.get("appointment", {}).get("hospital_name"),
            "hospital_location": payload.get("appointment", {}).get("hospital_location"),
            "appointment_type": payload.get("appointment", {}).get("appointment_type"),
            "drug_warnings": payload.get("drug_safety", {}).get("warnings", []),
            "recommendations": payload.get("final_recommendations", []),
        }

    def export_pdf(self, report: Dict[str, Any]) -> bytes:
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except Exception as exc:
            raise RuntimeError("PDF export requires reportlab to be installed.") from exc

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        margin = 40
        y = height - margin

        def write_heading(text: str) -> None:
            nonlocal y
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(margin, y, text)
            y -= 22

        def write_text(text: str, size: int = 10, indent: int = 0) -> None:
            nonlocal y
            pdf.setFont("Helvetica", size)
            pdf.drawString(margin + indent, y, text)
            y -= size + 4

        def write_list(items: List[str], indent: int = 12) -> None:
            nonlocal y
            for item in items:
                write_text(f"• {item}", size=10, indent=indent)

        # Header
        pdf.setFillColor(colors.HexColor("#0d9488"))
        pdf.rect(margin, y - 30, 120, 28, fill=True, stroke=False)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(margin + 8, y - 18, "Hospital Logo")
        pdf.setFillColor(colors.black)
        y -= 46

        write_heading(report.get("title", "MediTriage Report"))
        write_text(f"Generated: {report.get('timestamp', '')}", size=9)
        y -= 6

        # Triage summary
        write_heading("Triage Summary")
        write_text(f"Priority: {report.get('triage_priority', '')}")
        write_text(f"Risk Score: {report.get('risk_score', 0)} / 10")
        write_text(f"Reason: {report.get('triage_reason', '')}")
        if report.get("risk_factors"):
            write_text("Risk factors:", size=10)
            write_list(report.get("risk_factors", []), indent=18)
        y -= 6

        # Appointment plan
        write_heading("Appointment Recommendation")
        write_text(f"Specialist: {report.get('suggested_specialist', '')}")
        write_text(f"Department: {report.get('department', '')}")
        write_text(f"Hospital: {report.get('hospital_name', '')}")
        write_text(f"Location: {report.get('hospital_location', '')}")
        write_text(f"Appointment Type: {report.get('appointment_type', '')}")
        y -= 6

        # Symptoms and warnings
        write_heading("Symptoms")
        write_list(report.get("symptoms", []), indent=18)
        y -= 6

        write_heading("Medication Safety")
        warnings = report.get("drug_warnings", [])
        if warnings:
            write_list(warnings, indent=18)
        else:
            write_text("No medication warnings identified.", indent=18)
        y -= 6

        # Recommendations
        write_heading("Recommendations")
        write_list(report.get("recommendations", []), indent=18)

        pdf.showPage()
        pdf.save()
        return buffer.getvalue()
