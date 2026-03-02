import logging
import base64
import io
import random
from typing import Dict, List, Tuple, Any

logger = logging.getLogger(__name__)

try:
    import numpy as np
    from PIL import Image, ImageStat
    NUMPY_AVAILABLE = True
except ImportError:
    logger.warning("numpy/PIL not available")
    NUMPY_AVAILABLE = False
    np = None

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not available")
    OPENCV_AVAILABLE = False
    cv2 = None


class FaceAnalysisService:
    STABLE_THRESHOLD = 3
    MONITOR_THRESHOLD = 6
    
    SKIN_LOWER = np.array([0, 20, 70], dtype=np.uint8) if NUMPY_AVAILABLE else None
    SKIN_UPPER = np.array([20, 255, 255], dtype=np.uint8) if NUMPY_AVAILABLE else None
    PALE_SATURATION_THRESHOLD = 40
    CYANOSIS_HUE_RANGE = (100, 130)
    
    def __init__(self):
        self.face_cascade = None
        self.eye_cascade = None
        
        if OPENCV_AVAILABLE:
            try:
                self.face_cascade = cv2.CascadeClassifier(
                    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                )
                self.eye_cascade = cv2.CascadeClassifier(
                    cv2.data.haarcascades + 'haarcascade_eye.xml'
                )
            except Exception as e:
                logger.warning(f"Failed to load cascades: {e}")
    
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return np.array(image)
    
    def detect_face(self, image: np.ndarray) -> Tuple[bool, Dict]:
        if not OPENCV_AVAILABLE or self.face_cascade is None:
            h, w = image.shape[:2]
            return True, {
                'x': w // 4,
                'y': h // 4,
                'w': w // 2,
                'h': h // 2,
                'face_image': image[h//4:3*h//4, w//4:3*w//4]
            }
        
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60)
        )
        
        if len(faces) == 0:
            return False, {}
        
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        face_image = image[y:y+h, x:x+w]
        
        return True, {
            'x': int(x),
            'y': int(y),
            'w': int(w),
            'h': int(h),
            'face_image': face_image
        }
    
    def detect_eyes(self, face_image: np.ndarray) -> List[Dict]:
        if not OPENCV_AVAILABLE or self.eye_cascade is None:
            return []
        
        gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        eyes = self.eye_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3)
        
        return [{'x': int(ex), 'y': int(ey), 'w': int(ew), 'h': int(eh)} 
                for ex, ey, ew, eh in eyes[:2]]
    
    def analyze_skin_pallor(self, face_image: np.ndarray) -> Tuple[float, bool]:
        if not OPENCV_AVAILABLE:
            return 0.3, False
        
        hsv = cv2.cvtColor(face_image, cv2.COLOR_RGB2HSV)
        skin_mask = cv2.inRange(hsv, self.SKIN_LOWER, self.SKIN_UPPER)
        skin_pixels = hsv[skin_mask > 0]
        
        if len(skin_pixels) == 0:
            return 0.3, False
        
        avg_saturation = np.mean(skin_pixels[:, 1])
        avg_value = np.mean(skin_pixels[:, 2])
        
        pallor_score = 0.0
        
        if avg_saturation < self.PALE_SATURATION_THRESHOLD:
            pallor_score = (self.PALE_SATURATION_THRESHOLD - avg_saturation) / self.PALE_SATURATION_THRESHOLD
        
        if pallor_score > 0.4:
            pallor_score = max(pallor_score, (avg_value - 200) / 55)
        
        is_pale = pallor_score > 0.4
        
        return float(min(1.0, pallor_score)), is_pale
    
    def analyze_lip_color(self, face_image: np.ndarray) -> Tuple[float, bool]:
        if not OPENCV_AVAILABLE:
            return 0.2, False
        
        h, w = face_image.shape[:2]
        lip_region = face_image[int(h*0.6):int(h*0.85), int(w*0.25):int(w*0.75)]
        
        if lip_region.size == 0:
            return 0.2, False
        
        hsv = cv2.cvtColor(lip_region, cv2.COLOR_RGB2HSV)
        hues = hsv[:, :, 0].flatten()
        
        # Count pixels in blue range
        blue_pixels = np.sum((hues >= self.CYANOSIS_HUE_RANGE[0]) & 
                            (hues <= self.CYANOSIS_HUE_RANGE[1]))
        total_pixels = len(hues)
        
        blue_ratio = blue_pixels / total_pixels if total_pixels > 0 else 0
        
        avg_red = np.mean(lip_region[:, :, 0])
        pale_lips = avg_red < 120
        
        cyanosis_score = blue_ratio * 2
        if pale_lips:
            cyanosis_score += 0.2
        
        has_cyanosis = cyanosis_score > 0.3
        
        return float(min(1.0, cyanosis_score)), has_cyanosis
    
    def analyze_eye_fatigue(self, face_image: np.ndarray, eyes: List[Dict]) -> Tuple[float, bool]:
        if not eyes:
            return 0.5, True
        
        fatigue_indicators = 0
        
        for eye in eyes:
            eye_region = face_image[eye['y']:eye['y']+eye['h'], 
                                   eye['x']:eye['x']+eye['w']]
            
            if eye_region.size == 0:
                continue
            
            aspect_ratio = eye['h'] / eye['w'] if eye['w'] > 0 else 0
            
            if aspect_ratio < 0.25:
                fatigue_indicators += 1
            
            avg_red = np.mean(eye_region[:, :, 0])
            if avg_red > 180:
                fatigue_indicators += 0.5
        
        fatigue_score = min(1.0, fatigue_indicators / 3)
        has_fatigue = fatigue_score > 0.3
        
        return float(fatigue_score), has_fatigue
    
    def analyze_stress_expression(self, face_image: np.ndarray) -> Tuple[float, str]:
        if not OPENCV_AVAILABLE:
            return 0.3, "neutral"
        
        gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        stress_score = min(1.0, edge_density * 3)
        
        h, w = gray.shape
        brow_region = gray[:h//3, :]
        brow_variance = np.var(brow_region)
        
        if brow_variance > 2000:
            stress_score = min(1.0, stress_score + 0.2)
        
        if stress_score > 0.6:
            expression = "stressed"
        elif stress_score > 0.4:
            expression = "tense"
        else:
            expression = "neutral"
        
        return float(stress_score), expression
    
    def analyze_breathing_motion(self, current_frame: np.ndarray, 
                                  previous_frame: np.ndarray = None) -> Tuple[float, bool]:
        if previous_frame is None or not OPENCV_AVAILABLE:
            gray = cv2.cvtColor(current_frame, cv2.COLOR_RGB2GRAY)
            variance = np.var(gray)
            breathing_score = min(1.0, variance / 5000)
            return float(breathing_score), breathing_score > 0.5
        
        prev_gray = cv2.cvtColor(previous_frame, cv2.COLOR_RGB2GRAY)
        curr_gray = cv2.cvtColor(current_frame, cv2.COLOR_RGB2GRAY)
        diff = cv2.absdiff(prev_gray, curr_gray)
        motion_score = np.mean(diff) / 255.0
        rapid_breathing = 0.15 < motion_score < 0.5
        
        return float(min(1.0, motion_score * 3)), rapid_breathing
    
    def calculate_visual_severity(self, analysis_results: Dict) -> Dict:
        weights = {
            'pallor': 2.0,
            'cyanosis': 2.5,
            'fatigue': 1.5,
            'stress': 1.0,
            'breathing': 2.0
        }
        
        total_weight = sum(weights.values())
        
        weighted_sum = (
            analysis_results['pallor_score'] * weights['pallor'] +
            analysis_results['cyanosis_score'] * weights['cyanosis'] +
            analysis_results['fatigue_score'] * weights['fatigue'] +
            analysis_results['stress_score'] * weights['stress'] +
            analysis_results['breathing_score'] * weights['breathing']
        )
        
        visual_severity = (weighted_sum / total_weight) * 10
        
        critical_signs = sum([
            analysis_results['is_pale'],
            analysis_results['has_cyanosis'],
            analysis_results['rapid_breathing']
        ])
        
        if critical_signs >= 2:
            visual_severity = min(10, visual_severity * 1.3)
        
        return {
            'visual_severity_score': round(visual_severity, 1),
            'health_stability_score': max(0, round(100 - (visual_severity * 9))),
            'raw_scores': {
                'pallor': round(analysis_results['pallor_score'], 2),
                'cyanosis': round(analysis_results['cyanosis_score'], 2),
                'fatigue': round(analysis_results['fatigue_score'], 2),
                'stress': round(analysis_results['stress_score'], 2),
                'breathing': round(analysis_results['breathing_score'], 2)
            }
        }
    
    def get_risk_level(self, severity_score: float) -> str:
        if severity_score <= self.STABLE_THRESHOLD:
            return "Stable"
        elif severity_score <= self.MONITOR_THRESHOLD:
            return "Monitor"
        else:
            return "High Risk"
    
    def get_detected_signs(self, analysis_results: Dict) -> List[str]:
        signs = []
        
        if analysis_results['is_pale']:
            signs.append("pale_skin")
        if analysis_results['has_cyanosis']:
            signs.append("lip_discoloration")
        if analysis_results['has_fatigue']:
            signs.append("eye_fatigue")
        if analysis_results['stress_expression'] in ['stressed', 'tense']:
            signs.append("stress_expression")
        if analysis_results['rapid_breathing']:
            signs.append("rapid_breathing")
        
        return signs
    
    def get_recommendation(self, risk_level: str, detected_signs: List[str]) -> str:
        if risk_level == "High Risk":
            return "Immediate medical consultation recommended. Multiple visual distress indicators detected."
        elif risk_level == "Monitor":
            signs_text = ", ".join(detected_signs) if detected_signs else "mild symptoms"
            return f"Please observe symptoms ({signs_text}) and consult a doctor if they persist or worsen."
        else:
            return "Visual indicators appear stable. Continue normal monitoring and maintain healthy habits."
    
    def analyze_face(self, base64_image: str, previous_frame: np.ndarray = None) -> Dict[str, Any]:
        if not NUMPY_AVAILABLE:
            return {
                'error': 'Face analysis dependencies not available',
                'visual_severity_score': 0,
                'health_stability_score': 100,
                'risk_level': 'Unknown',
                'detected_signs': [],
                'recommendation': 'Please install required dependencies'
            }
        
        try:
            image = self.decode_base64_image(base64_image)
            face_found, face_data = self.detect_face(image)
            
            if not face_found:
                return {
                    'error': 'No face detected. Please ensure your face is clearly visible.',
                    'face_detected': False,
                    'visual_severity_score': 0,
                    'health_stability_score': 100,
                    'risk_level': 'Unknown',
                    'detected_signs': [],
                    'recommendation': 'Position your face in the center of the frame with good lighting.'
                }
            
            face_image = face_data['face_image']
            eyes = self.detect_eyes(face_image)
            
            pallor_score, is_pale = self.analyze_skin_pallor(face_image)
            cyanosis_score, has_cyanosis = self.analyze_lip_color(face_image)
            fatigue_score, has_fatigue = self.analyze_eye_fatigue(face_image, eyes)
            stress_score, stress_expression = self.analyze_stress_expression(face_image)
            breathing_score, rapid_breathing = self.analyze_breathing_motion(
                face_image, previous_frame
            )
            
            analysis_results = {
                'pallor_score': pallor_score,
                'is_pale': is_pale,
                'cyanosis_score': cyanosis_score,
                'has_cyanosis': has_cyanosis,
                'fatigue_score': fatigue_score,
                'has_fatigue': has_fatigue,
                'stress_score': stress_score,
                'stress_expression': stress_expression,
                'breathing_score': breathing_score,
                'rapid_breathing': rapid_breathing
            }
            
            severity_data = self.calculate_visual_severity(analysis_results)
            risk_level = self.get_risk_level(severity_data['visual_severity_score'])
            detected_signs = self.get_detected_signs(analysis_results)
            recommendation = self.get_recommendation(risk_level, detected_signs)
            
            return {
                'face_detected': True,
                'visual_severity_score': severity_data['visual_severity_score'],
                'health_stability_score': severity_data['health_stability_score'],
                'risk_level': risk_level,
                'detected_signs': detected_signs,
                'recommendation': recommendation,
                'analysis_details': severity_data['raw_scores'],
                'face_location': {
                    'x': face_data['x'],
                    'y': face_data['y'],
                    'width': face_data['w'],
                    'height': face_data['h']
                }
            }
            
        except ValueError as e:
            return {
                'error': str(e),
                'face_detected': False,
                'visual_severity_score': 0,
                'health_stability_score': 100,
                'risk_level': 'Unknown',
                'detected_signs': [],
                'recommendation': 'Please try again with a clearer image.'
            }
        except Exception as e:
            logger.error(f"Face analysis failed: {e}")
            return {
                'error': 'Analysis failed. Please try again.',
                'face_detected': False,
                'visual_severity_score': 0,
                'health_stability_score': 100,
                'risk_level': 'Unknown',
                'detected_signs': [],
                'recommendation': 'An error occurred during analysis.'
            }


face_analyzer = FaceAnalysisService()


def analyze_face_severity(base64_image: str) -> Dict[str, Any]:
    return face_analyzer.analyze_face(base64_image)
