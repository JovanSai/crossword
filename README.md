# Crossword Game - No Authentication Version

This is a standalone version of the crossword game with all authentication and login features removed.

## Project Structure
- `backend/` - Django backend API
- `frontend/` - React frontend application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd D:\deploy\backend
```

2. Create a virtual environment (if not exists):
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run database migrations:
```bash
python manage.py migrate
```

5. Start the backend server:
```bash
python manage.py runserver
```

The backend will run on `http://127.0.0.1:8000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd D:\deploy\frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Game Features

- **Crossword Puzzles**: Play multiple rounds of crossword puzzles
- **Leaderboard**: View top scores and rankings
- **Analytics**: Track your game statistics and performance
- **Wallet**: Manage in-game currency for hints
- **Score Tracking**: See your scores after each round

## API Endpoints

- `GET /api/crossword/puzzle/<puzzle_id>` - Get puzzle data
- `POST /api/crossword/submit` - Submit puzzle answers
- `GET /api/crossword/leaderboard` - Get leaderboard
- `GET /api/crossword/leaderboard/search` - Search leaderboard
- `GET /api/crossword/analytics` - Get analytics data
- `GET /api/crossword/game-history` - Get game history

## Changes from Original

All authentication features have been removed:
- No login/registration pages
- No user authentication required
- Direct access to game from home page
- Logout buttons navigate back to home page
- All API endpoints are public

## Notes

- The game starts directly from the home page at `/home`
- No user accounts or login required
- All game data is stored anonymously
- Perfect for demo or public deployment
