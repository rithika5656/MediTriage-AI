from django.urls import path
from .views import TriageChatView, HealthCheckView, AnalyzeFaceView, EmergencyDirectRequestView

urlpatterns = [
    path("chat/",   TriageChatView.as_view(),  name="triage_chat"),
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("analyze-face/", AnalyzeFaceView.as_view(), name="analyze_face"),
    path("emergency-direct-request/", EmergencyDirectRequestView.as_view(), name="emergency_direct_request"),
]
