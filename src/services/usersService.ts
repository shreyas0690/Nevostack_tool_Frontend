import { apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

class UsersService {
  async getStats(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = API_CONFIG.ENDPOINTS.USERS.STATS + (qs ? `?${qs}` : '');
    return apiService.get(endpoint);
  }
}

export const usersService = new UsersService();
export default usersService;













