"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config_1 = require("../config");
class AuthService {
    generateToken(user) {
        return jwt.sign({
            userId: user.$id,
            email: user.email,
            role: user.role
        }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    }
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    validateAdminKey(providedKey) {
        return providedKey === config_1.config.admin.secretKey;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
