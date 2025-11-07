// Debug helper for HOD Department Management issues

export function debugAuthState() {
  console.log('=== AUTH DEBUG STATE ===');
  console.log('nevostack_auth:', localStorage.getItem('nevostack_auth'));
  console.log('nevostack_user:', localStorage.getItem('nevostack_user'));
  console.log('user:', localStorage.getItem('user'));
  console.log('accessToken:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
  console.log('authToken:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
  console.log('========================');
}

export async function testLoginAndCheckDepartment(email: string, password: string) {
  console.log('=== TESTING LOGIN AND DEPARTMENT RESPONSE ===');
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Login Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Full Login Response:', data);
      
      if (data.user) {
        console.log('User Data:', data.user);
        console.log('Department ID from response:', data.user.departmentId);
        console.log('Department object:', data.user.department);
        console.log('All possible dept fields:', {
          departmentId: data.user.departmentId,
          department: data.user.department,
          dept: data.user.dept,
          deptId: data.user.deptId
        });
      }
      
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('Login Error response:', errorData);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.error('Login Network error:', error);
    return { success: false, error };
  }
}

export async function testDepartmentsAPI() {
  console.log('=== TESTING DEPARTMENTS API ===');
  
  const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  console.log('Base URL:', baseURL);
  console.log('Token:', token ? `${token.substring(0, 10)}...` : 'No token');
  
  try {
    const response = await fetch(`${baseURL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('Error response:', errorData);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error };
  }
}

export function setupTestHODData() {
  const testUser = {
    id: '68b41081a4a04ddc99a06bf0',
    name: 'Somapon Sk',
    email: 'somapon@gmail.com',
    role: 'department_head',
    isActive: true,
    departmentId: 'test_dept_001', // Add test department ID
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem('nevostack_auth', 'true');
  localStorage.setItem('nevostack_user', JSON.stringify(testUser));
  localStorage.setItem('user', JSON.stringify(testUser));
  localStorage.setItem('accessToken', 'test_token_for_development');
  
  console.log('Test HOD data setup:', testUser);
  return testUser;
}

// Auto-run debug on development
if (import.meta.env.DEV) {
  // Make debug functions available globally
  (window as any).debugAuth = debugAuthState;
  (window as any).testDepartmentsAPI = testDepartmentsAPI;
  (window as any).testLogin = testLoginAndCheckDepartment;
  (window as any).setupTestHOD = setupTestHODData;
  
  console.log('Debug helpers available:');
  console.log('- debugAuth() - Check auth state');
  console.log('- testDepartmentsAPI() - Test departments API');
  console.log('- testLogin(email, password) - Test login and check department response');
  console.log('- setupTestHOD() - Setup test HOD user');
}
