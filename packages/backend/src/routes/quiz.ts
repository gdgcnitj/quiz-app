import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { appwriteService } from '../services/appwrite';
import { logger } from '../utils/logger';
import { createSuccessResponse, createErrorResponse } from '@quiz-app/shared';
import { ID, Query } from 'node-appwrite';

const router = Router();

/**
 * @route GET /quiz/current-question
 * @desc Get the current active question (Kahoot-style) - only if question is currently active
 * @access Private - Student
 */
router.get('/current-question', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(createErrorResponse('User not authenticated'));
    }

    // Check if there's an active quiz session by calling the main endpoint
    const response = await fetch('http://localhost:3001/api/quiz/current');
    const quizStatusData = await response.json();
    
    if (!quizStatusData.success || !quizStatusData.data.isActive) {
      return res.json(createSuccessResponse({
        hasActiveQuiz: false,
        message: 'No active quiz session'
      }, 'No active quiz'));
    }

    // If there's an active question, check if it's still within time limit
    if (quizStatusData.data.currentQuestionId && quizStatusData.data.questionStartTime) {
      const questionStartTime = new Date(quizStatusData.data.questionStartTime);
      const timePassed = (Date.now() - questionStartTime.getTime()) / 1000;

      const question = await appwriteService.getDocument(
        appwriteService.collections.questions,
        quizStatusData.data.currentQuestionId
      ) as any;

      // Check if question time has expired
      if (timePassed > question.timeLimit) {
        return res.json(createSuccessResponse({
          hasActiveQuiz: true,
          question: null,
          message: 'Question time has expired. Waiting for next question...',
          timeExpired: true
        }, 'Question time expired'));
      }

      // Check if user already answered this question
      const existingResponse = await appwriteService.listDocuments(
        appwriteService.collections.responses,
        [Query.equal('userId', userId), Query.equal('questionId', question.$id)]
      );

      const hasAnswered = existingResponse.documents.length > 0;

      res.json(createSuccessResponse({
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
    } else {
      res.json(createSuccessResponse({
        hasActiveQuiz: true,
        question: null,
        message: 'Waiting for next question...'
      }, 'No current question'));
    }

  } catch (error: any) {
    logger.error('Get current question error:', error);
    res.status(500).json(createErrorResponse('Failed to get current question', error.message));
  }
});

/**
 * @route POST /quiz/answer
 * @desc Submit answer with time-based scoring (Kahoot-style)
 * @access Private - Student
 */
router.post('/answer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(createErrorResponse('User not authenticated'));
    }

    // Validate required fields
    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json(createErrorResponse('Missing required fields: questionId, selectedAnswer'));
    }

    // Get current quiz status to calculate actual response time
    const quizStatusResponse = await fetch('http://localhost:3001/api/quiz/current');
    const quizStatusData = await quizStatusResponse.json();
    
    if (!quizStatusData.success || !quizStatusData.data.isActive || !quizStatusData.data.currentQuestionId) {
      return res.status(400).json(createErrorResponse('No active quiz or question'));
    }

    if (quizStatusData.data.currentQuestionId !== questionId) {
      return res.status(400).json(createErrorResponse('This question is no longer active'));
    }

    // Calculate response time from server-side question start time
    const questionStartTime = new Date(quizStatusData.data.questionStartTime);
    const responseTime = (Date.now() - questionStartTime.getTime()) / 1000; // in seconds

    // Check if user already answered this question
    const existingResponse = await appwriteService.listDocuments(
      appwriteService.collections.responses,
      [Query.equal('userId', userId), Query.equal('questionId', questionId)]
    );

    if (existingResponse.documents.length > 0) {
      return res.status(400).json(createErrorResponse('You have already answered this question'));
    }

    // Get the question to check correct answer and time limit
    const question = await appwriteService.getDocument(
      appwriteService.collections.questions,
      questionId
    ) as any;

    // Check if response time is within allowed limit
    if (responseTime > question.timeLimit) {
      return res.status(400).json(createErrorResponse('Response time exceeded question time limit'));
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
    } else {
      // Wrong answer: 0 points (can be changed to negative if desired)
      score = 0;
    }

    const currentSessionId = quizStatusData.data.currentSessionId || 'unknown_session';

    // Save the response
    const response = await appwriteService.createDocument(
      appwriteService.collections.responses,
      {
        userId,
        sessionId: currentSessionId,
        questionId,
        selectedAnswer,
        isCorrect,
        responseTime: Math.round(responseTime * 1000), // Store in milliseconds for consistency
        score
      },
      ID.unique()
    );

    // Update user's total score in leaderboard
    await updateUserLeaderboard(userId, currentSessionId, score, isCorrect);

    res.json(createSuccessResponse({
      isCorrect,
      score,
      responseTime: Math.round(responseTime * 1000), // Return in milliseconds
      responseId: response.$id,
      message: isCorrect ? `Correct! +${score} points` : 'Incorrect answer'
    }, 'Answer submitted successfully'));

  } catch (error: any) {
    logger.error('Submit answer error:', error);
    res.status(500).json(createErrorResponse('Failed to submit answer', error.message));
  }
});

