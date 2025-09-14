import { Client, Databases, Account, Users } from 'node-appwrite';
import { config } from '../config';

class AppwriteService {
  private client: Client;
  private databases: Databases;
  private account: Account;
  private users: Users;

  constructor() {
    this.client = new Client();
    this.client
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId)
      .setKey(config.appwrite.apiKey);

    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
    this.users = new Users(this.client);
  }

  // Database operations
  async createDocument(collectionId: string, data: any, documentId?: string) {
    return await this.databases.createDocument(
      config.appwrite.databaseId,
      collectionId,
      documentId || 'unique()',
      data
    );
  }

  async getDocument(collectionId: string, documentId: string) {
    return await this.databases.getDocument(
      config.appwrite.databaseId,
      collectionId,
      documentId
    );
  }

  async updateDocument(collectionId: string, documentId: string, data: any) {
    return await this.databases.updateDocument(
      config.appwrite.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async deleteDocument(collectionId: string, documentId: string) {
    return await this.databases.deleteDocument(
      config.appwrite.databaseId,
      collectionId,
      documentId
    );
  }

  async listDocuments(collectionId: string, queries: string[] = []) {
    return await this.databases.listDocuments(
      config.appwrite.databaseId,
      collectionId,
      queries
    );
  }

  // User operations
  async createUser(userId: string, email: string, password: string, name: string) {
    return await this.users.create(userId, email, undefined, password, name);
  }

  async getUser(userId: string) {
    return await this.users.get(userId);
  }

  async listUsers(queries: string[] = []) {
    return await this.users.list(queries);
  }

  // Collection getters
  get collections() {
    return {
      users: config.appwrite.collections.users,
      questions: config.appwrite.collections.questions,
      sessions: config.appwrite.collections.sessions,
      responses: config.appwrite.collections.responses,
      leaderboard: config.appwrite.collections.leaderboard
    };
  }

  // Database initialization
  async initializeDatabase() {
    try {
      // Check if database exists, create if not
      await this.databases.get(config.appwrite.databaseId);
      console.log('Database already exists');
    } catch (error) {
      console.log('Creating database...');
      await this.databases.create(config.appwrite.databaseId, 'Quiz App Database');
    }

    // Initialize collections
    await this.initializeCollections();
  }

  private async initializeCollections() {
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
        await this.databases.getCollection(config.appwrite.databaseId, collection.id);
        console.log(`Collection ${collection.name} already exists`);
      } catch (error) {
        console.log(`Creating collection ${collection.name}...`);
        await this.databases.createCollection(
          config.appwrite.databaseId,
          collection.id,
          collection.name
        );

        // Add attributes
        for (const attr of collection.attributes) {
          await this.databases.createStringAttribute(
            config.appwrite.databaseId,
            collection.id,
            attr.key,
            attr.size || 255,
            attr.required || false,
            attr.default,
            attr.array || false
          );
        }
      }
    }
  }
}

export const appwriteService = new AppwriteService();
