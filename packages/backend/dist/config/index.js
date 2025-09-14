"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    server: {
        port: parseInt(process.env.PORT || '3001'),
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    appwrite: {
        endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
        projectId: process.env.APPWRITE_PROJECT_ID || '',
        apiKey: process.env.APPWRITE_API_KEY || '',
        databaseId: process.env.APPWRITE_DATABASE_ID || 'quiz_app_db',
        collections: {
            users: process.env.APPWRITE_USERS_COLLECTION_ID || 'users',
            questions: process.env.APPWRITE_QUESTIONS_COLLECTION_ID || 'questions',
            sessions: process.env.APPWRITE_SESSIONS_COLLECTION_ID || 'quiz_sessions',
            responses: process.env.APPWRITE_RESPONSES_COLLECTION_ID || 'user_responses',
            leaderboard: process.env.APPWRITE_LEADERBOARD_COLLECTION_ID || 'leaderboard'
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    admin: {
        secretKey: process.env.ADMIN_SECRET_KEY || 'admin-secret-key'
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006']
    }
};
// Validate required environment variables
const requiredEnvVars = [
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'JWT_SECRET',
    'ADMIN_SECRET_KEY'
];
const validateConfig = () => {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:');
        missingVars.forEach(varName => console.error(`- ${varName}`));
        console.error('Please check your .env file');
        process.exit(1);
    }
    console.log('✅ Configuration validated successfully');
};
exports.validateConfig = validateConfig;
