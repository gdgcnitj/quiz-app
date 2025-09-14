# API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Optional additional context"
}
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `username`: 3-20 characters, required
- `email`: Valid email format, required
- `password`: Minimum 6 characters, required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "student",
      "$createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
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
      "username": "johndoe", 
      "email": "john@example.com",
      "role": "student",
      "$createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

### POST /auth/admin-login
Admin login with additional admin key verification.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword",
  "adminKey": "your_admin_secret_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "admin_id",
      "username": "admin",
      "email": "admin@example.com", 
      "role": "admin",
      "$createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "admin_jwt_token_here"
  },
  "message": "Admin login successful"
}
```

### GET /auth/verify
Verify JWT token validity and get user info.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "$id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "student", 
      "$createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Token verified"
}
```

### POST /auth/logout
Logout user (client-side token removal).

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

## Admin Question Management

All admin endpoints require admin authentication.

### GET /admin/questions
Get all active questions.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "question_id",
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": 2,
      "timeLimit": 60,
      "isActive": true,
      "createdBy": "admin_id",
      "$createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /admin/questions
Create a new question.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "text": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correctAnswer": 2,
  "timeLimit": 60
}
```

**Validation:**
- `text`: 10-1000 characters, required
- `options`: Array of 2-6 strings, each 1-200 characters, required
- `correctAnswer`: Integer, must be valid index of options array, required
- `timeLimit`: Integer, 10-300 seconds, defaults to 60

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "new_question_id",
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "timeLimit": 60,
    "isActive": true,
    "createdBy": "admin_id",
    "$createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Question created successfully"
}
```

### GET /admin/questions/:id
Get a specific question by ID.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "question_id",
    "text": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "timeLimit": 60,
    "isActive": true,
    "createdBy": "admin_id", 
    "$createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Question retrieved successfully"
}
```

### PUT /admin/questions/:id
Update an existing question.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:** (all fields optional)
```json
{
  "text": "Updated question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 1,
  "timeLimit": 45,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "question_id",
    "text": "Updated question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 1,
    "timeLimit": 45,
    "isActive": true,
    "createdBy": "admin_id",
    "$createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Question updated successfully"
}
```

### DELETE /admin/questions/:id
Delete a question.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Question deleted successfully"
}
```

## Quiz Management

### POST /admin/quiz/start
Start a new quiz session.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "adminId": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz started successfully"
}
```

### POST /admin/quiz/stop
Stop the current quiz session.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz stopped successfully"
}
```

## Public Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### GET /quiz/current
Get current quiz session status.

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "currentQuestionId": "question_id_or_null",
    "participantCount": 5
  }
}
```

## Error Codes

### 400 Bad Request
- Invalid request body
- Validation errors
- Missing required fields

### 401 Unauthorized  
- Missing authentication token
- Invalid credentials
- Token expired

### 403 Forbidden
- Insufficient permissions
- Admin access required
- Invalid admin key

### 404 Not Found
- Resource not found
- Invalid question ID
- Route not found

### 429 Too Many Requests
- Rate limit exceeded
- Try again later

### 500 Internal Server Error
- Database connection issues
- Unexpected server errors
- Appwrite service errors

## Rate Limiting

- **Global limit**: 100 requests per 15 minutes per IP
- **Authentication**: No additional limits
- **Admin operations**: No additional limits

## WebSocket Events

See the backend README for detailed Socket.io event documentation.

## Examples

### Complete User Registration Flow
```bash
# 1. Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'

# 3. Verify token (use token from login response)
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Question Management Flow
```bash
# 1. Admin login
curl -X POST http://localhost:3001/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword", 
    "adminKey": "your_admin_secret_key"
  }'

# 2. Create question (use admin token)
curl -X POST http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1,
    "timeLimit": 30
  }'

# 3. Get all questions
curl -X GET http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```
