import { API_CONFIG } from './api';

export const razorpayConfig = {
  key_id: 'rzp_test_ROI2vufvWZljYC',
  company_name: 'Nevostack',
  company_logo: '', // Add logo URL if needed
  theme: {
    color: '#3B82F6'
  }
};

export const apiConfig = {
  baseUrl: API_CONFIG.BASE_URL,
  endpoints: {
    createPaymentOrder: '/api/company/create-payment-order',
    verifyPayment: '/api/company/verify-payment',
    plans: '/api/company/plans'
  }
};
