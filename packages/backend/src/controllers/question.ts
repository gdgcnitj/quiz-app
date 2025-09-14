import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { appwriteService } from '../services/appwrite';
import { logger } from '../utils/logger';
import { 
  createSuccessResponse, 
  createErrorResponse,
  CreateQuestionRequest,
  Question
} from '@quiz-app/shared';
import { ID, Query } from 'node-appwrite';

export class QuestionController {
  async getQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const questions = await appwriteService.listDocuments(
        appwriteService.collections.questions,
        [Query.equal('isActive', true)]
      );

      res.json(createSuccessResponse(questions.documents, 'Questions retrieved successfully'));
    } catch (error: any) {
      logger.error('Get questions error:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve questions', error.message));
    }
  }

  async createQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, options, correctAnswer, timeLimit }: CreateQuestionRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(createErrorResponse('User not authenticated'));
      }

      // Validate correctAnswer index
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        return res.status(400).json(createErrorResponse('Invalid correct answer index'));
      }

      const questionData = {
        text,
        options,
        correctAnswer,
        timeLimit: timeLimit || 60,
        isActive: true,
        createdBy: userId
      };

      const question = await appwriteService.createDocument(
        appwriteService.collections.questions,
        questionData,
        ID.unique()
      );

      logger.info(`Question created by user: ${userId}`);

      res.status(201).json(createSuccessResponse(question, 'Question created successfully'));
    } catch (error: any) {
      logger.error('Create question error:', error);
      res.status(500).json(createErrorResponse('Failed to create question', error.message));
    }
  }

  async updateQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { text, options, correctAnswer, timeLimit, isActive }: Partial<Question> = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(createErrorResponse('User not authenticated'));
      }

      // Get existing question to check ownership
      const existingQuestion = await appwriteService.getDocument(
        appwriteService.collections.questions,
        id
      );

      if (existingQuestion.createdBy !== userId) {
        return res.status(403).json(createErrorResponse('Not authorized to update this question'));
      }

      const updateData: any = {};
      if (text !== undefined) updateData.text = text;
      if (options !== undefined) updateData.options = options;
      if (correctAnswer !== undefined) {
        if (options && (correctAnswer < 0 || correctAnswer >= options.length)) {
          return res.status(400).json(createErrorResponse('Invalid correct answer index'));
        }
        updateData.correctAnswer = correctAnswer;
      }
      if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedQuestion = await appwriteService.updateDocument(
        appwriteService.collections.questions,
        id,
        updateData
      );

      logger.info(`Question updated: ${id} by user: ${userId}`);

      res.json(createSuccessResponse(updatedQuestion, 'Question updated successfully'));
    } catch (error: any) {
      logger.error('Update question error:', error);
      res.status(500).json(createErrorResponse('Failed to update question', error.message));
    }
  }

  async deleteQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(createErrorResponse('User not authenticated'));
      }

      // Get existing question to check ownership
      const existingQuestion = await appwriteService.getDocument(
        appwriteService.collections.questions,
        id
      );

      if (existingQuestion.createdBy !== userId) {
        return res.status(403).json(createErrorResponse('Not authorized to delete this question'));
      }

      await appwriteService.deleteDocument(
        appwriteService.collections.questions,
        id
      );

      logger.info(`Question deleted: ${id} by user: ${userId}`);

      res.json(createSuccessResponse(null, 'Question deleted successfully'));
    } catch (error: any) {
      logger.error('Delete question error:', error);
      res.status(500).json(createErrorResponse('Failed to delete question', error.message));
    }
  }

  async getQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const question = await appwriteService.getDocument(
        appwriteService.collections.questions,
        id
      );

      if (!question.isActive) {
        return res.status(404).json(createErrorResponse('Question not found'));
      }

      res.json(createSuccessResponse(question, 'Question retrieved successfully'));
    } catch (error: any) {
      logger.error('Get question error:', error);
      res.status(500).json(createErrorResponse('Failed to retrieve question', error.message));
    }
  }
}

export const questionController = new QuestionController();
