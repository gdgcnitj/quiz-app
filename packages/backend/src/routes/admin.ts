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

export default router;
