# Getting Started with Quiz App

This guide will walk you through setting up and running the complete Quiz App system.

## System Overview

The Quiz App consists of:
- **Backend API**: Node.js + Express + Socket.io + Appwrite
- **Admin Dashboard**: React web app for managing quizzes
- **React Native App**: Mobile client (created separately)
- **Shared Package**: Common types and utilities

## Quick Start (5 minutes)

### 1. Prerequisites
- Node.js 18+ and npm 8+
- Git
- Code editor (VS Code recommended)

### 2. Clone and Setup
```bash
git clone <your-repo-url>
cd quiz-app-back
./setup.sh    # or bash setup.sh on Windows
```

### 3. Configure Appwrite
Follow the detailed [Appwrite Setup Guide](./docs/APPWRITE_SETUP.md):
1. Create account at https://cloud.appwrite.io
2. Create new project
3. Get Project ID and API Key
4. Update `packages/backend/.env`

### 4. Start Development
```bash
npm run dev    # Starts both backend and dashboard
```

Visit:
- Backend API: http://localhost:3001/health
- Admin Dashboard: http://localhost:3000

## Detailed Setup

### Environment Configuration

Edit `packages/backend/.env`:
```env
# Required - Get from Appwrite
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Required - Generate secure random strings
JWT_SECRET=your_super_secure_jwt_secret_here
ADMIN_SECRET_KEY=your_admin_secret_key_here

# Optional - Defaults provided
PORT=3001
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Creating Admin User

1. Start the backend:
```bash
npm run dev:backend
```

2. Register a user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

3. In Appwrite Dashboard:
   - Go to Database → quiz_app_db → users collection
   - Find your user and edit
   - Change `role` from `"student"` to `"admin"`

4. Test admin login:
```bash
curl -X POST http://localhost:3001/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "adminKey": "your_admin_secret_key_here"
  }'
```

## Using the System

### Admin Workflow

1. **Login to Dashboard** at http://localhost:3000
2. **Create Questions**:
   - Click "Add Question"
   - Enter question text and options
   - Select correct answer
   - Set time limit (default 60s)

3. **Start Quiz Session**:
   - Click "Start Quiz"
   - Questions will automatically cycle every 60s
   - Monitor live leaderboard

4. **Manage Active Quiz**:
   - Skip to next question manually
   - View participant count
   - Stop quiz session

### Student Experience (via API/Mobile App)

1. **Register/Login**:
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","email":"student1@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@example.com","password":"password123"}'
```

2. **Connect to Live Quiz** (Socket.io):
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join quiz
socket.emit('join-quiz', 'user_id_from_login');

// Listen for new questions
socket.on('new-question', (question) => {
  console.log('New question:', question);
  // Display question to user
});

// Submit answer
socket.emit('submit-answer', {
  questionId: 'question_id',
  selectedAnswer: 2,
  responseTime: 15000 // milliseconds
});

// Watch leaderboard updates
socket.on('leaderboard-update', (leaderboard) => {
  console.log('Updated scores:', leaderboard);
});
```

## Development Scripts

```bash
# Root level
npm run dev              # Start both backend and dashboard
npm run build            # Build all packages
npm run install:all      # Install all dependencies

# Backend only
npm run dev:backend      # Start backend with auto-reload
npm run build:backend    # Build backend

# Dashboard only  
npm run dev:dashboard    # Start dashboard dev server
npm run build:dashboard  # Build dashboard for production

# Shared package
npm run build:shared     # Build shared types
```

## Project Structure

```
quiz-app-back/
├── packages/
│   ├── backend/           # Node.js API server
│   │   ├── src/
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── middleware/   # Auth, validation
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   ├── socket/      # Real-time events
│   │   │   └── utils/       # Helpers
│   │   └── README.md
│   │
│   ├── dashboard/         # React admin panel
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/      # Route pages
│   │   │   ├── contexts/   # React contexts
│   │   │   ├── hooks/      # Custom hooks
│   │   │   └── services/   # API calls
│   │   └── README.md
│   │
│   └── shared/           # Common types/utils
│       ├── src/
│       │   ├── types.ts    # TypeScript types
│       │   └── utils.ts    # Utility functions
│       └── README.md
│
├── docs/                 # Documentation
│   ├── APPWRITE_SETUP.md # Appwrite configuration
│   └── API.md           # API documentation
│
├── setup.sh             # Automated setup script
└── README.md            # Main documentation
```

## API Testing

Use the provided Postman collection or curl commands:

```bash
# Health check
curl http://localhost:3001/health

# Get current quiz status
curl http://localhost:3001/api/quiz/current

# Admin: Get questions (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/admin/questions
```

## Real-time Features

The system uses Socket.io for real-time updates:

### Events from Server
- `quiz-started` - New quiz session begins
- `new-question` - Next question available (every 60s)
- `question-ended` - Current question time expired
- `leaderboard-update` - Live score updates
- `quiz-ended` - Session finished

### Events to Server
- `join-quiz` - Student joins session
- `submit-answer` - Answer submission
- `admin-join` - Admin connects for control
- `force-next-question` - Admin skips question

## Database Schema (Appwrite)

Auto-created collections:
- **users**: Student/admin accounts
- **questions**: Quiz questions with options
- **quiz_sessions**: Active quiz tracking
- **user_responses**: Answer submissions
- **leaderboard**: Calculated scores

## Deployment

### Backend (Node.js)
```bash
npm run build:backend
cd packages/backend
npm start
```

### Dashboard (Static Files)
```bash
npm run build:dashboard
# Deploy packages/dashboard/dist to your hosting provider
```

## Troubleshooting

### Common Issues

**"Appwrite connection failed"**
- Check APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID
- Verify API key has correct permissions
- Ensure Appwrite project exists

**"Collections not created"**
- Check API key has `collections.write` permission
- Verify database permissions in Appwrite console
- Restart backend server

**"Socket connection failed"**
- Check CORS configuration in ALLOWED_ORIGINS
- Verify backend is running on correct port
- Check firewall/network settings

**"Admin login failed"**
- Ensure user role is set to "admin" in Appwrite
- Verify ADMIN_SECRET_KEY matches in .env
- Check user exists and password is correct

### Logs and Debugging

Backend logs:
```bash
# View logs
tail -f packages/backend/logs/combined.log

# Debug mode
DEBUG=* npm run dev:backend
```

Database inspection:
- Visit Appwrite Console
- Navigate to Database → quiz_app_db
- Inspect collections and documents

## Next Steps

1. **Connect React Native App**:
   - Use same Socket.io events
   - Implement mobile UI for questions
   - Handle real-time score updates

2. **Enhance Features**:
   - Question categories
   - Timed quiz sessions
   - Image/video questions
   - Team-based scoring

3. **Production Deployment**:
   - Set up CI/CD pipeline
   - Configure production environment
   - Add monitoring and logging
   - Implement backup strategy

## Support

- [API Documentation](./docs/API.md)
- [Backend README](./packages/backend/README.md)
- [Dashboard README](./packages/dashboard/README.md)

For issues and questions, check the documentation or create an issue in the repository.
