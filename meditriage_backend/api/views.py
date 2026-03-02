import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ChatMessageSerializer
from .services.ai_service import AIService

logger = logging.getLogger(__name__)


class TriageChatView(APIView):
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data["message"]
        history      = serializer.validated_data.get("history", [])

        try:
            ai_service = AIService()
            ai_data    = ai_service.get_triage_assessment(user_message, history)

            if ai_data is None:
                logger.error("AIService returned None for message: %s", user_message[:80])
                return Response(
                    {"error": "AI assistant is temporarily unavailable. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response(ai_data, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error("TriageChatView unhandled error: %s", exc, exc_info=True)
            return Response(
                {"error": "AI assistant is temporarily unavailable. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

class AnalyzeFaceView(APIView):
    def post(self, request):
        image_data = request.data.get("image")
        if not image_data:
            return Response({"error": "No image data provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .services.vision_service import VisionService
            service = VisionService()
            result = service.analyze_face(image_data)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("AnalyzeFaceView unhandled error: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to analyze face."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HealthCheckView(APIView):
    def get(self, request):
        return Response(
            {
                "status":  "ok",
                "service": "MediTriage AI Health Core",
                "version": "2.0.0",
            },
            status=status.HTTP_200_OK,
        )


class EmergencyDirectRequestView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        phone_number = request.data.get("phone_number")
        location = request.data.get("location", {})
        
        if not phone_number:
            return Response(
                {"success": False, "error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not location or not location.get("lat") or not location.get("lng"):
            return Response(
                {"success": False, "error": "Location coordinates are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            from .services.emergency_service import process_emergency_request
            
            result = process_emergency_request(phone_number, location)
            
            if result.get("success"):
                logger.info(f"Emergency request processed: {result.get('request_id')}")
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as exc:
            logger.error("EmergencyDirectRequestView error: %s", exc, exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to process emergency request. Please call emergency services directly."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
