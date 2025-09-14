# Appwrite Setup Guide

This guide will help you set up Appwrite for the Quiz App backend.

## What is Appwrite?

Appwrite is an open-source Backend-as-a-Service (BaaS) that provides:
- Database (NoSQL)
- Authentication
- Storage
- Real-time subscriptions
- Functions

For our quiz app, we use Appwrite as our primary database and authentication provider.

## Step 1: Create Appwrite Account

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a New Project

1. After logging in, click "Create Project"
2. Enter project name: `Quiz App`
3. Enter project ID: `quiz-app` (or any unique ID)
4. Select your preferred region
5. Click "Create"

## Step 3: Get Project Credentials

After creating your project, you'll need to gather the following information:

### Project ID
- Go to your project dashboard
- Copy the "Project ID" from the top of the page
- This goes in `APPWRITE_PROJECT_ID` in your .env file

### API Key
1. In your project dashboard, go to "API Keys" in the left sidebar
2. Click "Create API Key"
3. Name it: `Quiz App Backend`
4. Set scopes to include:
   - `databases.read`
   - `databases.write`
   - `users.read`
   - `users.write`
   - `collections.read`
   - `collections.write`
   - `documents.read`
   - `documents.write`
   - `attributes.read`
   - `attributes.write`
5. Click "Create"
6. Copy the generated API key
7. This goes in `APPWRITE_API_KEY` in your .env file

### Endpoint URL
- For Appwrite Cloud, use: `https://cloud.appwrite.io/v1`
- This goes in `APPWRITE_ENDPOINT` in your .env file

## Step 4: Environment Variables

Create a `.env` file in `packages/backend/` with these values:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Database Configuration
APPWRITE_DATABASE_ID=quiz_app_db
APPWRITE_USERS_COLLECTION_ID=users
APPWRITE_QUESTIONS_COLLECTION_ID=questions
APPWRITE_SESSIONS_COLLECTION_ID=quiz_sessions
APPWRITE_RESPONSES_COLLECTION_ID=user_responses
APPWRITE_LEADERBOARD_COLLECTION_ID=leaderboard

# Other required variables...
JWT_SECRET=your_super_secure_jwt_secret_here
ADMIN_SECRET_KEY=your_admin_secret_key_here
```

## Step 5: Database Auto-Setup

The Quiz App backend will automatically create the database and collections when you first start the server. The collections are:

### 1. Users Collection
Stores user information including:
- Username
- Email  
- Role (student/admin)

### 2. Questions Collection
Stores quiz questions with:
- Question text
- Multiple choice options
- Correct answer index
- Time limit
- Active status
- Creator information

### 3. Quiz Sessions Collection
Tracks active quiz sessions:
- Current question
- Start time
- Active status
- Session creator

### 4. User Responses Collection
Records user answers:
- User and session IDs
- Question answered
- Selected answer
- Correctness
- Response time

### 5. Leaderboard Collection
Maintains scoring data:
- User information
- Session scores
- Statistics

## Step 6: Test the Connection

1. Start your backend server:
```bash
cd packages/backend
npm run dev
```

2. Check the console output for:
```
✅ Configuration validated successfully
Database already exists (or) Creating database...
Collection Users already exists (or) Creating collection Users...
🚀 Server running on port 3001
```

3. Test the health endpoint:
```bash
curl http://localhost:3001/health
```

You should get a response like:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Step 7: Create Admin User (Optional)

To test admin functionality, you can create an admin user:

1. First, register a regular user through the API:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com", 
    "password": "password123"
  }'
```

2. Go to your Appwrite dashboard
3. Navigate to "Database" → "quiz_app_db" → "users" collection
4. Find your user and edit the document
5. Change the `role` field from `"student"` to `"admin"`
6. Save the changes

Now you can login as admin using:
```bash
curl -X POST http://localhost:3001/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "adminKey": "your_admin_secret_key_here"
  }'
```

## Troubleshooting

### Error: "Failed to connect to Appwrite"
- Check your `APPWRITE_ENDPOINT` URL
- Verify your internet connection
- Ensure Appwrite Cloud is accessible

### Error: "Invalid API key"
- Verify your `APPWRITE_API_KEY` is correct
- Check that the API key has the required scopes
- Make sure the API key hasn't expired

### Error: "Project not found"
- Confirm your `APPWRITE_PROJECT_ID` is correct
- Ensure the project exists in your Appwrite account

### Error: "Permission denied"
- Check that your API key has the necessary permissions
- Verify you're using the correct project ID

### Collections not created automatically
- Check the server logs for error messages
- Verify your API key has `collections.write` and `attributes.write` permissions
- Try restarting the server

## Security Notes

1. **Never commit your API keys** to version control
2. Use different API keys for development and production
3. Regularly rotate your API keys
4. Set appropriate scopes for each API key
5. Consider using Appwrite's built-in rate limiting

## Alternative: Self-Hosted Appwrite

If you prefer to self-host Appwrite:

1. Install Docker and Docker Compose
2. Run:
```bash
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.4.13
```
3. Update your `APPWRITE_ENDPOINT` to your self-hosted URL (e.g., `http://localhost/v1`)
4. Follow the same setup steps for project creation and API keys

## Next Steps

After completing Appwrite setup:
1. ✅ Appwrite configured
2. 📝 Test backend API endpoints
3. 🎯 Set up the React dashboard
4. 📱 Connect your React Native app
5. 🚀 Start building your quiz!

For more detailed Appwrite documentation, visit: [https://appwrite.io/docs](https://appwrite.io/docs)
