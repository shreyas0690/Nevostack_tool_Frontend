import { API_CONFIG } from '@/config/api';
import { authService } from '@/services/authService';

export const testCompanyAPI = async (companyId: string) => {
  const baseURL = API_CONFIG.BASE_URL;
  const endpoint = API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(companyId);
  const fullURL = `${baseURL}${endpoint}`;
  
  console.log('🔍 Testing Company API:');
  console.log('Base URL:', baseURL);
  console.log('Endpoint:', endpoint);
  console.log('Full URL:', fullURL);
  
  const token = authService.getAccessToken();
  console.log('Token available:', !!token);
  
  try {
    const response = await fetch(fullURL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return { error: errorText, status: response.status };
    }
  } catch (error) {
    console.log('❌ Network Error:', error);
    return { error: error.message };
  }
};

// Global function for easy testing in console
(window as any).testCompanyAPI = testCompanyAPI;


