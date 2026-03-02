"""
MediTriage Face Recognition – Views
=====================================
Secure facial recognition login using OpenCV and perceptual hashing.
Fallback implementation that works without TensorFlow/DeepFace.

Endpoints:
  POST /api/auth/register-face/   → Register face embedding (requires auth)
  POST /api/auth/verify-face/     → Verify face and login (no auth required)

Features:
  - Face detection using OpenCV Haar cascades
  - Perceptual hashing for face embeddings
  - Hamming distance comparison
  - Rate limiting (max 5 attempts)
  - No raw images stored - only hash embeddings
"""

import logging
import base64
import io
from datetime import datetime, timedelta
from collections import defaultdict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Patient
from .views import _get_patient_from_request, _issue_token

logger = logging.getLogger(__name__)

# Check dependencies
try:
    import numpy as np
    from PIL import Image
    import imagehash
    FACE_RECOGNITION_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Face recognition dependencies not available: {e}")
    FACE_RECOGNITION_AVAILABLE = False
    np = None

# Try to import OpenCV for face detection
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not available. Face detection will be limited.")
    OPENCV_AVAILABLE = False
    cv2 = None

# Rate limiting store
RATE_LIMIT_STORE: dict[str, list] = defaultdict(list)
MAX_ATTEMPTS = 5
RATE_LIMIT_WINDOW = 300  # 5 minutes


def _check_rate_limit(ip_address: str) -> bool:
    """Check if IP has exceeded rate limit. Returns True if allowed."""
    now = datetime.now()
    cutoff = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    RATE_LIMIT_STORE[ip_address] = [
        ts for ts in RATE_LIMIT_STORE[ip_address] 
        if ts > cutoff
    ]
    
    if len(RATE_LIMIT_STORE[ip_address]) >= MAX_ATTEMPTS:
        return False
    
    RATE_LIMIT_STORE[ip_address].append(now)
    return True


