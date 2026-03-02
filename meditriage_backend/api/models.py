"""
MediTriage API Models
=====================
Defines the database schema for chat sessions and triage records.
PostgreSQL-ready. Migrate with: python manage.py makemigrations && python manage.py migrate
"""

from django.db import models
import uuid


class ChatSession(models.Model):
    """
    A single triage session (anonymous or linked to a user).
    Future: link to a User model for authenticated sessions.
    """
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Session {self.id} — {self.created_at:%Y-%m-%d %H:%M}"


class TriageRecord(models.Model):
    """
    Stores each AI triage assessment for audit and analytics.
    """

    RISK_CHOICES = [
        ("Stable",    "Stable (Green)"),
        ("Monitor",   "Monitor (Yellow)"),
        ("High Risk", "High Risk (Red)"),
    ]

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session                 = models.ForeignKey(
        ChatSession,
        on_delete    = models.CASCADE,
        related_name = "records",
        null         = True,
        blank        = True,
    )
    user_message            = models.TextField()
    triage_score            = models.IntegerField(default=0)           # 0–10
    health_stability_score  = models.IntegerField(default=100)         # 0–100
    risk_level              = models.CharField(max_length=20, choices=RISK_CHOICES, default="Stable")
    medical_advice          = models.TextField(blank=True)
    detected_symptoms       = models.JSONField(default=list, blank=True)
    recommended_action      = models.CharField(max_length=200, blank=True)
    llm_provider            = models.CharField(max_length=50, blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["risk_level"]),
            models.Index(fields=["triage_score"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"[{self.risk_level}] Score {self.triage_score} — {self.created_at:%Y-%m-%d %H:%M}"


# ─── Future Module Models ────────────────────────────────────────────────────

class FacialVerificationRecord(models.Model):
    """STUB: Phase 2 – facial stress/pain detection results."""
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    triage_record   = models.OneToOneField(TriageRecord, on_delete=models.CASCADE, related_name="facial_data")
    stress_score    = models.FloatField(null=True)
    pain_score      = models.FloatField(null=True)
    confidence      = models.FloatField(null=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Facial Verification Record"


class MedicationRecord(models.Model):
    """STUB: Phase 3 – medication optimizer results."""
    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session                 = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="medications")
    medications             = models.JSONField(default=list)
    conditions              = models.JSONField(default=list)
    interaction_warnings    = models.JSONField(default=list)
    optimized_plan          = models.TextField(blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Medication Record"
