"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const question_1 = require("../controllers/question");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
/**
 * @route GET /admin/questions
 * @desc Get all questions
 * @access Private - Admin only
 */
router.get('/questions', auth_1.authenticateToken, auth_1.requireAdmin, question_1.questionController.getQuestions);
/**
 * @route POST /admin/questions
 * @desc Create a new question
 * @access Private - Admin only
 */
router.post('/questions', auth_1.authenticateToken, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.createQuestionSchema), question_1.questionController.createQuestion);
/**
 * @route GET /admin/questions/:id
 * @desc Get a specific question
 * @access Private - Admin only
 */
router.get('/questions/:id', auth_1.authenticateToken, auth_1.requireAdmin, question_1.questionController.getQuestion);
/**
 * @route PUT /admin/questions/:id
 * @desc Update a question
 * @access Private - Admin only
 */
router.put('/questions/:id', auth_1.authenticateToken, auth_1.requireAdmin, question_1.questionController.updateQuestion);
/**
 * @route DELETE /admin/questions/:id
 * @desc Delete a question
 * @access Private - Admin only
 */
router.delete('/questions/:id', auth_1.authenticateToken, auth_1.requireAdmin, question_1.questionController.deleteQuestion);
/**
 * @route POST /admin/quiz/stop
 * @desc Stop current quiz session
 * @access Private - Admin only
 */
router.post('/quiz/stop', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    // This will be handled by the socket service
    res.json({ success: true, message: 'Stop quiz endpoint - use socket connection for real-time control' });
});
/**
 * @route GET /admin/quiz/status
 * @desc Get current quiz status
 * @access Private - Admin only
 */
router.get('/quiz/status', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    // This will return the current quiz state
    res.json({ success: true, message: 'Quiz status endpoint' });
});
exports.default = router;
