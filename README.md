<<<<<<< HEAD
# MediTriage-AI: Smart Conversational Patient Query & Appointment System

A full-stack healthcare web application that uses conversational AI to triage patients and manage appointments.

## Features

- 🔐 **Authentication**: Secure JWT-based login/signup
- 💬 **Conversational Chat**: WhatsApp-style symptom collection
- 🏥 **Smart Triage**: Rule-based risk scoring system
- 📅 **Appointment Booking**: Doctor matching and scheduling
- 🚨 **Emergency Detection**: Priority handling for critical cases

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Axios
- **Backend**: Python Flask, JWT Authentication
- **Database**: PostgreSQL (SQLite for development)
- **NLP**: Keyword extraction and intent classification

## Project Structure

```
MediTriage-AI/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── context/         # React context providers
│   └── package.json
├── backend/                  # Flask API
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── config.py
│   └── requirements.txt
└── README.md
```

## Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/profile | Get user profile |
| POST | /api/chat/message | Send chat message |
| GET | /api/chat/history | Get chat history |
| GET | /api/doctors | List doctors |
| POST | /api/appointments | Book appointment |
| GET | /api/appointments | Get user appointments |

## Triage Logic

Risk scoring system:
- Fever > 102°F → +2 points
- Duration > 3 days → +2 points
- Breathing difficulty → +3 points
- Chest pain → +4 points
- Severe pain (4-5) → +2 points

Classification:
- Score ≤ 3 → Query Phase (basic advice)
- Score 4-6 → Appointment Phase (schedule visit)
- Score > 6 → Emergency Phase (immediate attention)

## License

MIT License - Built for Hackathon
=======
# MediTriage-AI
>>>>>>> 3ada8e2293c0b9ca2eb743cdd65a1700c18f3014
