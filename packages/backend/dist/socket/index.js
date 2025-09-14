"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
const appwrite_1 = require("../services/appwrite");
const node_appwrite_1 = require("node-appwrite");
class SocketService {
    constructor(server) {
        this.quizState = {
            currentSessionId: null,
            currentQuestionId: null,
            questionStartTime: null,
            questionTimeLimit: null,
            questionTimer: null,
            questionIndex: 0,
            totalQuestions: 0,
            availableQuestions: [],
            participants: new Map()
        };
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:19006"],
                methods: ["GET", "POST"]
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Client connected: ${socket.id}`);
            socket.on('join-quiz', async (userId) => {
                try {
                    // Get user details
                    const user = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.users, userId);
                    this.quizState.participants.set(userId, {
                        userId,
                        username: user.username,
                        socketId: socket.id
                    });
                    socket.join('quiz-room');
                    logger_1.logger.info(`User ${user.username} joined quiz`);
                    // Send current quiz state if active
                    if (this.quizState.currentSessionId && this.quizState.currentQuestionId) {
                        const question = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, this.quizState.currentQuestionId);
                        // Send question without correct answer
                        const { correctAnswer, ...questionForClient } = question;
                        socket.emit('new-question', questionForClient);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Join quiz error:', error);
                    socket.emit('error', 'Failed to join quiz');
                }
            });
            socket.on('submit-answer', async (data) => {
                try {
                    const participant = Array.from(this.quizState.participants.values())
                        .find(p => p.socketId === socket.id);
                    if (!participant) {
                        socket.emit('error', 'User not found in quiz');
                        return;
                    }
                    // Check if there's an active question
                    if (!this.quizState.currentQuestionId || !this.quizState.questionStartTime) {
                        socket.emit('error', 'No active question');
                        return;
                    }
                    // Calculate response time
                    const responseTime = (Date.now() - this.quizState.questionStartTime.getTime()) / 1000;
                    // Check if response time is within allowed limit
                    if (this.quizState.questionTimeLimit && responseTime > this.quizState.questionTimeLimit) {
                        socket.emit('error', 'Response time exceeded question time limit');
                        return;
                    }
                    // Check if user already answered this question
                    const existingResponse = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.responses, [`userId:${participant.userId}`, `questionId:${this.quizState.currentQuestionId}`]);
                    if (existingResponse.documents.length > 0) {
                        socket.emit('error', 'You have already answered this question');
                        return;
                    }
                    // Get the question to check correct answer
                    const question = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, data.questionId);
                    const isCorrect = data.selectedAnswer === question.correctAnswer;
                    // Calculate Kahoot-style score (faster = more points)
                    let score = 0;
                    if (isCorrect) {
                        // Base score: 1000 points for correct answer
                        // Speed bonus: More points for faster answers
                        // Formula: 1000 * (1 - (responseTime / timeLimit) * 0.5)
                        // This gives 1000 points for instant answer, 500 points for answer at time limit
                        const timeLimit = this.quizState.questionTimeLimit || 30;
                        const speedMultiplier = 1 - (responseTime / timeLimit) * 0.5;
                        score = Math.round(1000 * Math.max(speedMultiplier, 0.5)); // Minimum 500 points for correct answer
                    }
                    else {
                        // Wrong answer: 0 points (can be changed to negative if desired)
                        score = 0;
                    }
                    // Save user response
                    await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.responses, {
                        userId: participant.userId,
                        sessionId: this.quizState.currentSessionId,
                        questionId: data.questionId,
                        selectedAnswer: data.selectedAnswer,
                        isCorrect,
                        responseTime: Math.round(responseTime * 1000), // Store in milliseconds
                        score
                    }, node_appwrite_1.ID.unique());
                    // Update leaderboard
                    await this.updateLeaderboard(participant.userId, participant.username);
                    // Send response to user
                    socket.emit('answer-result', {
                        isCorrect,
                        score,
                        responseTime,
                        message: isCorrect ? `Correct! +${score} points` : 'Incorrect answer'
                    });
                    logger_1.logger.info(`Answer submitted by ${participant.username}: ${isCorrect ? 'correct' : 'incorrect'} (+${score} points)`);
                }
                catch (error) {
                    logger_1.logger.error('Submit answer error:', error);
                    socket.emit('error', 'Failed to submit answer');
                }
            });
            socket.on('admin-join', async (adminId) => {
                try {
                    const admin = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.users, adminId);
                    if (admin.role !== 'admin') {
                        socket.emit('error', 'Admin access required');
                        return;
                    }
                    socket.join('admin-room');
                    logger_1.logger.info(`Admin ${admin.username} joined`);
                }
                catch (error) {
                    logger_1.logger.error('Admin join error:', error);
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
                        logger_1.logger.info(`User ${participant.username} disconnected`);
                        break;
                    }
                }
            });
        });
    }
    async startQuiz(adminId) {
        try {
            // Check if there's already an active session in memory
            if (this.quizState.currentSessionId) {
                throw new Error('A quiz session is already active. Please end the current session first.');
            }
            // Load all available questions
            const questions = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.questions, []);
            if (questions.documents.length === 0) {
                throw new Error('No questions available to start quiz');
            }
            // Shuffle questions for randomness
            const shuffledQuestions = [...questions.documents].sort(() => Math.random() - 0.5);
            // Create new quiz session
            const session = await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.sessions, {
                startTime: new Date().toISOString(),
                createdBy: adminId
            }, node_appwrite_1.ID.unique());
            // Initialize quiz state
            this.quizState.currentSessionId = session.$id;
            this.quizState.availableQuestions = shuffledQuestions;
            this.quizState.totalQuestions = shuffledQuestions.length;
            this.quizState.questionIndex = 0;
            this.quizState.currentQuestionId = null;
            this.quizState.questionStartTime = null;
            this.quizState.questionTimeLimit = null;
            this.quizState.questionTimer = null;
            // Notify all clients that quiz has started
            this.io.to('quiz-room').emit('quiz-started', {
                sessionId: session.$id,
                totalQuestions: this.quizState.totalQuestions,
                message: 'Quiz started! First question coming up...'
            });
            // Wait 3 seconds before starting first question
            setTimeout(() => {
                this.moveToNextQuestion();
            }, 3000);
            logger_1.logger.info(`Quiz started by admin: ${adminId} with ${this.quizState.totalQuestions} questions`);
        }
        catch (error) {
            logger_1.logger.error('Start quiz error:', error);
            throw error;
        }
    }
    async moveToNextQuestion() {
        try {
            if (!this.quizState.currentSessionId) {
                throw new Error('No active quiz session');
            }
            // Clear any existing timer
            if (this.quizState.questionTimer) {
                clearTimeout(this.quizState.questionTimer);
                this.quizState.questionTimer = null;
            }
            // Check if there are more questions
            if (this.quizState.questionIndex >= this.quizState.availableQuestions.length) {
                // Quiz is finished
                await this.endQuiz();
                return;
            }
            const currentQuestion = this.quizState.availableQuestions[this.quizState.questionIndex];
            // Update quiz state
            this.quizState.currentQuestionId = currentQuestion.$id;
            this.quizState.questionStartTime = new Date();
            this.quizState.questionTimeLimit = currentQuestion.timeLimit;
            // Update session with current question
            await appwrite_1.appwriteService.updateDocument(appwrite_1.appwriteService.collections.sessions, this.quizState.currentSessionId, { currentQuestionId: currentQuestion.$id });
            // Send question to all clients (without correct answer)
            const { correctAnswer, ...questionForClient } = currentQuestion;
            const questionPayload = {
                ...questionForClient,
                questionNumber: this.quizState.questionIndex + 1,
                totalQuestions: this.quizState.totalQuestions,
                timeLimit: currentQuestion.timeLimit,
                startTime: this.quizState.questionStartTime.toISOString()
            };
            this.io.to('quiz-room').emit('new-question', questionPayload);
            logger_1.logger.info(`Question ${this.quizState.questionIndex + 1}/${this.quizState.totalQuestions} sent: ${currentQuestion.text.substring(0, 50)}...`);
            // Set timer for automatic progression to next question
            this.quizState.questionTimer = setTimeout(() => {
                this.handleQuestionTimeout();
            }, currentQuestion.timeLimit * 1000);
            // Increment question index for next call
            this.quizState.questionIndex++;
        }
        catch (error) {
            logger_1.logger.error('Move to next question error:', error);
            throw error;
        }
    }
    handleQuestionTimeout() {
        if (this.quizState.currentQuestionId) {
            logger_1.logger.info(`Question ${this.quizState.questionIndex}/${this.quizState.totalQuestions} time up!`);
            // Send question ended event with results
            this.io.to('quiz-room').emit('question-ended', {
                questionId: this.quizState.currentQuestionId,
                questionNumber: this.quizState.questionIndex,
                totalQuestions: this.quizState.totalQuestions
            });
            // Wait 5 seconds before moving to next question (time for leaderboard updates)
            setTimeout(() => {
                this.moveToNextQuestion().catch(error => {
                    logger_1.logger.error('Auto next question error:', error);
                });
            }, 5000);
        }
    }
    async endQuiz() {
        try {
            if (!this.quizState.currentSessionId) {
                return;
            }
            const sessionId = this.quizState.currentSessionId;
            // Get final leaderboard
            const finalLeaderboard = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.leaderboard, [`sessionId:${sessionId}`]);
            // Sort by score descending
            const sortedLeaderboard = finalLeaderboard.documents.sort((a, b) => b.totalScore - a.totalScore);
            // Notify all clients that quiz has ended
            this.io.to('quiz-room').emit('quiz-ended', {
                sessionId,
                finalLeaderboard: sortedLeaderboard,
                totalQuestions: this.quizState.totalQuestions,
                message: 'Quiz completed! Thanks for participating!'
            });
            // Clear quiz state
            this.resetQuizState();
            logger_1.logger.info(`Quiz ${sessionId} completed with ${this.quizState.participants.size} participants`);
        }
        catch (error) {
            logger_1.logger.error('End quiz error:', error);
            throw error;
        }
    }
    resetQuizState() {
        // Clear timer if exists
        if (this.quizState.questionTimer) {
            clearTimeout(this.quizState.questionTimer);
        }
        this.quizState = {
            currentSessionId: null,
            currentQuestionId: null,
            questionStartTime: null,
            questionTimeLimit: null,
            questionTimer: null,
            questionIndex: 0,
            totalQuestions: 0,
            availableQuestions: [],
            participants: new Map()
        };
    }
    async stopQuiz() {
        try {
            if (this.quizState.currentSessionId) {
                const sessionId = this.quizState.currentSessionId;
                // Notify all clients that quiz was stopped by admin
                this.io.to('quiz-room').emit('quiz-ended', {
                    sessionId,
                    message: 'Quiz stopped by administrator',
                    wasForceEnded: true
                });
                // Reset quiz state
                this.resetQuizState();
                logger_1.logger.info(`Quiz ${sessionId} stopped by admin`);
            }
            else {
                logger_1.logger.info('No active quiz to stop');
            }
        }
        catch (error) {
            logger_1.logger.error('Stop quiz error:', error);
            throw error;
        }
    }
    async updateLeaderboard(userId, username) {
        try {
            if (!this.quizState.currentSessionId)
                return;
            // Get user's responses for current session
            const responses = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.responses, [
                node_appwrite_1.Query.equal('userId', userId),
                node_appwrite_1.Query.equal('sessionId', this.quizState.currentSessionId)
            ]);
            const correctAnswers = responses.documents.filter((r) => r.isCorrect).length;
            const totalQuestions = responses.documents.length;
            const totalScore = responses.documents.reduce((sum, r) => sum + (r.score || 0), 0);
            const averageResponseTime = totalQuestions > 0
                ? responses.documents.reduce((sum, r) => sum + (r.responseTime || 0), 0) / totalQuestions
                : 0;
            // Update or create leaderboard entry
            const existingEntries = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.leaderboard, [
                node_appwrite_1.Query.equal('userId', userId),
                node_appwrite_1.Query.equal('sessionId', this.quizState.currentSessionId)
            ]);
            if (existingEntries.documents.length > 0) {
                // Update existing entry
                await appwrite_1.appwriteService.updateDocument(appwrite_1.appwriteService.collections.leaderboard, existingEntries.documents[0].$id, {
                    totalScore,
                    correctAnswers,
                    totalQuestions,
                    averageResponseTime
                });
            }
            else {
                // Create new entry
                await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.leaderboard, {
                    userId,
                    username,
                    sessionId: this.quizState.currentSessionId,
                    totalScore,
                    correctAnswers,
                    totalQuestions,
                    averageResponseTime
                }, node_appwrite_1.ID.unique());
            }
            // Get updated leaderboard and broadcast
            const leaderboard = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.leaderboard, [
                node_appwrite_1.Query.equal('sessionId', this.quizState.currentSessionId),
                node_appwrite_1.Query.orderDesc('totalScore'),
                node_appwrite_1.Query.limit(20)
            ]);
            this.io.to('quiz-room').emit('leaderboard-update', leaderboard.documents);
        }
        catch (error) {
            logger_1.logger.error('Update leaderboard error:', error);
        }
    }
    getQuizState() {
        return this.quizState;
    }
}
exports.SocketService = SocketService;
