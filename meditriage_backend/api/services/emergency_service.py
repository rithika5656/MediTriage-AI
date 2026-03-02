import uuid
import random
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

HOSPITALS = [
    {
        "id": "HOSP001",
        "name": "City Medical Center",
        "address": "123 Healthcare Ave, Downtown",
        "ambulances_available": 5,
        "lat": 11.0180,
        "lng": 76.9600,
    },
    {
        "id": "HOSP002",
        "name": "Apollo Emergency Hospital",
        "address": "456 Medical Lane, Central District",
        "ambulances_available": 3,
        "lat": 11.0250,
        "lng": 76.9450,
    },
    {
        "id": "HOSP003",
        "name": "Life Care Hospital",
        "address": "789 Emergency Road, North Zone",
        "ambulances_available": 4,
        "lat": 11.0320,
        "lng": 76.9700,
    },
    {
        "id": "HOSP004",
        "name": "Metro Health Center",
        "address": "321 Wellness Street, South Area",
        "ambulances_available": 6,
        "lat": 11.0050,
        "lng": 76.9520,
    },
    {
        "id": "HOSP005",
        "name": "National Emergency Care",
        "address": "555 Trauma Center, East District",
        "ambulances_available": 8,
        "lat": 11.0200,
        "lng": 76.9800,
    },
]


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat_diff = abs(lat1 - lat2) * 111
    lng_diff = abs(lng1 - lng2) * 85
    return (lat_diff ** 2 + lng_diff ** 2) ** 0.5


def find_nearest_hospital(lat: float, lng: float) -> dict:
    available_hospitals = [h for h in HOSPITALS if h["ambulances_available"] > 0]
    
    if not available_hospitals:
        return HOSPITALS[0]
    
    nearest = min(
        available_hospitals,
        key=lambda h: calculate_distance(lat, lng, h["lat"], h["lng"])
    )
    
    return nearest


def estimate_arrival_time(distance_km: float) -> int:
    base_time = (distance_km / 40) * 60
    traffic_factor = random.uniform(1.0, 1.5)
    dispatch_time = 2
    
    return max(5, int(base_time * traffic_factor + dispatch_time))


def generate_request_id() -> str:
    return f"EMG{random.randint(10000, 99999)}"


def validate_phone_number(phone: str) -> tuple:
    if not phone:
        return False, None, "Phone number is required"
    
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    if cleaned.startswith('+'):
        if len(cleaned) < 10 or len(cleaned) > 15:
            return False, None, "Invalid international phone number"
    else:
        if len(cleaned) < 10:
            return False, None, "Phone number must be at least 10 digits"
        if len(cleaned) > 15:
            return False, None, "Phone number is too long"
    
    return True, cleaned, None


class EmergencyService:
    active_requests = {}
    
    @classmethod
    def process_emergency_request(cls, phone_number: str, location: dict) -> dict:
        is_valid, cleaned_phone, error = validate_phone_number(phone_number)
        if not is_valid:
            return {
                "success": False,
                "error": error
            }
        
        lat = location.get('lat')
        lng = location.get('lng')
        
        if lat is None or lng is None:
            return {
                "success": False,
                "error": "Location coordinates are required"
            }
        
        try:
            lat = float(lat)
            lng = float(lng)
        except (TypeError, ValueError):
            return {
                "success": False,
                "error": "Invalid location coordinates"
            }
        
        nearest_hospital = find_nearest_hospital(lat, lng)
        distance = calculate_distance(lat, lng, nearest_hospital["lat"], nearest_hospital["lng"])
        eta_minutes = estimate_arrival_time(distance)
        request_id = generate_request_id()
        
        request_data = {
            "request_id": request_id,
            "phone_number": cleaned_phone,
            "location": {"lat": lat, "lng": lng},
            "hospital": nearest_hospital["name"],
            "hospital_id": nearest_hospital["id"],
            "hospital_address": nearest_hospital["address"],
            "estimated_arrival": eta_minutes,
            "distance_km": round(distance, 2),
            "status": "dispatched",
            "created_at": datetime.now().isoformat(),
        }
        
        cls.active_requests[request_id] = request_data
        logger.info(f"Emergency request {request_id} dispatched to {nearest_hospital['name']}")
        
        return {
            "success": True,
            "status": "Ambulance Dispatched",
            "request_id": request_id,
            "estimated_arrival": f"{eta_minutes} minutes",
            "nearest_hospital": nearest_hospital["name"],
            "hospital_address": nearest_hospital["address"],
            "distance_km": round(distance, 2),
            "contact_number": "+91 108",  # Emergency helpline
            "message": "Help is on the way. Stay calm and keep your phone accessible."
        }
    
    @classmethod
    def get_request_status(cls, request_id: str) -> dict:
        if request_id not in cls.active_requests:
            return {
                "success": False,
                "error": "Request not found"
            }
        
        request = cls.active_requests[request_id]
        return {
            "success": True,
            "request": request
        }


def process_emergency_request(phone_number: str, location: dict) -> dict:
    return EmergencyService.process_emergency_request(phone_number, location)
