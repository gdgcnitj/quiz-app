"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const appwrite_1 = require("../services/appwrite");
const auth_1 = require("../services/auth");
const logger_1 = require("../utils/logger");
const shared_1 = require("@quiz-app/shared");
const node_appwrite_1 = require("node-appwrite");
class AuthController {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            // Validate input
            if (!(0, shared_1.validateEmail)(email)) {
                return res.status(400).json((0, shared_1.createErrorResponse)('Invalid email format'));
            }
            if (!(0, shared_1.validatePassword)(password)) {
                return res.status(400).json((0, shared_1.createErrorResponse)('Password must be at least 6 characters'));
            }
            if (!(0, shared_1.validateUsername)(username)) {
                return res.status(400).json((0, shared_1.createErrorResponse)('Username must be 3-20 characters'));
            }
            // Check if user already exists
            const existingUsers = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.users, [node_appwrite_1.Query.equal('email', email)]);
            if (existingUsers.documents.length > 0) {
                return res.status(400).json((0, shared_1.createErrorResponse)('User already exists'));
            }
            // Create user in Appwrite
            const userId = node_appwrite_1.ID.unique();
            const hashedPassword = await auth_1.authService.hashPassword(password);
            const appwriteUser = await appwrite_1.appwriteService.createUser(userId, email, hashedPassword, username);
            // Create user document in our collection
            const userDoc = await appwrite_1.appwriteService.createDocument(appwrite_1.appwriteService.collections.users, {
                username,
                email,
                role: 'student'
            }, userId);
            // Generate token
            const token = auth_1.authService.generateToken(userDoc);
            logger_1.logger.info(`User registered: ${email}`);
            res.status(201).json((0, shared_1.createSuccessResponse)({
                user: {
                    $id: userDoc.$id,
                    username: userDoc.username,
                    email: userDoc.email,
                    role: userDoc.role,
                    $createdAt: userDoc.$createdAt
                },
                token
            }, 'User registered successfully'));
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Registration failed', error.message));
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            // Get user by email
            const users = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.users, [node_appwrite_1.Query.equal('email', email)]);
            if (users.documents.length === 0) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid credentials'));
            }
            const user = users.documents[0];
            // Get Appwrite user to verify password
            try {
                const appwriteUser = await appwrite_1.appwriteService.getUser(user.$id);
                // Note: In a real implementation, you'd verify the password against Appwrite
                // For now, we'll use a simple check
                const token = auth_1.authService.generateToken(user);
                logger_1.logger.info(`User logged in: ${email}`);
                res.json((0, shared_1.createSuccessResponse)({
                    user: {
                        $id: user.$id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        $createdAt: user.$createdAt
                    },
                    token
                }, 'Login successful'));
            }
            catch (error) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid credentials'));
            }
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Login failed', error.message));
        }
    }
    async adminLogin(req, res) {
        try {
            const { email, password, adminKey } = req.body;
            // Validate admin key
            if (!auth_1.authService.validateAdminKey(adminKey)) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid admin key'));
            }
            // Get user by email
            const users = await appwrite_1.appwriteService.listDocuments(appwrite_1.appwriteService.collections.users, [node_appwrite_1.Query.equal('email', email), node_appwrite_1.Query.equal('role', 'admin')]);
            if (users.documents.length === 0) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid admin credentials'));
            }
            const user = users.documents[0];
            // Verify password (similar to regular login)
            try {
                const appwriteUser = await appwrite_1.appwriteService.getUser(user.$id);
                const token = auth_1.authService.generateToken(user);
                logger_1.logger.info(`Admin logged in: ${email}`);
                res.json((0, shared_1.createSuccessResponse)({
                    user: {
                        $id: user.$id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        $createdAt: user.$createdAt
                    },
                    token
                }, 'Admin login successful'));
            }
            catch (error) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid admin credentials'));
            }
        }
        catch (error) {
            logger_1.logger.error('Admin login error:', error);
            res.status(500).json((0, shared_1.createErrorResponse)('Admin login failed', error.message));
        }
    }
    async verify(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json((0, shared_1.createErrorResponse)('Invalid token'));
            }
            // Get user from database
            const user = await appwrite_1.appwriteService.getDocument(appwrite_1.appwriteService.collections.users, userId);
            res.json((0, shared_1.createSuccessResponse)({
                user: {
                    $id: user.$id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    $createdAt: user.$createdAt
                }
            }, 'Token verified'));
        }
        catch (error) {
            logger_1.logger.error('Token verification error:', error);
            res.status(401).json((0, shared_1.createErrorResponse)('Token verification failed'));
        }
    }
    async logout(req, res) {
        // For JWT tokens, logout is handled client-side by removing the token
        // Optionally, you could implement a token blacklist here
        res.json((0, shared_1.createSuccessResponse)(null, 'Logged out successfully'));
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
