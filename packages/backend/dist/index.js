"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const config_1 = require("./config");
const appwrite_1 = require("./services/appwrite");
const socket_1 = require("./socket");
const logger_1 = require("./utils/logger");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const quiz_1 = __importDefault(require("./routes/quiz"));
// Validate configuration
(0, config_1.validateConfig)();
// Create Express app
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialize Socket.io
const socketService = new socket_1.SocketService(server);
exports.socketService = socketService;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.cors.allowedOrigins,
    credentials: true
}));
// Rate limiting (disabled in development)
if (config_1.config.server.nodeEnv === 'production') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config_1.config.server.nodeEnv
    });
});
// Quiz status endpoint (must be before the router)
app.get('/api/quiz/current', (req, res) => {
    const quizState = socketService.getQuizState();
    const responseData = {
        isActive: !!quizState.currentSessionId,
        currentSessionId: quizState.currentSessionId,
        currentQuestionId: quizState.currentQuestionId,
        questionStartTime: quizState.questionStartTime,
        participantCount: quizState.participants.size
    };
    // Debug logging
    console.log('Quiz status requested:', responseData);
    res.json({
        success: true,
        data: responseData
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/quiz', quiz_1.default);
// Start quiz endpoint (admin only)
app.post('/api/admin/quiz/start', async (req, res) => {
    try {
        // You would add authentication middleware here
        const adminId = req.body.adminId; // This should come from authenticated user
        await socketService.startQuiz(adminId);
        res.json({ success: true, message: 'Quiz started successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Stop quiz endpoint (admin only)
app.post('/api/admin/quiz/stop', async (req, res) => {
    try {
        await socketService.stopQuiz();
        res.json({ success: true, message: 'Quiz stopped successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: config_1.config.server.nodeEnv === 'development' ? err.message : undefined
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
// Initialize database and start server
const startServer = async () => {
    try {
        logger_1.logger.info('Initializing Appwrite database...');
        await appwrite_1.appwriteService.initializeDatabase();
        server.listen(config_1.config.server.port, () => {
            logger_1.logger.info(`Server running on port ${config_1.config.server.port}`);
            logger_1.logger.info(`Environment: ${config_1.config.server.nodeEnv}`);
            logger_1.logger.info(`CORS origins: ${config_1.config.cors.allowedOrigins.join(', ')}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
startServer();