def _get_client_ip(request) -> str:
    """Extract client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def _decode_base64_image(base64_string: str):
    """Decode base64 image string to PIL Image."""
    from PIL import Image
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        raise ValueError("Invalid image data")


def _detect_face_region(image):
    """
    Detect and crop face region from image using OpenCV.
    Falls back to center crop if OpenCV not available or no face detected.
    """
    from PIL import Image
    import numpy as np
    
    if not OPENCV_AVAILABLE:
        # Center crop fallback
        w, h = image.size
        size = min(w, h)
        left = (w - size) // 2
        top = (h - size) // 2
        return image.crop((left, top, left + size, top + size))
    
    try:
        # Convert to OpenCV format
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(60, 60)
        )
        
        if len(faces) == 0:
            raise ValueError("No face detected in image")
        
        # Get the largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        
        # Add some padding (20%)
        padding = int(max(w, h) * 0.2)
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.width - x, w + 2 * padding)
        h = min(image.height - y, h + 2 * padding)
        
        # Crop face region
        face_image = image.crop((x, y, x + w, y + h))
        return face_image
        
    except Exception as e:
        logger.warning(f"Face detection failed: {e}")
        raise ValueError("No face detected in image")


def _extract_face_embedding(image) -> list:
    """
    Extract face embedding using perceptual hashing.
    Returns a list of hash values that serve as the face "embedding".
    """
    from PIL import Image
    import imagehash
    
    try:
        # Detect and crop face
        face_image = _detect_face_region(image)
        
        # Resize to standard size
        face_image = face_image.resize((256, 256), Image.Resampling.LANCZOS)
        
        # Calculate multiple hash types for better accuracy
        phash = imagehash.phash(face_image, hash_size=16)  # 256 bits
        dhash = imagehash.dhash(face_image, hash_size=16)  # 256 bits
        whash = imagehash.whash(face_image, hash_size=16)  # 256 bits
        
        # Convert hashes to lists of integers (bits)
        embedding = []
        for h in [phash, dhash, whash]:
            hash_bits = bin(int(str(h), 16))[2:].zfill(256)
            embedding.extend([int(b) for b in hash_bits])
        
        return embedding  # 768-dimensional binary embedding
        
    except Exception as e:
        logger.error(f"Face embedding extraction failed: {e}")
        raise


def _hamming_similarity(embedding1: list, embedding2: list) -> float:
    """
    Calculate similarity between two embeddings using Hamming distance.
    Returns a similarity score between 0 and 1.
    """
    if len(embedding1) != len(embedding2):
        raise ValueError("Embedding dimensions don't match")
    
    matches = sum(1 for a, b in zip(embedding1, embedding2) if a == b)
    return matches / len(embedding1)


def _average_embeddings(embeddings: list) -> list:
    """
    Average multiple embeddings by majority voting on each bit.
    """
    if not embeddings:
        raise ValueError("No embeddings provided")
    
    num_dims = len(embeddings[0])
    averaged = []
    
    for i in range(num_dims):
        bit_sum = sum(emb[i] for emb in embeddings)
        averaged.append(1 if bit_sum > len(embeddings) / 2 else 0)
    
    return averaged


class RegisterFaceView(APIView):
    """
    POST /api/auth/register-face/
    """
    
    def post(self, request):
        if not FACE_RECOGNITION_AVAILABLE:
            return Response(
                {"error": "Face recognition is not available. Please install: pip install numpy Pillow imagehash opencv-python"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        patient = _get_patient_from_request(request)
        if not patient:
            return Response(
                {"error": "Authentication required. Please log in first."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        face_samples = request.data.get('face_samples', [])
        
        if not face_samples:
            return Response(
                {"error": "No face samples provided. Please capture at least 3 face images."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(face_samples) < 3:
            return Response(
                {"error": f"Insufficient face samples. Need at least 3, got {len(face_samples)}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(face_samples) > 10:
            return Response(
                {"error": "Too many face samples. Maximum is 10."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            embeddings = []
            
            for i, sample in enumerate(face_samples):
                try:
                    image = _decode_base64_image(sample)
                    embedding = _extract_face_embedding(image)
                    embeddings.append(embedding)
                    logger.info(f"Extracted embedding {i+1}/{len(face_samples)} for patient {patient.id}")
                except ValueError as e:
                    logger.warning(f"Sample {i+1} failed: {e}")
                    continue
            
            if len(embeddings) < 3:
                return Response(
                    {"error": f"Could not extract enough valid face embeddings. Only {len(embeddings)} samples were valid. Please ensure your face is clearly visible."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            average_embedding = _average_embeddings(embeddings)
            patient.face_embedding = average_embedding
            patient.save()
            
            logger.info(f"Face registered for patient: {patient.email}")
            
            return Response({
                "success": True,
                "message": "Face registered successfully",
                "samples_processed": len(embeddings)
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Face registration failed: {e}")
            return Response(
                {"error": "Face registration failed. Please try again with clear, well-lit photos."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyFaceView(APIView):
    """
    POST /api/auth/verify-face/
    """
    
    def post(self, request):
        if not FACE_RECOGNITION_AVAILABLE:
            return Response(
                {"error": "Face recognition is not available."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        client_ip = _get_client_ip(request)
        if not _check_rate_limit(client_ip):
            remaining_time = RATE_LIMIT_WINDOW // 60
            return Response(
                {"error": f"Too many attempts. Please try again in {remaining_time} minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        face_image = request.data.get('face_image')
        
        if not face_image:
            return Response(
                {"error": "No face image provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image = _decode_base64_image(face_image)
            submitted_embedding = _extract_face_embedding(image)
            
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return Response(
                {"error": "No face detected. Please ensure your face is clearly visible."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        best_match = None
        best_confidence = 0.0
        SIMILARITY_THRESHOLD = 0.75
        
        patients_with_faces = Patient.objects.exclude(face_embedding__isnull=True)
        
        for patient in patients_with_faces:
            try:
                stored_embedding = patient.face_embedding
                if not stored_embedding:
                    continue
                
                similarity = _hamming_similarity(submitted_embedding, stored_embedding)
                
                if similarity > best_confidence:
                    best_confidence = similarity
                    best_match = patient
                    
            except Exception as e:
                logger.warning(f"Error comparing with patient {patient.id}: {e}")
                continue
        
        if best_match and best_confidence >= SIMILARITY_THRESHOLD:
            token = _issue_token(best_match)
            logger.info(f"Face login successful for: {best_match.email} (confidence: {best_confidence:.2f})")
            
            RATE_LIMIT_STORE[client_ip] = []
            
            return Response({
                "match": True,
                "patient_id": str(best_match.id),
                "confidence": round(best_confidence, 2),
                "user": best_match.to_safe_dict(),
                "access_token": token
            }, status=status.HTTP_200_OK)
        
        else:
            confidence_msg = f" (best match: {best_confidence:.2f})" if best_confidence > 0 else ""
            logger.info(f"Face verification failed from {client_ip}{confidence_msg}")
            
            return Response({
                "match": False,
                "confidence": round(best_confidence, 2) if best_confidence > 0 else 0,
                "error": "Face not recognized. Please try again or use manual login.",
                "attempts_remaining": MAX_ATTEMPTS - len(RATE_LIMIT_STORE[client_ip])
            }, status=status.HTTP_401_UNAUTHORIZED)


class CheckFaceRegistrationView(APIView):
    """
    GET /api/auth/check-face-registration/
    """
    
    def get(self, request):
        patient = _get_patient_from_request(request)
        if not patient:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            "has_face_registered": patient.face_embedding is not None
        }, status=status.HTTP_200_OK)


class DeleteFaceView(APIView):
    """
    DELETE /api/auth/delete-face/
    """
    
    def delete(self, request):
        patient = _get_patient_from_request(request)
        if not patient:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not patient.face_embedding:
            return Response(
                {"error": "No face registration found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        patient.face_embedding = None
        patient.save()
        
        logger.info(f"Face registration removed for: {patient.email}")
        
        return Response({
            "success": True,
            "message": "Face registration removed successfully"
        }, status=status.HTTP_200_OK)
