// Debug utilities for SaaS authentication issues

export const debugSaaSAuth = () => {
  console.log('🔍 SaaS Auth Debug Info:');
  console.log('SaaS Access Token:', localStorage.getItem('saas_access_token')?.substring(0, 50) + '...');
  console.log('SaaS Refresh Token:', localStorage.getItem('saas_refresh_token')?.substring(0, 50) + '...');
  console.log('SaaS User:', localStorage.getItem('saas_user'));
  console.log('SaaS Device:', localStorage.getItem('saas_device'));
  
  console.log('🔍 Regular Auth Debug Info:');
  console.log('NevoStack Auth:', localStorage.getItem('nevostack_auth'));
  console.log('NevoStack User:', localStorage.getItem('nevostack_user'));
  console.log('Access Token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
  console.log('User:', localStorage.getItem('user'));
};

export const clearSaaSAuth = () => {
  localStorage.removeItem('saas_access_token');
  localStorage.removeItem('saas_refresh_token');
  localStorage.removeItem('saas_user');
  localStorage.removeItem('saas_device');
  console.log('🗑️ SaaS auth data cleared from localStorage');
};

export const clearAllAuth = () => {
  localStorage.removeItem('saas_access_token');
  localStorage.removeItem('saas_refresh_token');
  localStorage.removeItem('saas_user');
  localStorage.removeItem('saas_device');
  localStorage.removeItem('nevostack_auth');
  localStorage.removeItem('nevostack_user');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('device');
  localStorage.removeItem('deviceId');
  console.log('🗑️ All auth data cleared from localStorage');
};

export const testSaaSAuth = () => {
  try {
    // Check localStorage directly for SaaS auth
    const saasToken = localStorage.getItem('saas_access_token');
    const saasUser = localStorage.getItem('saas_user');
    
    console.log('🧪 SaaS Auth Test:');
    console.log('SaaS Token exists:', !!saasToken);
    console.log('SaaS User exists:', !!saasUser);
    console.log('SaaS User:', saasUser ? JSON.parse(saasUser) : null);
    
    const isAuthenticated = !!(saasToken && saasUser);
    const user = saasUser ? JSON.parse(saasUser) : null;
    
    return { isAuthenticated, user };
  } catch (error) {
    console.error('❌ SaaS Auth Test Error:', error);
    return { isAuthenticated: false, user: null };
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugSaaSAuth = debugSaaSAuth;
  (window as any).clearSaaSAuth = clearSaaSAuth;
  (window as any).clearAllAuth = clearAllAuth;
  (window as any).testSaaSAuth = testSaaSAuth;
}
