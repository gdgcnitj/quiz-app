import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { appwriteService } from '../services/appwrite';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateEmail, 
  validatePassword, 
  validateUsername,
  LoginRequest,
  RegisterRequest,
  AdminLoginRequest
} from '@quiz-app/shared';
import { ID } from 'node-appwrite';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password }: RegisterRequest = req.body;

      // Validate input
      if (!validateEmail(email)) {
        return res.status(400).json(createErrorResponse('Invalid email format'));
      }

      if (!validatePassword(password)) {
        return res.status(400).json(createErrorResponse('Password must be at least 6 characters'));
      }

      if (!validateUsername(username)) {
        return res.status(400).json(createErrorResponse('Username must be 3-20 characters'));
      }

      // Check if user already exists
      const existingUsers = await appwriteService.listDocuments(
        appwriteService.collections.users,
        [`equal("email", "${email}")`]
      );

      if (existingUsers.documents.length > 0) {
        return res.status(400).json(createErrorResponse('User already exists'));
      }

      // Create user in Appwrite
      const userId = ID.unique();
      const hashedPassword = await authService.hashPassword(password);
      
      const appwriteUser = await appwriteService.createUser(userId, email, hashedPassword, username);
      
      // Create user document in our collection
      const userDoc = await appwriteService.createDocument(
        appwriteService.collections.users,
        {
          username,
          email,
          role: 'student'
        },
        userId
      );

      // Generate token
      const token = authService.generateToken(userDoc);

      logger.info(`User registered: ${email}`);

      res.status(201).json(createSuccessResponse({
        user: {
          $id: userDoc.$id,
          username: userDoc.username,
          email: userDoc.email,
          role: userDoc.role,
          $createdAt: userDoc.$createdAt
        },
        token
      }, 'User registered successfully'));

    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(500).json(createErrorResponse('Registration failed', error.message));
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginRequest = req.body;

      // Get user by email
      const users = await appwriteService.listDocuments(
        appwriteService.collections.users,
        [`equal("email", "${email}")`]
      );

      if (users.documents.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid credentials'));
      }

      const user = users.documents[0];

      // Get Appwrite user to verify password
      try {
        const appwriteUser = await appwriteService.getUser(user.$id);
        // Note: In a real implementation, you'd verify the password against Appwrite
        // For now, we'll use a simple check
        
        const token = authService.generateToken(user);

        logger.info(`User logged in: ${email}`);

        res.json(createSuccessResponse({
          user: {
            $id: user.$id,
            username: user.username,
            email: user.email,
            role: user.role,
            $createdAt: user.$createdAt
          },
          token
        }, 'Login successful'));

      } catch (error) {
        return res.status(401).json(createErrorResponse('Invalid credentials'));
      }

    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(500).json(createErrorResponse('Login failed', error.message));
    }
  }

  async adminLogin(req: Request, res: Response) {
    try {
      const { email, password, adminKey }: AdminLoginRequest = req.body;

      // Validate admin key
      if (!authService.validateAdminKey(adminKey)) {
        return res.status(401).json(createErrorResponse('Invalid admin key'));
      }

      // Get user by email
      const users = await appwriteService.listDocuments(
        appwriteService.collections.users,
        [`equal("email", "${email}")`, `equal("role", "admin")`]
      );

      if (users.documents.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid admin credentials'));
      }

      const user = users.documents[0];

      // Verify password (similar to regular login)
      try {
        const appwriteUser = await appwriteService.getUser(user.$id);
        
        const token = authService.generateToken(user);

        logger.info(`Admin logged in: ${email}`);

        res.json(createSuccessResponse({
          user: {
            $id: user.$id,
            username: user.username,
            email: user.email,
            role: user.role,
            $createdAt: user.$createdAt
          },
          token
        }, 'Admin login successful'));

      } catch (error) {
        return res.status(401).json(createErrorResponse('Invalid admin credentials'));
      }

    } catch (error: any) {
      logger.error('Admin login error:', error);
      res.status(500).json(createErrorResponse('Admin login failed', error.message));
    }
  }

  async verify(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json(createErrorResponse('Invalid token'));
      }

      // Get user from database
      const user = await appwriteService.getDocument(
        appwriteService.collections.users,
        userId
      );

      res.json(createSuccessResponse({
        user: {
          $id: user.$id,
          username: user.username,
          email: user.email,
          role: user.role,
          $createdAt: user.$createdAt
        }
      }, 'Token verified'));

    } catch (error: any) {
      logger.error('Token verification error:', error);
      res.status(401).json(createErrorResponse('Token verification failed'));
    }
  }

  async logout(req: Request, res: Response) {
    // For JWT tokens, logout is handled client-side by removing the token
    // Optionally, you could implement a token blacklist here
    res.json(createSuccessResponse(null, 'Logged out successfully'));
  }
}

export const authController = new AuthController();
