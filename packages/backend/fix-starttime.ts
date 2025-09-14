import { Client, Databases } from 'node-appwrite';
import { config } from './src/config';

const client = new Client()
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

const databases = new Databases(client);

async function fixStartTimeAttribute() {
  console.log('🔧 Adding missing startTime attribute to quiz sessions...');

  try {
    const sessionsCollection = config.appwrite.collections.sessions;
    
    // Add startTime datetime attribute
    await databases.createDatetimeAttribute(
      config.appwrite.databaseId,
      sessionsCollection,
      'startTime',
      true // required
    );
    
    console.log('✅ Successfully added startTime attribute to quiz sessions collection');
    console.log('⚠️  Note: It may take a few minutes for the attribute to be fully available in Appwrite.');
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ startTime attribute already exists');
    } else {
      console.error('❌ Error adding startTime attribute:', error.message);
    }
  }
}

fixStartTimeAttribute();
