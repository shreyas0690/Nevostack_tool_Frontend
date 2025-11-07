import { User } from '@/types/company';

// Test user with proper department ID for HOD testing
export const testHODUser: User = {
  id: '3',
  name: 'Mike Davis',
  email: 'mike@company.com',
  role: 'department_head',
  departmentId: '1', // Sales Department
  isActive: true,
  createdAt: new Date('2024-01-10'),
};

// Function to setup test user in localStorage
export function setupTestHODUser() {
  const userData = {
    ...testHODUser,
    firstName: 'Mike',
    lastName: 'Davis',
    status: 'active'
  };
  
  // Set authentication status
  localStorage.setItem('nevostack_auth', 'true');
  localStorage.setItem('nevostack_user', JSON.stringify(testHODUser));
  localStorage.setItem('user', JSON.stringify(userData));
  
  // Mock tokens
  localStorage.setItem('accessToken', 'mock_access_token_for_testing');
  localStorage.setItem('refreshToken', 'mock_refresh_token_for_testing');
  
  console.log('Test HOD user setup complete:', testHODUser);
  return testHODUser;
}

// Function to clear test data
export function clearTestData() {
  localStorage.removeItem('nevostack_auth');
  localStorage.removeItem('nevostack_user');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('device');
  localStorage.removeItem('deviceId');
  console.log('Test data cleared');
}

// Auto-setup for development - DISABLED to show login page first
// if (import.meta.env.DEV) {
//   // Check if no user is currently logged in
//   const currentAuth = localStorage.getItem('nevostack_auth');
//   if (!currentAuth || currentAuth !== 'true') {
//     console.log('No user logged in, setting up test HOD user...');
//     setupTestHODUser();
//   }
// }

