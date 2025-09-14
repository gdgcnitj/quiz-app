// Quick script to fix missing attributes
import { Client, Databases } from 'node-appwrite';
import { config } from './src/config';

const client = new Client();
client
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

const databases = new Databases(client);

async function addMissingAttributes() {
  try {
    console.log('Adding missing role attribute to users collection...');
    
    // Check if role attribute exists
    try {
      await databases.createStringAttribute(
        config.appwrite.databaseId,
        config.appwrite.collections.users,
        'role',
        20,
        false,  // Not required
        'student'  // Default value
      );
      console.log('✅ Role attribute created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Role attribute already exists');
      } else {
        console.log('❌ Failed to create role attribute:', error.message);
      }
    }

    // Add username attribute if missing
    try {
      await databases.createStringAttribute(
        config.appwrite.databaseId,
        config.appwrite.collections.users,
        'username',
        50,
        true
      );
      console.log('✅ Username attribute created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Username attribute already exists');
      } else {
        console.log('❌ Failed to create username attribute:', error.message);
      }
    }

    // Add email attribute if missing
    try {
      await databases.createStringAttribute(
        config.appwrite.databaseId,
        config.appwrite.collections.users,
        'email',
        100,
        true
      );
      console.log('✅ Email attribute created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Email attribute already exists');
      } else {
        console.log('❌ Failed to create email attribute:', error.message);
      }
    }

    console.log('🎉 Attribute setup complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingAttributes();
