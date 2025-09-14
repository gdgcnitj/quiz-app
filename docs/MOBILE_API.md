# Quiz App Mobile API Guide

## Base URL
```
http://localhost:3001
```

## Authentication

### 1. Student Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "student123",
  "email": "student@example.com", 
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "user_id",
      "username": "student123",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Student Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "user_id",
      "username": "student123",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "user_id",
      "username": "student123",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

## Quiz Participation

### 4. Get Current Quiz Session
```http
GET /api/quiz/current
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "$id": "session_id",
      "startTime": "2025-09-14T12:00:00.000Z",
      "createdBy": "admin_id",
      "isActive": true
    },
    "currentQuestion": {
      "$id": "question_id",
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "timeLimit": 30
    }
  }
}
```

### 5. Submit Answer
```http
POST /api/quiz/answer
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "questionId": "question_id",
  "selectedAnswer": 2,
  "responseTime": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": 2,
    "score": 100
  }
}
```

### 6. Get Leaderboard
```http
GET /api/quiz/leaderboard
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_id",
      "username": "student123",
      "totalScore": 250,
      "correctAnswers": 5,
      "averageResponseTime": 12.5
    }
  ]
}
```

## WebSocket Events (for real-time updates)

### Connect to Socket.io
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'jwt_token_here'
  }
});

// Join quiz room
socket.emit('join-quiz');
```

### Listen for Events
```javascript
// Quiz started
socket.on('quiz-started', (session) => {
  console.log('Quiz started:', session);
});

// New question
socket.on('question-broadcast', (question) => {
  console.log('New question:', question);
  // question.text, question.options, question.timeLimit
});

// Quiz ended
socket.on('quiz-ended', (sessionId) => {
  console.log('Quiz ended:', sessionId);
});

// Leaderboard update
socket.on('leaderboard-update', (leaderboard) => {
  console.log('Updated leaderboard:', leaderboard);
});
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Example Mobile App Flow

1. **App Start**: User registers/logs in → Store JWT token
2. **Join Quiz**: Connect to WebSocket → Join quiz room
3. **Wait for Quiz**: Listen for `quiz-started` event
4. **Answer Questions**: Listen for `question-broadcast` → Show question → Submit answer
5. **View Results**: Get leaderboard → Show final scores

## Testing with cURL

```bash
# Register student
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_student","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current quiz (use token from login response)
curl -X GET http://localhost:3001/api/quiz/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes for Mobile Developer

1. **Store JWT Token**: Save the token securely (Keychain/Keystore) for persistent login
2. **WebSocket Connection**: Maintain socket connection for real-time updates
3. **Error Handling**: Always check `success` field in responses
4. **Timer Logic**: Implement client-side countdown for questions using `timeLimit`
5. **Offline Support**: Cache questions/answers and sync when connection restored
6. **UI States**: Handle loading, error, and success states for all API calls
