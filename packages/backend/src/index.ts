import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config, validateConfig } from './config';
import { appwriteService } from './services/appwrite';
import { SocketService } from './socket';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

// Validate configuration
validateConfig();

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io
const socketService = new SocketService(server);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Quiz endpoints
app.get('/api/quiz/current', (req, res) => {
  const quizState = socketService.getQuizState();
  res.json({
    success: true,
    data: {
      isActive: !!quizState.currentSessionId,
      currentQuestionId: quizState.currentQuestionId,
      participantCount: quizState.participants.size
    }
  });
});

// Start quiz endpoint (admin only)
app.post('/api/admin/quiz/start', async (req, res) => {
  try {
    // You would add authentication middleware here
    const adminId = req.body.adminId; // This should come from authenticated user
    await socketService.startQuiz(adminId);
    res.json({ success: true, message: 'Quiz started successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop quiz endpoint (admin only)
app.post('/api/admin/quiz/stop', async (req, res) => {
  try {
    await socketService.stopQuiz();
    res.json({ success: true, message: 'Quiz stopped successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined
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
    logger.info('Initializing Appwrite database...');
    await appwriteService.initializeDatabase();
    
    server.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.nodeEnv}`);
      logger.info(`🌐 CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

export { socketService };
