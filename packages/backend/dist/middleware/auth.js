"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStudent = exports.requireAdmin = exports.authenticateToken = void 0;
const auth_1 = require("../services/auth");
const shared_1 = require("@quiz-app/shared");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json((0, shared_1.createErrorResponse)('Access token required'));
    }
    try {
        const decoded = auth_1.authService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json((0, shared_1.createErrorResponse)('Invalid or expired token'));
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json((0, shared_1.createErrorResponse)('Admin access required'));
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireStudent = (req, res, next) => {
    if (!req.user || req.user.role !== 'student') {
        return res.status(403).json((0, shared_1.createErrorResponse)('Student access required'));
    }
    next();
};
exports.requireStudent = requireStudent;
