import { Router } from 'express';
import { questionController } from '../controllers/question';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, createQuestionSchema } from '../middleware/validation';

const router = Router();

// Import socket service for quiz control
import { socketService } from '../socket/index';

/**
 * @route GET /admin/questions
 * @desc Get all questions
 * @access Private - Admin only
 */
router.get('/questions', authenticateToken, requireAdmin, questionController.getQuestions);

/**
 * @route POST /admin/questions
 * @desc Create a new question
 * @access Private - Admin only
 */
router.post('/questions', authenticateToken, requireAdmin, validateRequest(createQuestionSchema), questionController.createQuestion);

/**
 * @route GET /admin/questions/:id
 * @desc Get a specific question
 * @access Private - Admin only
 */
router.get('/questions/:id', authenticateToken, requireAdmin, questionController.getQuestion);

/**
 * @route PUT /admin/questions/:id
 * @desc Update a question
 * @access Private - Admin only
 */
router.put('/questions/:id', authenticateToken, requireAdmin, questionController.updateQuestion);

/**
 * @route DELETE /admin/questions/:id
 * @desc Delete a question
 * @access Private - Admin only
 */
router.delete('/questions/:id', authenticateToken, requireAdmin, questionController.deleteQuestion);

/**
 * @route POST /admin/quiz/start
 * @desc Start a new quiz session
 * @access Private - Admin only
 */
router.post('/quiz/start', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin ID not found' });
    }
    
    await socketService.startQuiz(adminId);
    res.json({ success: true, message: 'Quiz started successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /admin/quiz/stop
 * @desc Stop current quiz session
 * @access Private - Admin only
 */
router.post('/quiz/stop', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await socketService.stopQuiz();
    res.json({ success: true, message: 'Quiz stopped successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /admin/quiz/status
 * @desc Get current quiz status
 * @access Private - Admin only
 */
router.get('/quiz/status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const quizState = socketService.getQuizState();
    const responseData = {
      isActive: !!quizState.currentSessionId,
      currentSessionId: quizState.currentSessionId,
      currentQuestionId: quizState.currentQuestionId,
      questionStartTime: quizState.questionStartTime,
      questionIndex: quizState.questionIndex,
      totalQuestions: quizState.totalQuestions,
      participantCount: quizState.participants.size
    };
    
    res.json({ success: true, data: responseData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