/**
 * @route GET /quiz/leaderboard
 * @desc Get current quiz session leaderboard
 * @access Private - Student
 */
router.get('/leaderboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get current quiz status
    const quizStatusResponse = await fetch('http://localhost:3001/api/quiz/current');
    const quizStatusData = await quizStatusResponse.json();
    
    if (!quizStatusData.success || !quizStatusData.data.isActive) {
      return res.json(createSuccessResponse([], 'No active quiz session'));
    }

    const currentSessionId = quizStatusData.data.currentSessionId;

    // Get leaderboard for current session
    const leaderboard = await appwriteService.listDocuments(
      appwriteService.collections.leaderboard,
      [Query.equal('sessionId', currentSessionId)]
    );

    // Sort by totalScore descending
    const sortedLeaderboard = leaderboard.documents.sort((a: any, b: any) => b.totalScore - a.totalScore);

    res.json(createSuccessResponse(sortedLeaderboard, 'Leaderboard retrieved successfully'));
  } catch (error: any) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json(createErrorResponse('Failed to get leaderboard', error.message));
  }
});

/**
 * @route GET /quiz/questions
 * @desc Get all available questions for mobile (public access for testing)
 * @access Public - For mobile apps to get questions
 */
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const questions = await appwriteService.listDocuments(
      appwriteService.collections.questions,
      [] // Get all questions for mobile
    );

    // Format questions for mobile (remove correct answers for security)
    const mobileQuestions = questions.documents.map((q: any) => ({
      id: q.$id,
      text: q.text,
      options: q.options,
      timeLimit: q.timeLimit,
      // Don't send correctAnswer to mobile clients
    }));

    res.json(createSuccessResponse(mobileQuestions, 'Questions retrieved for mobile'));
  } catch (error: any) {
    logger.error('Get mobile questions error:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve questions', error.message));
  }
});

/**
 * Helper function to update user leaderboard
 */
async function updateUserLeaderboard(userId: string, sessionId: string, newScore: number, isCorrect: boolean) {
  try {
    // Get user details
    const user = await appwriteService.getDocument(
      appwriteService.collections.users,
      userId
    ) as any;

    // Check if user already has a leaderboard entry for this session
    const existingEntries = await appwriteService.listDocuments(
      appwriteService.collections.leaderboard,
      [Query.equal('userId', userId), Query.equal('sessionId', sessionId)]
    );

    if (existingEntries.documents.length > 0) {
      // Update existing entry
      const existingEntry = existingEntries.documents[0] as any;
      const updatedScore = (existingEntry.totalScore || 0) + newScore;
      const updatedCorrectAnswers = (existingEntry.correctAnswers || 0) + (isCorrect ? 1 : 0);
      const updatedTotalQuestions = (existingEntry.totalQuestions || 0) + 1;

      await appwriteService.updateDocument(
        appwriteService.collections.leaderboard,
        existingEntry.$id,
        {
          totalScore: updatedScore,
          correctAnswers: updatedCorrectAnswers,
          totalQuestions: updatedTotalQuestions
        }
      );
    } else {
      // Create new leaderboard entry
      await appwriteService.createDocument(
        appwriteService.collections.leaderboard,
        {
          userId,
          username: user.username,
          sessionId,
          totalScore: newScore,
          correctAnswers: isCorrect ? 1 : 0,
          totalQuestions: 1
        },
        ID.unique()
      );
    }
  } catch (error) {
    logger.error('Update leaderboard error:', error);
    throw error;
  }
}

export default router;
