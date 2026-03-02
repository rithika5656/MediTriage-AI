"""
MediTriage Accounts – Auth Views
==================================
Simple token-based auth using a random UUID token stored in session/localStorage.
No external JWT library needed — perfect for hackathon.

Endpoints:
  POST /api/auth/signup   → Register
  POST /api/auth/login    → Login
  PUT  /api/auth/profile  → Update profile (token required)
  GET  /api/auth/me       → Get current user (token required)
"""

import uuid
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Patient
from .serializers import SignupSerializer, LoginSerializer, ProfileUpdateSerializer

logger = logging.getLogger(__name__)

# In-memory token store (fine for hackathon — replace with Redis/DB in production)
# Format: { "token-string": patient_id }
TOKEN_STORE: dict[str, str] = {}


def _get_patient_from_request(request) -> Patient | None:
    """Extract and validate Bearer token, return Patient or None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    patient_id = TOKEN_STORE.get(token)
    if not patient_id:
        return None
    try:
        return Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        TOKEN_STORE.pop(token, None)
        return None


def _issue_token(patient: Patient) -> str:
    """Issue a new token for the patient (invalidates old ones for simplicity)."""
    token = str(uuid.uuid4())
    TOKEN_STORE[token] = str(patient.id)
    return token


class SignupView(APIView):
    """
    POST /api/auth/signup

    Body: { name, email, password, age?, gender?, phone? }
    Response: { user, access_token }
    """
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Check duplicate email
        if Patient.objects.filter(email__iexact=data["email"]).exists():
            return Response(
                {"error": "An account with this email already exists. Please log in."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create patient
        patient = Patient(
            name   = data["name"].strip(),
            email  = data["email"].lower().strip(),
            age    = data.get("age"),
            gender = data.get("gender", ""),
            phone  = data.get("phone", ""),
        )
        patient.set_password(data["password"])
        patient.save()

        token = _issue_token(patient)
        logger.info("New patient registered: %s", patient.email)

        return Response(
            {"user": patient.to_safe_dict(), "access_token": token},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login

    Body: { email, password }
    Response: { user, access_token }
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            patient = Patient.objects.get(email__iexact=data["email"])
        except Patient.DoesNotExist:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not patient.check_password(data["password"]):
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = _issue_token(patient)
        logger.info("Patient logged in: %s", patient.email)

        return Response(
            {"user": patient.to_safe_dict(), "access_token": token},
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    """
    GET  /api/auth/me       → Return current user data
    PUT  /api/auth/profile  → Update name/age/gender/phone
    """

    def get(self, request):
        patient = _get_patient_from_request(request)
        if not patient:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({"user": patient.to_safe_dict()})

    def put(self, request):
        patient = _get_patient_from_request(request)
        if not patient:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = ProfileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if "name"   in data: patient.name   = data["name"]
        if "age"    in data: patient.age    = data["age"]
        if "gender" in data: patient.gender = data["gender"]
        if "phone"  in data: patient.phone  = data["phone"]
        patient.save()

        logger.info("Patient profile updated: %s", patient.email)
        return Response({"user": patient.to_safe_dict()})
