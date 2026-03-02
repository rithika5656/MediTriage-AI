# MediTriage-AI

AI-powered healthcare triage platform with symptom analysis, visual health assessment, and emergency services.

## Features

- **AI Symptom Triage** - Conversational chat interface for symptom analysis with multilingual support
- **Visual Health Analysis** - Face severity detection using OpenCV for pallor, cyanosis, eye fatigue, and stress indicators
- **Emergency Ambulance** - Direct ambulance request from login page (no authentication required)
- **Smart Appointment Booking** - Doctor matching and scheduling based on triage results
- **Light/Dark Theme** - System-aware theme toggle with localStorage persistence
- **Secure Authentication** - JWT-based login with face recognition option

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Vite, TailwindCSS, Lucide Icons |
| Backend | Django REST Framework, Flask |
| AI/ML | OpenAI GPT-4o-mini, OpenCV, NumPy, Pillow |
| Database | SQLite (development), PostgreSQL (production) |
| Auth | JWT, Face Recognition |

## Project Structure

```
MediTriage-AI/
├── frontend/                    # React + Vite application
│   └── src/
│       ├── components/          # Layout, UI components
│       ├── context/             # AuthContext, ThemeContext
│       ├── pages/               # Login, Chat, FaceSeverity, etc.
│       └── services/            # API service layer
├── meditriage_backend/          # Django REST API (primary)
│   └── api/
│       ├── views.py             # Triage, Face Analysis, Emergency
│       └── services/            # AI, Vision, Emergency services
├── backend/                     # Flask API (legacy)
│   └── app/
│       ├── routes/              # Auth, Chat, Appointments
│       └── services/            # LLM, Triage logic
└── README.md
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key

### Backend (Django)

```bash
cd meditriage_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` in the project root:

```env
OPENAI_API_KEY=your_api_key_here
LLM_PROVIDER=openai
```

## API Endpoints

### Django API (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | AI triage assessment |
| POST | `/analyze-face/` | Visual health analysis |
| POST | `/emergency-direct-request/` | Ambulance dispatch (no auth) |
| GET | `/health/` | Service health check |

### Flask API (`/api/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | User registration |
| POST | `/auth/login` | User login |
| POST | `/chat/message` | Chat message |
| GET | `/doctors` | List doctors |
| POST | `/appointments` | Book appointment |

## Triage Scoring

| Indicator | Points |
|-----------|--------|
| Fever > 102°F | +2 |
| Duration > 3 days | +2 |
| Breathing difficulty | +3 |
| Chest pain | +4 |
| Severe pain (4-5) | +2 |

**Risk Levels:**
- Score ≤ 3 → Stable (basic advice)
- Score 4-6 → Monitor (schedule visit)
- Score > 6 → High Risk (immediate attention)

## Visual Health Analysis

Facial indicators analyzed:
- Skin pallor (paleness)
- Lip cyanosis (bluish tint)
- Eye fatigue/drooping
- Stress expression
- Breathing motion

Output: Visual Severity Score (0-10) with health stability percentage.

## License

MIT License
