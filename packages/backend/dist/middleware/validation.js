"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAnswerSchema = exports.createQuestionSchema = exports.adminLoginSchema = exports.registerSchema = exports.loginSchema = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const shared_1 = require("@quiz-app/shared");
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json((0, shared_1.createErrorResponse)(error.details[0].message));
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Validation schemas
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required()
});
exports.registerSchema = joi_1.default.object({
    username: joi_1.default.string().min(3).max(20).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required()
});
exports.adminLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    adminKey: joi_1.default.string().required()
});
exports.createQuestionSchema = joi_1.default.object({
    text: joi_1.default.string().min(10).max(1000).required(),
    options: joi_1.default.array().items(joi_1.default.string().min(1).max(200)).min(2).max(6).required(),
    correctAnswer: joi_1.default.number().integer().min(0).required(),
    timeLimit: joi_1.default.number().integer().min(10).max(300).default(60)
});
exports.submitAnswerSchema = joi_1.default.object({
    questionId: joi_1.default.string().required(),
    selectedAnswer: joi_1.default.number().integer().min(0).required(),
    responseTime: joi_1.default.number().integer().min(0).required()
});
