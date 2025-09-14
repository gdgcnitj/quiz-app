import { Router } from 'express';
import { authController } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, loginSchema, registerSchema, adminLoginSchema } from '../middleware/validation';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @route POST /auth/admin-login
 * @desc Admin login
 * @access Public
 */
router.post('/admin-login', validateRequest(adminLoginSchema), authController.adminLogin);

/**
 * @route GET /auth/verify
 * @desc Verify JWT token
 * @access Private
 */
router.get('/verify', authenticateToken, authController.verify);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', authController.logout);

export default router;
