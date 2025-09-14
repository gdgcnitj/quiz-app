import { Router } from 'express';
import { questionController } from '../controllers/question';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest, createQuestionSchema } from '../middleware/validation';

const router = Router();

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
 * @route POST /admin/quiz/stop
 * @desc Stop current quiz session
 * @access Private - Admin only
 */
router.post('/quiz/stop', authenticateToken, requireAdmin, (req, res) => {
  // This will be handled by the socket service
  res.json({ success: true, message: 'Stop quiz endpoint - use socket connection for real-time control' });
});

/**
 * @route GET /admin/quiz/status
 * @desc Get current quiz status
 * @access Private - Admin only
 */
router.get('/quiz/status', authenticateToken, requireAdmin, (req, res) => {
  // This will return the current quiz state
  res.json({ success: true, message: 'Quiz status endpoint' });
});

export default router;
