# MediTriage – AI Health Core: Complete Setup Guide

## Quick Start (Hackathon Mode — SQLite, 5 minutes)

### 1. Backend Setup

```powershell
# From the project root
cd meditriage_backend

# Install dependencies (use the project venv)
..\.venv\Scripts\pip install -r requirements.txt

# Run database migrations
..\.venv\Scripts\python manage.py makemigrations api
..\.venv\Scripts\python manage.py migrate

# Start Django server (port 8000)
..\.venv\Scripts\python manage.py runserver
```

### 2. Frontend Setup

```powershell
# From the project root (new terminal)
cd frontend

# Install npm packages (first time only)
npm install

# Start Vite dev server (port 5173)
npm run dev
```

### 3. Open the App

Visit: **http://localhost:5173**

---

## Environment Configuration

The backend `.env` file is at `meditriage_backend/.env`.

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | insecure dev key |
| `DEBUG` | Debug mode | `True` |
| `LLM_PROVIDER` | `groq` or `openai` | `groq` |
| `GROQ_API_KEY` | Groq API key (free) | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `USE_POSTGRES` | Switch to PostgreSQL | `False` |
| `DB_NAME` | PostgreSQL DB name | `meditriage` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | — |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |

### Getting a Free Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up / sign in
3. Go to **API Keys** → **Create API Key**
4. Paste the key into `meditriage_backend/.env` as `GROQ_API_KEY=gsk_...`

---

## API Reference

### POST /api/chat/

**Request:**
```json
{
  "message": "I have chest pain and difficulty breathing for 2 hours",
  "history": [
    { "role": "user",      "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ]
}
```

**Response (success):**
```json
{
  "triage_score": 9,
  "health_stability_score": 28,
  "risk_level": "High Risk",
  "medical_advice": "Your symptoms are consistent with a potential cardiac or pulmonary emergency. Please seek immediate medical attention or call emergency services (108/911) right away.",
  "detected_symptoms": ["chest pain", "breathing difficulty"],
  "recommended_action": "Emergency room immediately"
}
```

**Response (API error):**
```json
{
  "error": "AI assistant is temporarily unavailable. Please try again."
}
```

### GET /api/health/

Liveness probe for monitoring tools.

**Response:**
```json
{
  "status": "ok",
  "service": "MediTriage AI Health Core",
  "version": "2.0.0"
}
```

---

## Risk Scoring Logic

| Triage Score | Risk Level | Health Stability | Color |
|---|---|---|---|
| 0 – 3 | Stable | 76 – 100 | 🟢 Green |
| 4 – 6 | Monitor | 52 – 68 | 🟡 Yellow |
| 7 – 10 | High Risk | 0 – 44 | 🔴 Red |

`health_stability_score = max(0, 100 - triage_score × 8)`

---

## Project Architecture

```
MediTriage-AI/
├── meditriage_backend/          # Django backend
│   ├── api/
│   │   ├── services/
│   │   │   └── ai_service.py   # Core AI engine (extend here for Phase 2/3)
│   │   ├── models.py           # DB schema (ChatSession, TriageRecord, stubs)
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # Request validation
│   │   └── urls.py             # Route definitions
│   ├── meditriage_backend/
│   │   ├── settings.py         # Production-ready Django config
│   │   └── urls.py             # Root URL conf
│   ├── .env                    # Your secret keys (git-ignored)
│   ├── .env.example            # Template (safe to commit)
│   └── requirements.txt
│
└── frontend/                    # React + Vite frontend
    ├── src/
    │   ├── pages/
    │   │   └── ChatPage.jsx    # AI triage chat + dashboard
    │   ├── services/
    │   │   ├── api.js          # Axios instance + interceptors
    │   │   └── chatService.js  # Chat API calls
    │   └── index.css           # Design system
    ├── vite.config.js          # Proxy: /api → localhost:8000
    └── package.json
```

---

## Switching to PostgreSQL

1. Install PostgreSQL and create a database:
   ```sql
   CREATE DATABASE meditriage;
   ```

2. Update `meditriage_backend/.env`:
   ```
   USE_POSTGRES=True
   DB_NAME=meditriage
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. Run migrations:
   ```powershell
   ..\.venv\Scripts\python manage.py migrate
   ```

---

## Future Roadmap (Phase 2 / 3)

All future modules have stubs in `ai_service.py` and `models.py`:

| Phase | Module | Hook |
|---|---|---|
| 2 | Facial Stress Detection | `AIService.facial_verification_score()` |
| 2 | Vocal Stress Analysis | `AIService.stress_detection_score()` |
| 3 | Medication Optimizer | `AIService.medication_optimizer()` |
| 3 | Regional Risk Heatmap | `AIService.risk_heatmap_data()` |

---

## Emergency Numbers

- **India**: 108 (Ambulance) / 102 (EMRI)
- **US/Canada**: 911
- **UK**: 999 / 112

---

## Face Recognition Module Setup

The Face Recognition module allows patients to log in securely using facial recognition instead of username/password.

### Prerequisites

1. **Webcam**: Required for face capture
2. **Python 3.9+**: Required for TensorFlow/DeepFace
3. **Sufficient RAM**: At least 4GB recommended for face embedding extraction

### Installation

```powershell
# Install face recognition dependencies
cd meditriage_backend
..\.venv\Scripts\pip install deepface tensorflow opencv-python Pillow numpy
```

> **Note**: First run will download the FaceNet model (~100MB). This is a one-time download.

### API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register-face/` | Required | Register face (3-5 samples) |
| POST | `/api/auth/verify-face/` | None | Login with face |
| GET | `/api/auth/check-face-registration/` | Required | Check if face is registered |
| DELETE | `/api/auth/delete-face/` | Required | Remove face registration |

### Register Face API

**Request:**
```json
{
  "face_samples": [
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4BBR...",
    "data:image/jpeg;base64,/9j/4CCS..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face registered successfully",
  "samples_processed": 5
}
```

### Verify Face API

**Request:**
```json
{
  "face_image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response (Success):**
```json
{
  "match": true,
  "patient_id": "uuid-string",
  "confidence": 0.87,
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "access_token": "auth-token-string"
}
```

**Response (No Match):**
```json
{
  "match": false,
  "confidence": 0.45,
  "error": "Face not recognized. Please try again or use manual login.",
  "attempts_remaining": 4
}
```

### Security Features

| Feature | Description |
|---|---|
| **No Image Storage** | Only 128-dimensional embeddings are stored |
| **Rate Limiting** | Max 5 attempts per 5 minutes per IP |
| **Threshold** | Minimum 75% cosine similarity required |
| **Encryption** | All API calls should use HTTPS in production |

### Frontend Routes

| Route | Description | Auth |
|---|---|---|
| `/face-recognition` | Face login page | Public |
| `/face-registration` | Register face (after login) | Protected |

### Troubleshooting

**"No face detected" error:**
- Ensure good lighting on your face
- Face the camera directly
- Remove glasses if possible
- Keep a neutral expression

**"Module not found: deepface" error:**
```powershell
..\.venv\Scripts\pip install deepface --upgrade
```

**"TensorFlow not found" error:**
```powershell
..\.venv\Scripts\pip install tensorflow>=2.13.0
```

**Slow first request:**
- Normal! First request downloads the FaceNet model (~100MB)
- Subsequent requests are much faster

### Database Migration

If you added the module to an existing installation, run:

```powershell
..\.venv\Scripts\python manage.py makemigrations accounts
..\.venv\Scripts\python manage.py migrate
```

> The `face_embedding` field (JSONField) is already part of the Patient model.

