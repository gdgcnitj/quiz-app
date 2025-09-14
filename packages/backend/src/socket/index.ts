import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { appwriteService } from '../services/appwrite';
import { authService } from '../services/auth';
import { 
  ServerToClientEvents, 
  ClientToServerEvents,
  SubmitAnswerRequest,
  calculateScore
} from '@quiz-app/shared';
import { ID, Query } from 'node-appwrite';

interface QuizState {
  currentSessionId: string | null;
  currentQuestionId: string | null;
  questionStartTime: Date | null;
  participants: Map<string, { userId: string; username: string; socketId: string }>;
}

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private quizState: QuizState = {
    currentSessionId: null,
    currentQuestionId: null,
    questionStartTime: null,
    participants: new Map()
  };

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:19006"],
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-quiz', async (userId: string) => {
        try {
          // Get user details
          const user = await appwriteService.getDocument(
            appwriteService.collections.users,
            userId
          );

          this.quizState.participants.set(userId, {
            userId,
            username: (user as any).username,
            socketId: socket.id
          });

          socket.join('quiz-room');
          logger.info(`User ${(user as any).username} joined quiz`);

          // Send current quiz state if active
          if (this.quizState.currentSessionId && this.quizState.currentQuestionId) {
            const question = await appwriteService.getDocument(
              appwriteService.collections.questions,
              this.quizState.currentQuestionId
            );

            // Send question without correct answer
            const { correctAnswer, ...questionForClient } = question as any;
            socket.emit('new-question', questionForClient as any);
          }

        } catch (error) {
          logger.error('Join quiz error:', error);
          socket.emit('error', 'Failed to join quiz');
        }
      });

      socket.on('submit-answer', async (data: SubmitAnswerRequest) => {
        try {
          const participant = Array.from(this.quizState.participants.values())
            .find(p => p.socketId === socket.id);

          if (!participant) {
            socket.emit('error', 'User not found in quiz');
            return;
          }

          // Get the question to check correct answer
          const question = await appwriteService.getDocument(
            appwriteService.collections.questions,
            data.questionId
          );

          const isCorrect = data.selectedAnswer === (question as any).correctAnswer;

          // Save user response
          await appwriteService.createDocument(
            appwriteService.collections.responses,
            {
              userId: participant.userId,
              sessionId: this.quizState.currentSessionId!,
              questionId: data.questionId,
              selectedAnswer: data.selectedAnswer,
              isCorrect,
              responseTime: data.responseTime
            },
            ID.unique()
          );

          // Update leaderboard
          await this.updateLeaderboard(participant.userId, participant.username);

          logger.info(`Answer submitted by ${participant.username}: ${isCorrect ? 'correct' : 'incorrect'}`);

        } catch (error) {
          logger.error('Submit answer error:', error);
          socket.emit('error', 'Failed to submit answer');
        }
      });

      socket.on('admin-join', async (adminId: string) => {
        try {
          const admin = await appwriteService.getDocument(
            appwriteService.collections.users,
            adminId
          );

          if ((admin as any).role !== 'admin') {
            socket.emit('error', 'Admin access required');
            return;
          }

          socket.join('admin-room');
          logger.info(`Admin ${(admin as any).username} joined`);

        } catch (error) {
          logger.error('Admin join error:', error);
          socket.emit('error', 'Failed to join as admin');
        }
      });

      socket.on('force-next-question', async () => {
        const adminSockets = await this.io.in('admin-room').fetchSockets();
        const isAdmin = adminSockets.some(s => s.id === socket.id);

        if (!isAdmin) {
          socket.emit('error', 'Admin access required');
          return;
        }

        await this.moveToNextQuestion();
      });

      socket.on('disconnect', () => {
        // Remove participant
        for (const [userId, participant] of this.quizState.participants) {
          if (participant.socketId === socket.id) {
            this.quizState.participants.delete(userId);
            logger.info(`User ${participant.username} disconnected`);
            break;
          }
        }
      });
    });
  }

  async startQuiz(adminId: string): Promise<void> {
    try {
      // Create new quiz session
      const session = await appwriteService.createDocument(
        appwriteService.collections.sessions,
        {
          startTime: new Date().toISOString(),
          isActive: true,
          createdBy: adminId,
          currentQuestionId: null
        },
        ID.unique()
      );

      this.quizState.currentSessionId = session.$id;
      
      // Notify all clients
      this.io.to('quiz-room').emit('quiz-started', session as any);
      
      // Start with first question
      await this.moveToNextQuestion();
      
      logger.info(`Quiz started by admin: ${adminId}`);
    } catch (error) {
      logger.error('Start quiz error:', error);
      throw error;
    }
  }

  async moveToNextQuestion(): Promise<void> {
    try {
      if (!this.quizState.currentSessionId) {
        throw new Error('No active quiz session');
      }

      // Get a random active question
      const questions = await appwriteService.listDocuments(
        appwriteService.collections.questions,
        [Query.equal('isActive', true)]
      );

      if (questions.documents.length === 0) {
        throw new Error('No questions available');
      }

      const randomQuestion = questions.documents[Math.floor(Math.random() * questions.documents.length)];
      
      // Update session with new question
      await appwriteService.updateDocument(
        appwriteService.collections.sessions,
        this.quizState.currentSessionId,
        { currentQuestionId: randomQuestion.$id }
      );

      this.quizState.currentQuestionId = randomQuestion.$id;
      this.quizState.questionStartTime = new Date();

      // Send question to all clients (without correct answer)
      const { correctAnswer, ...questionForClient } = randomQuestion as any;
      this.io.to('quiz-room').emit('new-question', questionForClient as any);

      // Set timer for next question
      setTimeout(() => {
        this.handleQuestionTimeout();
      }, (randomQuestion as any).timeLimit * 1000);

      logger.info(`New question sent: ${(randomQuestion as any).text.substring(0, 50)}...`);
    } catch (error) {
      logger.error('Move to next question error:', error);
      throw error;
    }
  }

  private handleQuestionTimeout(): void {
    if (this.quizState.currentQuestionId) {
      this.io.to('quiz-room').emit('question-ended', this.quizState.currentQuestionId);
      
      // Auto-move to next question after a short delay
      setTimeout(() => {
        this.moveToNextQuestion().catch(error => {
          logger.error('Auto next question error:', error);
        });
      }, 5000); // 5 second delay
    }
  }

  async stopQuiz(): Promise<void> {
    try {
      if (this.quizState.currentSessionId) {
        // Mark session as inactive
        await appwriteService.updateDocument(
          appwriteService.collections.sessions,
          this.quizState.currentSessionId,
          { isActive: false }
        );

        // Notify all clients
        this.io.to('quiz-room').emit('quiz-ended', this.quizState.currentSessionId);

        // Reset state
        this.quizState.currentSessionId = null;
        this.quizState.currentQuestionId = null;
        this.quizState.questionStartTime = null;

        logger.info('Quiz stopped');
      }
    } catch (error) {
      logger.error('Stop quiz error:', error);
      throw error;
    }
  }

  private async updateLeaderboard(userId: string, username: string): Promise<void> {
    try {
      if (!this.quizState.currentSessionId) return;

      // Get user's responses for current session
      const responses = await appwriteService.listDocuments(
        appwriteService.collections.responses,
        [
          Query.equal('userId', userId),
          Query.equal('sessionId', this.quizState.currentSessionId)
        ]
      );

      const correctAnswers = responses.documents.filter((r: any) => r.isCorrect).length;
      const totalQuestions = responses.documents.length;
      const averageResponseTime = responses.documents.reduce((sum: number, r: any) => sum + r.responseTime, 0) / totalQuestions;
      const totalScore = calculateScore(correctAnswers, totalQuestions, averageResponseTime);

      // Update or create leaderboard entry
      const existingEntries = await appwriteService.listDocuments(
        appwriteService.collections.leaderboard,
        [
          Query.equal('userId', userId),
          Query.equal('sessionId', this.quizState.currentSessionId)
        ]
      );

      if (existingEntries.documents.length > 0) {
        // Update existing entry
        await appwriteService.updateDocument(
          appwriteService.collections.leaderboard,
          existingEntries.documents[0].$id,
          {
            totalScore,
            correctAnswers,
            averageResponseTime
          }
        );
      } else {
        // Create new entry
        await appwriteService.createDocument(
          appwriteService.collections.leaderboard,
          {
            userId,
            username,
            sessionId: this.quizState.currentSessionId,
            totalScore,
            correctAnswers,
            averageResponseTime
          },
          ID.unique()
        );
      }

      // Get updated leaderboard and broadcast
      const leaderboard = await appwriteService.listDocuments(
        appwriteService.collections.leaderboard,
        [
          Query.equal('sessionId', this.quizState.currentSessionId),
          Query.orderDesc('totalScore'),
          Query.limit(20)
        ]
      );

      this.io.to('quiz-room').emit('leaderboard-update', leaderboard.documents as any);

    } catch (error) {
      logger.error('Update leaderboard error:', error);
    }
  }

  getQuizState() {
    return this.quizState;
  }
}

export let socketService: SocketService;
