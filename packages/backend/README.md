# Quiz App Backend

Real-time quiz application backend with Socket.io and Appwrite integration.

## Features

- **Authentication**: User registration, login, and admin access
- **Real-time Quiz**: Socket.io powered live quiz sessions
- **Question Management**: CRUD operations for quiz questions
- **Leaderboard**: Live scoring and rankings
- **Admin Dashboard**: Quiz control and management

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your environment variables (see setup guide below)

4. Start development server:
```bash
npm run dev
```

The server will start on http://localhost:3001

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Appwrite Configuration (see Appwrite setup guide)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Database Collections
APPWRITE_DATABASE_ID=quiz_app_db
APPWRITE_USERS_COLLECTION_ID=users
APPWRITE_QUESTIONS_COLLECTION_ID=questions
APPWRITE_SESSIONS_COLLECTION_ID=quiz_sessions
APPWRITE_RESPONSES_COLLECTION_ID=user_responses
APPWRITE_LEADERBOARD_COLLECTION_ID=leaderboard

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# Admin Configuration
ADMIN_SECRET_KEY=your_admin_secret_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Login
```
POST /api/auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword",
  "adminKey": "your_admin_secret_key"
}
```

#### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <jwt_token>
```

### Admin Endpoints (Require Admin Authentication)

#### Get All Questions
```
GET /api/admin/questions
Authorization: Bearer <admin_jwt_token>
```

#### Create Question
```
POST /api/admin/questions
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "text": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correctAnswer": 2,
  "timeLimit": 60
}
```

#### Update Question
```
PUT /api/admin/questions/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "text": "Updated question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 1,
  "timeLimit": 45
}
```

#### Delete Question
```
DELETE /api/admin/questions/:id
Authorization: Bearer <admin_jwt_token>
```

#### Start Quiz
```
POST /api/admin/quiz/start
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "adminId": "admin_user_id"
}
```

#### Stop Quiz
```
POST /api/admin/quiz/stop
Authorization: Bearer <admin_jwt_token>
```

### Public Endpoints

#### Health Check
```
GET /health
```

#### Get Current Quiz Status
```
GET /api/quiz/current
```

## Socket.io Events

### Client to Server Events

#### Join Quiz
```javascript
socket.emit('join-quiz', userId);
```

#### Submit Answer
```javascript
socket.emit('submit-answer', {
  questionId: 'question_id',
  selectedAnswer: 2,
  responseTime: 15000 // milliseconds
});
```

#### Admin Join
```javascript
socket.emit('admin-join', adminId);
```

#### Force Next Question (Admin only)
```javascript
socket.emit('force-next-question');
```

### Server to Client Events

#### Quiz Started
```javascript
socket.on('quiz-started', (session) => {
  console.log('Quiz started:', session);
});
```

#### New Question
```javascript
socket.on('new-question', (question) => {
  console.log('New question:', question);
  // Note: question.correctAnswer is not included
});
```

#### Question Ended
```javascript
socket.on('question-ended', (questionId) => {
  console.log('Question ended:', questionId);
});
```

#### Leaderboard Update
```javascript
socket.on('leaderboard-update', (leaderboard) => {
  console.log('Updated leaderboard:', leaderboard);
});
```

#### Quiz Ended
```javascript
socket.on('quiz-ended', (sessionId) => {
  console.log('Quiz ended:', sessionId);
});
```

#### Error
```javascript
socket.on('error', (message) => {
  console.error('Socket error:', message);
});
```

## Database Schema

The backend uses Appwrite with the following collections:

### Users Collection
- `username` (string): User's display name
- `email` (string): User's email address
- `role` (string): 'student' or 'admin'

### Questions Collection
- `text` (string): Question text
- `options` (array): Array of answer options
- `correctAnswer` (integer): Index of correct answer
- `timeLimit` (integer): Time limit in seconds
- `isActive` (boolean): Whether question is active
- `createdBy` (string): ID of user who created question

### Quiz Sessions Collection
- `currentQuestionId` (string): Current active question
- `startTime` (datetime): Session start time
- `isActive` (boolean): Whether session is active
- `createdBy` (string): ID of admin who started session

### User Responses Collection
- `userId` (string): ID of user who responded
- `sessionId` (string): ID of quiz session
- `questionId` (string): ID of question answered
- `selectedAnswer` (integer): Index of selected answer
- `isCorrect` (boolean): Whether answer was correct
- `responseTime` (integer): Response time in milliseconds

### Leaderboard Collection
- `userId` (string): User ID
- `username` (string): User's display name
- `sessionId` (string): Quiz session ID
- `totalScore` (integer): Calculated total score
- `correctAnswers` (integer): Number of correct answers
- `averageResponseTime` (float): Average response time

## Development

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run clean` - Clean build directory

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── routes/           # API routes
├── services/         # Business logic services
├── socket/           # Socket.io handlers
├── utils/            # Utility functions
└── index.ts          # Application entry point
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Ensure Appwrite credentials are correct
2. **Socket Connection Failed**: Check CORS origins configuration
3. **Authentication Failed**: Verify JWT secret is set correctly
4. **Questions Not Loading**: Ensure questions collection exists and has data

### Logs

Application logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console output in development mode
