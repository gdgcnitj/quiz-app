import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@quiz-app/shared';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json(createErrorResponse(error.details[0].message));
    }
    next();
  };
};

// Validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  adminKey: Joi.string().required()
});

export const createQuestionSchema = Joi.object({
  text: Joi.string().min(10).max(1000).required(),
  options: Joi.array().items(Joi.string().min(1).max(200)).min(2).max(6).required(),
  correctAnswer: Joi.number().integer().min(0).required(),
  timeLimit: Joi.number().integer().min(10).max(300).default(60)
});

export const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  selectedAnswer: Joi.number().integer().min(0).required(),
  responseTime: Joi.number().integer().min(0).required()
});
