"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const appwrite_1 = require("../services/appwrite");
const logger_1 = require("../utils/logger");
const shared_1 = require("@quiz-app/shared");
const node_appwrite_1 = require("node-appwrite");
const router = (0, express_1.Router)();
/**
 * @route GET /quiz/current-question
 * @desc Get the current active question (Kahoot-style) - only if question is currently active
 * @access Private - Student
 */
router.get('/current-question', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json((0, shared_1.createErrorResponse)('User not authenticated'));
        }
        // Check if there's an active quiz session by calling the main endpoint
        const response = await fetch('http://localhost:3001/api/quiz/current');
        const quizStatusData = await response.json();
        if (!quizStatusData.success || !quizStatusData.data.isActive) {
            return res.json((0, shared_1.createSuccessResponse)({
                hasActiveQuiz: false,
                message: 'No active quiz session'
            }, 'No active quiz'));
        }
        // If there's an active question, check if it's still within time limit
        if (quizStatusData.data.currentQuestionId && quizStatusData.data.questionStartTime) {
            const questionStartTime = new Date(quizStatusData.data.questionStartTime);
            const timePassed = (Date.now() - questionStartTime.getTime()) / 1000;
            const question = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, quizStatusData.data.currentQuestionId);
            // Check if question time has expired
            if (timePassed > question.timeLimit) {
                return res.json((0, shared_1.createSuccessResponse)({
                    hasActiveQuiz: true,
                    question: null,
                    message: 'Question time has expired. Waiting for next question...',
                    timeExpired: true
                }, 'Question time expired'));
            }
            // Check if user already answered this question
            const existingResponse = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.responses, [`userId:${userId}`, `questionId:${question.$id}`]);
            const hasAnswered = existingResponse.documents.length > 0;
            res.json((0, shared_1.createSuccessResponse)({
                hasActiveQuiz: true,
                question: {
                    $id: question.$id,
                    text: question.text,
                    options: question.options,
                    timeLimit: question.timeLimit,
                    remainingTime: Math.max(0, question.timeLimit - timePassed)
                    // Note: correctAnswer is NOT included for security
                },
                hasAnswered,
                questionStartTime: quizStatusData.data.questionStartTime
            }, 'Current question retrieved'));
        }
        else {
            res.json((0, shared_1.createSuccessResponse)({
                hasActiveQuiz: true,
                question: null,
                message: 'Waiting for next question...'
            }, 'No current question'));
        }
    }
    catch (error) {
        logger_1.logger.error('Get current question error:', error);
        res.status(500).json((0, shared_1.createErrorResponse)('Failed to get current question', error.message));
    }
});
/**
 * @route POST /quiz/answer
 * @desc Submit answer with time-based scoring (Kahoot-style)
 * @access Private - Student
 */
router.post('/answer', auth_1.authenticateToken, async (req, res) => {
    try {
        const { questionId, selectedAnswer } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json((0, shared_1.createErrorResponse)('User not authenticated'));
        }
        // Validate required fields
        if (!questionId || selectedAnswer === undefined) {
            return res.status(400).json((0, shared_1.createErrorResponse)('Missing required fields: questionId, selectedAnswer'));
        }
        // Get current quiz status to calculate actual response time
        const quizStatusResponse = await fetch('http://localhost:3001/api/quiz/current');
        const quizStatusData = await quizStatusResponse.json();
        if (!quizStatusData.success || !quizStatusData.data.isActive || !quizStatusData.data.currentQuestionId) {
            return res.status(400).json((0, shared_1.createErrorResponse)('No active quiz or question'));
        }
        if (quizStatusData.data.currentQuestionId !== questionId) {
            return res.status(400).json((0, shared_1.createErrorResponse)('This question is no longer active'));
        }
        // Calculate response time from server-side question start time
        const questionStartTime = new Date(quizStatusData.data.questionStartTime);
        const responseTime = (Date.now() - questionStartTime.getTime()) / 1000; // in seconds
        // Check if user already answered this question
        const existingResponse = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.responses, [`userId:${userId}`, `questionId:${questionId}`]);
        if (existingResponse.documents.length > 0) {
            return res.status(400).json((0, shared_1.createErrorResponse)('You have already answered this question'));
        }
        // Get the question to check correct answer and time limit
        const question = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, questionId);
        // Check if response time is within allowed limit
        if (responseTime > question.timeLimit) {
            return res.status(400).json((0, shared_1.createErrorResponse)('Response time exceeded question time limit'));
        }
        const isCorrect = question.correctAnswer === selectedAnswer;
        // Calculate score based on speed and accuracy (Kahoot-style formula)
        let score = 0;
        if (isCorrect) {
            // Base score: 1000 points for correct answer
            // Speed bonus: More points for faster answers
            // Formula: 1000 * (1 - (responseTime / timeLimit) * 0.5)
            // This gives 1000 points for instant answer, 500 points for answer at time limit
            const speedMultiplier = 1 - (responseTime / question.timeLimit) * 0.5;
            score = Math.round(1000 * Math.max(speedMultiplier, 0.5)); // Minimum 500 points for correct answer
        }
        else {
            // Wrong answer: 0 points (can be changed to negative if desired)
            score = 0;
        }
        const currentSessionId = quizStatusData.data.currentSessionId || 'unknown_session';
        // Save the response
        const response = await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.responses, {
            userId,
            sessionId: currentSessionId,
            questionId,
            selectedAnswer,
            isCorrect,
            responseTime: Math.round(responseTime * 1000), // Store in milliseconds for consistency
            score
        }, node_appwrite_1.ID.unique());
        // Update user's total score in leaderboard
        await updateUserLeaderboard(userId, currentSessionId, score, isCorrect);
        res.json((0, shared_1.createSuccessResponse)({
            isCorrect,
            score,
            responseTime: Math.round(responseTime * 1000), // Return in milliseconds
            responseId: response.$id,
            message: isCorrect ? `Correct! +${score} points` : 'Incorrect answer'
        }, 'Answer submitted successfully'));
    }
    catch (error) {
        logger_1.logger.error('Submit answer error:', error);
        res.status(500).json((0, shared_1.createErrorResponse)('Failed to submit answer', error.message));
    }
});
/**
 * @route GET /quiz/leaderboard
 * @desc Get current quiz session leaderboard
 * @access Private - Student
 */
