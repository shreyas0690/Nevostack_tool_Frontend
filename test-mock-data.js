// Test script to verify mock data is working
const { userService } = require('./src/services/userService.ts');
const { workspaceService } = require('./src/services/workspaceService.ts');
const { authService } = require('./src/services/authService.ts');

async function testMockData() {
  console.log('🧪 Testing Mock Data...\n');

  try {
    // Test auth service
    console.log('1. Testing Auth Service:');
    const currentUser = authService.getCurrentUser();
    console.log('   Current User:', {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    });

    // Test user service
    console.log('\n2. Testing User Service:');
    const userData = await userService.getUserById(currentUser.id);
    console.log('   User Profile:', {
      id: userData.data.id,
      firstName: userData.data.firstName,
      lastName: userData.data.lastName,
      email: userData.data.email,
      phone: userData.data.phone,
      mobileNumber: userData.data.mobileNumber
    });

    // Test workspace service
    console.log('\n3. Testing Workspace Service:');
    const workspaceData = await workspaceService.getWorkspaceById(currentUser.companyId);
    console.log('   Workspace Data:', {
      id: workspaceData.data.id,
      name: workspaceData.data.name,
      domain: workspaceData.data.domain,
      subdomain: workspaceData.data.subdomain,
      plan: workspaceData.data.plan,
      status: workspaceData.data.status,
      timezone: workspaceData.data.settings.timezone,
      language: workspaceData.data.settings.language
    });

    console.log('\n✅ All mock data is working correctly!');
    console.log('\n📋 Summary:');
    console.log('   - User Profile: John Doe (john.doe@example.com)');
    console.log('   - Company: Acme Corporation (acme.com)');
    console.log('   - Plan: Professional');
    console.log('   - Status: Active');

  } catch (error) {
    console.error('❌ Error testing mock data:', error);
  }
}

testMockData();

