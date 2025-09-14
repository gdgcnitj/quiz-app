import { Client, Databases } from 'node-appwrite';
import { config } from './src/config';

const client = new Client()
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

const databases = new Databases(client);

async function fixIsActiveAttribute() {
  console.log('🔧 Adding missing isActive attribute to quiz sessions...');

  try {
    const sessionsCollection = config.appwrite.collections.sessions;
    
    // Add isActive boolean attribute (required=false since we can't set default for required)
    await databases.createBooleanAttribute(
      config.appwrite.databaseId,
      sessionsCollection,
      'isActive',
      false // not required, so we can handle defaults in code
    );
    
    console.log('✅ Successfully added isActive attribute to quiz sessions collection');
    console.log('⚠️  Note: It may take a few minutes for the attribute to be fully available in Appwrite.');
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ isActive attribute already exists');
    } else {
      console.error('❌ Error adding isActive attribute:', error.message);
    }
  }
}

fixIsActiveAttribute();
