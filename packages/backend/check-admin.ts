import { appwriteService } from './src/services/appwrite';
import { Query } from 'node-appwrite';

async function checkAdmin() {
  try {

    console.log('Checking users in database...');
    
    // List all users
    const allUsers = await appwriteService.listDocuments(
      appwriteService.collections.users,
      []
    );

    console.log('All users:');
    allUsers.documents.forEach((user: any) => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, ID: ${user.$id}`);
    });

    // Check specifically for admin users
    const adminUsers = await appwriteService.listDocuments(
      appwriteService.collections.users,
      [Query.equal('role', 'admin')]
    );

    console.log('\nAdmin users:');
    adminUsers.documents.forEach((user: any) => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, ID: ${user.$id}`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkAdmin();
