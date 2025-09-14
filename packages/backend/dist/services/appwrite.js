"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appwriteService = void 0;
const node_appwrite_1 = require("node-appwrite");
const config_1 = require("../config");
class AppwriteService {
    constructor() {
        this.client = new node_appwrite_1.Client();
        this.client
            .setEndpoint(config_1.config.appwrite.endpoint)
            .setProject(config_1.config.appwrite.projectId)
            .setKey(config_1.config.appwrite.apiKey);
        this.databases = new node_appwrite_1.Databases(this.client);
        this.account = new node_appwrite_1.Account(this.client);
        this.users = new node_appwrite_1.Users(this.client);
    }
    // Database operations
    async createDocument(collectionId, data, documentId) {
        return await this.databases.createDocument(config_1.config.appwrite.databaseId, collectionId, documentId || 'unique()', data);
    }
    async getDocument(collectionId, documentId) {
        return await this.databases.getDocument(config_1.config.appwrite.databaseId, collectionId, documentId);
    }
    async updateDocument(collectionId, documentId, data) {
        return await this.databases.updateDocument(config_1.config.appwrite.databaseId, collectionId, documentId, data);
    }
    async deleteDocument(collectionId, documentId) {
        return await this.databases.deleteDocument(config_1.config.appwrite.databaseId, collectionId, documentId);
    }
    async listDocuments(collectionId, queries = []) {
        return await this.databases.listDocuments(config_1.config.appwrite.databaseId, collectionId, queries);
    }
    // User operations
    async createUser(userId, email, password, name) {
        return await this.users.create(userId, email, undefined, password, name);
    }
    async getUser(userId) {
        return await this.users.get(userId);
    }
    async listUsers(queries = []) {
        return await this.users.list(queries);
    }
    // Collection getters
    get collections() {
        return {
            users: config_1.config.appwrite.collections.users,
            questions: config_1.config.appwrite.collections.questions,
            sessions: config_1.config.appwrite.collections.sessions,
            responses: config_1.config.appwrite.collections.responses,
            leaderboard: config_1.config.appwrite.collections.leaderboard
        };
    }
    // Database initialization
    async initializeDatabase() {
        try {
            // Check if database exists, create if not
            await this.databases.get(config_1.config.appwrite.databaseId);
            console.log('Database already exists');
        }
        catch (error) {
            console.log('Creating database...');
            await this.databases.create(config_1.config.appwrite.databaseId, 'Quiz App Database');
        }
        // Initialize collections
        await this.initializeCollections();
    }
    async initializeCollections() {
        const collections = [
            {
                id: this.collections.users,
                name: 'Users',
                attributes: [
                    { key: 'username', type: 'string', size: 50, required: true },
                    { key: 'email', type: 'string', size: 100, required: true },
                    { key: 'role', type: 'string', size: 20, required: true, default: 'student' }
                ]
            },
            {
                id: this.collections.questions,
                name: 'Questions',
                attributes: [
                    { key: 'text', type: 'string', size: 1000, required: true },
                    { key: 'options', type: 'string', size: 2000, required: true, array: true },
                    { key: 'correctAnswer', type: 'integer', required: true },
                    { key: 'timeLimit', type: 'integer', required: true, default: 60 },
                    { key: 'isActive', type: 'boolean', required: true, default: true },
                    { key: 'createdBy', type: 'string', size: 50, required: true }
                ]
            },
            {
                id: this.collections.sessions,
                name: 'Quiz Sessions',
                attributes: [
                    { key: 'currentQuestionId', type: 'string', size: 50, required: false },
                    { key: 'startTime', type: 'datetime', required: true },
                    { key: 'isActive', type: 'boolean', required: true, default: true },
                    { key: 'createdBy', type: 'string', size: 50, required: true }
                ]
            },
            {
                id: this.collections.responses,
                name: 'User Responses',
                attributes: [
                    { key: 'userId', type: 'string', size: 50, required: true },
                    { key: 'sessionId', type: 'string', size: 50, required: true },
                    { key: 'questionId', type: 'string', size: 50, required: true },
                    { key: 'selectedAnswer', type: 'integer', required: true },
                    { key: 'isCorrect', type: 'boolean', required: true },
                    { key: 'responseTime', type: 'integer', required: true }
                ]
            },
            {
                id: this.collections.leaderboard,
                name: 'Leaderboard',
                attributes: [
                    { key: 'userId', type: 'string', size: 50, required: true },
                    { key: 'username', type: 'string', size: 50, required: true },
                    { key: 'sessionId', type: 'string', size: 50, required: true },
                    { key: 'totalScore', type: 'integer', required: true, default: 0 },
                    { key: 'correctAnswers', type: 'integer', required: true, default: 0 },
                    { key: 'averageResponseTime', type: 'float', required: true, default: 0 }
                ]
            }
        ];
        for (const collection of collections) {
            try {
                await this.databases.getCollection(config_1.config.appwrite.databaseId, collection.id);
                console.log(`Collection ${collection.name} already exists`);
            }
            catch (error) {
                console.log(`Creating collection ${collection.name}...`);
                await this.databases.createCollection(config_1.config.appwrite.databaseId, collection.id, collection.name);
                // Add attributes
                for (const attr of collection.attributes) {
                    try {
                        if (attr.type === 'string') {
                            await this.databases.createStringAttribute(config_1.config.appwrite.databaseId, collection.id, attr.key, attr.size || 255, attr.required || false, attr.default, attr.array || false);
                        }
                        else if (attr.type === 'integer') {
                            await this.databases.createIntegerAttribute(config_1.config.appwrite.databaseId, collection.id, attr.key, attr.required || false, attr.default);
                        }
                        else if (attr.type === 'float') {
                            await this.databases.createFloatAttribute(config_1.config.appwrite.databaseId, collection.id, attr.key, attr.required || false, attr.default);
                        }
                        else if (attr.type === 'boolean') {
                            await this.databases.createBooleanAttribute(config_1.config.appwrite.databaseId, collection.id, attr.key, attr.required || false, attr.default);
                        }
                        else if (attr.type === 'datetime') {
                            await this.databases.createDatetimeAttribute(config_1.config.appwrite.databaseId, collection.id, attr.key, attr.required || false, attr.default);
                        }
                    }
                    catch (attrError) {
                        console.log(`Attribute ${attr.key} already exists or failed to create:`, attrError);
                    }
                }
            }
        }
    }
}
exports.appwriteService = new AppwriteService();
