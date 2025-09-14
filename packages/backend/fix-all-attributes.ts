import { Client, Databases } from 'node-appwrite';
import { config } from './src/config';

const client = new Client()
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

const databases = new Databases(client);

async function fixAllAttributes() {
  console.log('🔧 Checking and fixing all collection attributes...\n');

  try {
    // Fix Quiz Sessions collection
    console.log('📋 Checking Quiz Sessions collection...');
    const sessionsCollection = config.appwrite.collections.sessions;
    
    const sessionAttributes = [
      { key: 'currentQuestionId', type: 'string', size: 50, required: false },
      { key: 'startTime', type: 'datetime', required: true },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdBy', type: 'string', size: 50, required: true }
    ];

    for (const attr of sessionAttributes) {
      try {
        console.log(`Checking ${attr.key} attribute...`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            config.appwrite.databaseId,
            sessionsCollection,
            attr.key,
            attr.size!,
            attr.required,
            attr.default ? String(attr.default) : undefined
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            config.appwrite.databaseId,
            sessionsCollection,
            attr.key,
            attr.required,
            attr.default ? String(attr.default) : undefined
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            config.appwrite.databaseId,
            sessionsCollection,
            attr.key,
            attr.required,
            attr.default ? Boolean(attr.default) : undefined
          );
          console.log(`✅ Added ${attr.key} attribute`);
        }
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`✅ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // Fix Questions collection
    console.log('\n📋 Checking Questions collection...');
    const questionsCollection = config.appwrite.collections.questions;
    
    const questionAttributes = [
      { key: 'text', type: 'string', size: 1000, required: true },
      { key: 'options', type: 'string', size: 2000, required: true, array: true },
      { key: 'correctAnswer', type: 'integer', required: true },
      { key: 'timeLimit', type: 'integer', required: true, default: 60 },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdBy', type: 'string', size: 50, required: true }
    ];

    for (const attr of questionAttributes) {
      try {
        console.log(`Checking ${attr.key} attribute...`);
        
        if (attr.type === 'string') {
          if (attr.array) {
            await databases.createStringAttribute(
              config.appwrite.databaseId,
              questionsCollection,
              attr.key,
              attr.size!,
              attr.required,
              undefined,
              true // array
            );
          } else {
            await databases.createStringAttribute(
              config.appwrite.databaseId,
              questionsCollection,
              attr.key,
              attr.size!,
              attr.required,
              attr.default ? String(attr.default) : undefined
            );
          }
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            config.appwrite.databaseId,
            questionsCollection,
            attr.key,
            attr.required,
            undefined,
            undefined,
            attr.default as number
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            config.appwrite.databaseId,
            questionsCollection,
            attr.key,
            attr.required,
            attr.default as boolean
          );
          console.log(`✅ Added ${attr.key} attribute`);
        }
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`✅ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // Fix User Responses collection
    console.log('\n📋 Checking User Responses collection...');
    const responsesCollection = config.appwrite.collections.responses;
    
    const responseAttributes = [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'sessionId', type: 'string', size: 50, required: true },
      { key: 'questionId', type: 'string', size: 50, required: true },
      { key: 'selectedAnswer', type: 'integer', required: true },
      { key: 'isCorrect', type: 'boolean', required: true },
      { key: 'responseTime', type: 'integer', required: true }
    ];

    for (const attr of responseAttributes) {
      try {
        console.log(`Checking ${attr.key} attribute...`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            config.appwrite.databaseId,
            responsesCollection,
            attr.key,
            attr.size!,
            attr.required
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            config.appwrite.databaseId,
            responsesCollection,
            attr.key,
            attr.required
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            config.appwrite.databaseId,
            responsesCollection,
            attr.key,
            attr.required
          );
          console.log(`✅ Added ${attr.key} attribute`);
        }
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`✅ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // Fix Leaderboard collection
    console.log('\n📋 Checking Leaderboard collection...');
    const leaderboardCollection = config.appwrite.collections.leaderboard;
    
    const leaderboardAttributes = [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'username', type: 'string', size: 50, required: true },
      { key: 'sessionId', type: 'string', size: 50, required: true },
      { key: 'totalScore', type: 'integer', required: true, default: 0 },
      { key: 'correctAnswers', type: 'integer', required: true, default: 0 },
      { key: 'averageResponseTime', type: 'float', required: true, default: 0 }
    ];

    for (const attr of leaderboardAttributes) {
      try {
        console.log(`Checking ${attr.key} attribute...`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            config.appwrite.databaseId,
            leaderboardCollection,
            attr.key,
            attr.size!,
            attr.required
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            config.appwrite.databaseId,
            leaderboardCollection,
            attr.key,
            attr.required,
            undefined,
            undefined,
            attr.default as number
          );
          console.log(`✅ Added ${attr.key} attribute`);
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            config.appwrite.databaseId,
            leaderboardCollection,
            attr.key,
            attr.required,
            undefined,
            undefined,
            attr.default as number
          );
          console.log(`✅ Added ${attr.key} attribute`);
        }
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`✅ ${attr.key} attribute already exists`);
        } else {
          console.error(`❌ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    console.log('\n🎉 All attributes checked and fixed!');
    console.log('⚠️  Note: It may take a few minutes for new attributes to be fully available in Appwrite.');
    
  } catch (error) {
    console.error('❌ Error fixing attributes:', error);
  }
}

fixAllAttributes();
