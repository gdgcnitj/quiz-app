const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
import { config } from '../config';

export class AuthService {
  generateToken(user: any): string {
    return jwt.sign(
      { 
        userId: user.$id, 
        email: user.email, 
        role: user.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  validateAdminKey(providedKey: string): boolean {
    return providedKey === config.admin.secretKey;
  }
}

export const authService = new AuthService();
