"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionController = exports.QuestionController = void 0;
const appwrite_1 = require("../services/appwrite");
const logger_1 = require("../utils/logger");
const shared_1 = require("@quiz-app/shared");
const node_appwrite_1 = require("node-appwrite");
class QuestionController {
    async getQuestions(req, res) {
        try {
            const questions = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.questions, [] // Remove isActive filter temporarily
            );
            res.json((0, shared_1.createSuccessResponse)(questions.documents, 'Questions retrieved successfully'));
        }
        catch (error) {
            logger_1.logger.error('Get questions error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Failed to retrieve questions', error.message));
        }
    }
    async createQuestion(req, res) {
        try {
            const { text, options, correctAnswer, timeLimit } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json((0, shared_1.createErrorResponse)('User not authenticated'));
            }
            // Validate correctAnswer index
            if (correctAnswer < 0 || correctAnswer >= options.length) {
                return res.status(400).json((0, shared_1.createErrorResponse)('Invalid correct answer index'));
            }
            const questionData = {
                text,
                options,
                correctAnswer,
                timeLimit: timeLimit || 60,
                // isActive: true, // Remove temporarily
                createdBy: userId
            };
            const question = await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.questions, questionData, node_appwrite_1.ID.unique());
            logger_1.logger.info(`Question created by user: ${userId}`);
            res.status(201).json((0, shared_1.createSuccessResponse)(question, 'Question created successfully'));
        }
        catch (error) {
            logger_1.logger.error('Create question error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Failed to create question', error.message));
        }
    }
    async updateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { text, options, correctAnswer, timeLimit, isActive } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json((0, shared_1.createErrorResponse)('User not authenticated'));
            }
            // Get existing question to check ownership
            const existingQuestion = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, id);
            if (existingQuestion.createdBy !== userId) {
                return res.status(403).json((0, shared_1.createErrorResponse)('Not authorized to update this question'));
            }
            const updateData = {};
            if (text !== undefined)
                updateData.text = text;
            if (options !== undefined)
                updateData.options = options;
            if (correctAnswer !== undefined) {
                if (options && (correctAnswer < 0 || correctAnswer >= options.length)) {
                    return res.status(400).json((0, shared_1.createErrorResponse)('Invalid correct answer index'));
                }
                updateData.correctAnswer = correctAnswer;
            }
            if (timeLimit !== undefined)
                updateData.timeLimit = timeLimit;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            const updatedQuestion = await appwrite_1.appwriteService.updateDocument(appwrite_1.appwriteService.collections.questions, id, updateData);
            logger_1.logger.info(`Question updated: ${id} by user: ${userId}`);
            res.json((0, shared_1.createSuccessResponse)(updatedQuestion, 'Question updated successfully'));
        }
        catch (error) {
            logger_1.logger.error('Update question error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Failed to update question', error.message));
        }
    }
    async deleteQuestion(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json((0, shared_1.createErrorResponse)('User not authenticated'));
            }
            // Get existing question to check ownership
            const existingQuestion = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, id);
            if (existingQuestion.createdBy !== userId) {
                return res.status(403).json((0, shared_1.createErrorResponse)('Not authorized to delete this question'));
            }
            await appwrite_1.appwriteService.deleteDocument(appwrite_1.appwriteService.collections.questions, id);
            logger_1.logger.info(`Question deleted: ${id} by user: ${userId}`);
            res.json((0, shared_1.createSuccessResponse)(null, 'Question deleted successfully'));
        }
        catch (error) {
            logger_1.logger.error('Delete question error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Failed to delete question', error.message));
        }
    }
    async getQuestion(req, res) {
        try {
            const { id } = req.params;
            const question = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.questions, id);
            if (!question.isActive) {
                return res.status(404).json((0, shared_1.createErrorResponse)('Question not found'));
            }
            res.json((0, shared_1.createSuccessResponse)(question, 'Question retrieved successfully'));
        }
        catch (error) {
            logger_1.logger.error('Get question error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Failed to retrieve question', error.message));
        }
    }
}
exports.QuestionController = QuestionController;
exports.questionController = new QuestionController();
