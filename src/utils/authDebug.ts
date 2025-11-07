// Debug utilities for authentication issues

export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('device');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('deviceId');
  localStorage.removeItem('nevostack_auth');
  localStorage.removeItem('nevostack_user');
  console.log('🗑️ All auth data cleared from localStorage');
};

export const debugCurrentAuth = () => {
  console.log('🔍 Current Auth Debug Info:');
  console.log('User:', localStorage.getItem('user'));
  console.log('Access Token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
  console.log('Refresh Token:', localStorage.getItem('refreshToken')?.substring(0, 50) + '...');
  console.log('Device:', localStorage.getItem('device'));
};

export const forceRealLogin = async () => {
  console.log('🔄 Forcing real login...');
  clearAuthData();
  window.location.reload();
};


