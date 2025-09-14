"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = exports.createErrorResponse = exports.createSuccessResponse = exports.calculateScore = exports.formatTime = exports.validateUsername = exports.validatePassword = exports.validateEmail = void 0;
// Validation utilities
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    return password.length >= 6;
};
exports.validatePassword = validatePassword;
const validateUsername = (username) => {
    return username.length >= 3 && username.length <= 20;
};
exports.validateUsername = validateUsername;
// Time utilities
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
exports.formatTime = formatTime;
const calculateScore = (correctAnswers, totalQuestions, averageResponseTime) => {
    const baseScore = (correctAnswers / totalQuestions) * 100;
    const timeBonus = Math.max(0, (60 - averageResponseTime) / 60) * 10;
    return Math.round(baseScore + timeBonus);
};
exports.calculateScore = calculateScore;
// Response utilities
const createSuccessResponse = (data, message) => ({
    success: true,
    data,
    message
});
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error, message) => ({
    success: false,
    error,
    message
});
exports.createErrorResponse = createErrorResponse;
// Constants
exports.CONSTANTS = {
    DEFAULT_QUESTION_TIME: 60,
    MAX_QUESTION_TIME: 300,
    MIN_QUESTION_TIME: 10,
    MAX_OPTIONS: 6,
    MIN_OPTIONS: 2,
    ADMIN_KEY_LENGTH: 32
};
//# sourceMappingURL=utils.js.map