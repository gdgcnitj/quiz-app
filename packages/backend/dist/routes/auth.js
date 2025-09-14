"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', (0, validation_1.validateRequest)(validation_1.registerSchema), auth_1.authController.register);
/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', (0, validation_1.validateRequest)(validation_1.loginSchema), auth_1.authController.login);
/**
 * @route POST /auth/admin-login
 * @desc Admin login
 * @access Public
 */
router.post('/admin-login', (0, validation_1.validateRequest)(validation_1.adminLoginSchema), auth_1.authController.adminLogin);
/**
 * @route GET /auth/verify
 * @desc Verify JWT token
 * @access Private
 */
router.get('/verify', auth_2.authenticateToken, auth_1.authController.verify);
/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', auth_1.authController.logout);
exports.default = router;
