"""
MediTriage Accounts – Models
=============================
Simple user model stored in SQLite/PostgreSQL.
Uses Django's built-in password hashing — no third-party JWT needed for hackathon.
"""

from django.db import models
from django.contrib.auth.hashers import make_password, check_password as django_check_password
import uuid


class Patient(models.Model):
    """
    One row per registered user / patient.
    """
    GENDER_CHOICES = [
        ("male",   "Male"),
        ("female", "Female"),
        ("other",  "Other"),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=200)
    email      = models.EmailField(unique=True)
    password   = models.CharField(max_length=300)          # hashed
    age        = models.PositiveIntegerField(null=True, blank=True)
    gender     = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    phone      = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def set_password(self, raw_password: str):
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return django_check_password(raw_password, self.password)

    def to_safe_dict(self) -> dict:
        """Return user data safe to send to the frontend (no password)."""
        return {
            "id":     str(self.id),
            "name":   self.name,
            "email":  self.email,
            "age":    self.age,
            "gender": self.gender,
            "phone":  self.phone,
        }

    def __str__(self):
        return f"{self.name} <{self.email}>"