router.get('/leaderboard', auth_1.authenticateToken, async (req, res) => {
    try {
        // Get current quiz status
        const quizStatusResponse = await fetch('http://localhost:3001/api/quiz/current');
        const quizStatusData = await quizStatusResponse.json();
        if (!quizStatusData.success || !quizStatusData.data.isActive) {
            return res.json((0, shared_1.createSuccessResponse)([], 'No active quiz session'));
        }
        const currentSessionId = quizStatusData.data.currentSessionId;
        // Get leaderboard for current session
        const leaderboard = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.leaderboard, [`sessionId:${currentSessionId}`]);
        // Sort by totalScore descending
        const sortedLeaderboard = leaderboard.documents.sort((a, b) => b.totalScore - a.totalScore);
        res.json((0, shared_1.createSuccessResponse)(sortedLeaderboard, 'Leaderboard retrieved successfully'));
    }
    catch (error) {
        logger_1.logger.error('Get leaderboard error:', error);
        res.status(500).json((0, shared_1.createErrorResponse)('Failed to get leaderboard', error.message));
    }
});
/**
 * @route GET /quiz/questions
 * @desc Get all available questions for mobile (public access for testing)
 * @access Public - For mobile apps to get questions
 */
router.get('/questions', async (req, res) => {
    try {
        const questions = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.questions, [] // Get all questions for mobile
        );
        // Format questions for mobile (remove correct answers for security)
        const mobileQuestions = questions.documents.map((q) => ({
            id: q.$id,
            text: q.text,
            options: q.options,
            timeLimit: q.timeLimit,
            // Don't send correctAnswer to mobile clients
        }));
        res.json((0, shared_1.createSuccessResponse)(mobileQuestions, 'Questions retrieved for mobile'));
    }
    catch (error) {
        logger_1.logger.error('Get mobile questions error:', error);
        res.status(500).json((0, shared_1.createErrorResponse)('Failed to retrieve questions', error.message));
    }
});
/**
 * Helper function to update user leaderboard
 */
async function updateUserLeaderboard(userId, sessionId, newScore, isCorrect) {
    try {
        // Get user details
        const user = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.users, userId);
        // Check if user already has a leaderboard entry for this session
        const existingEntries = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.leaderboard, [`userId:${userId}`, `sessionId:${sessionId}`]);
        if (existingEntries.documents.length > 0) {
            // Update existing entry
            const existingEntry = existingEntries.documents[0];
            const updatedScore = (existingEntry.totalScore || 0) + newScore;
            const updatedCorrectAnswers = (existingEntry.correctAnswers || 0) + (isCorrect ? 1 : 0);
            const updatedTotalQuestions = (existingEntry.totalQuestions || 0) + 1;
            await appwrite_1.appwriteService.updateDocument(appwrite_1.appwriteService.collections.leaderboard, existingEntry.$id, {
                totalScore: updatedScore,
                correctAnswers: updatedCorrectAnswers,
                totalQuestions: updatedTotalQuestions
            });
        }
        else {
            // Create new leaderboard entry
            await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.leaderboard, {
                userId,
                username: user.username,
                sessionId,
                totalScore: newScore,
                correctAnswers: isCorrect ? 1 : 0,
                totalQuestions: 1
            }, node_appwrite_1.ID.unique());
        }
    }
    catch (error) {
        logger_1.logger.error('Update leaderboard error:', error);
        throw error;
    }
}
exports.default = router;
