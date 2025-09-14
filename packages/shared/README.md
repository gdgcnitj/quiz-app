# Shared Types and Utilities

This package contains shared TypeScript types and utility functions used across the Quiz App monorepo.

## Installation

This package is automatically linked within the monorepo. To build:

```bash
npm run build
```

## Exports

### Types
- `User` - User account information
- `Question` - Quiz question structure  
- `QuizSession` - Quiz session data
- `UserResponse` - User answer submission
- `LeaderboardEntry` - Scoring information
- `ServerToClientEvents` - Socket.io server events
- `ClientToServerEvents` - Socket.io client events
- `ApiResponse` - Standard API response format

### Utilities
- `validateEmail()` - Email format validation
- `validatePassword()` - Password strength validation
- `validateUsername()` - Username format validation
- `formatTime()` - Time formatting utility
- `calculateScore()` - Score calculation logic
- `createSuccessResponse()` - API success response helper
- `createErrorResponse()` - API error response helper

### Constants
- `CONSTANTS` - Application constants like time limits, validation rules

## Usage

```typescript
import { User, Question, createSuccessResponse } from '@quiz-app/shared';

const user: User = {
  $id: '123',
  username: 'john',
  email: 'john@example.com', 
  role: 'student',
  $createdAt: new Date().toISOString()
};

const response = createSuccessResponse(user, 'User retrieved');
```
