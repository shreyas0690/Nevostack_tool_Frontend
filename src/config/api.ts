// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API
  // Base URL for the backend API
  BASE_URL: (() => {
    // Version Check
    console.log('🚀 App Version: 1.0.2 - Vercel URL Fix with Debug Logs');

    // 1. Prefer Environment Variable if available
    if (import.meta.env.VITE_API_BASE_URL) {
      console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
      return import.meta.env.VITE_API_BASE_URL;
    }

    // 2. Check if running on localhost
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      console.log('⚠️ Running on Localhost - Using http://localhost:5000');
      return 'http://localhost:5000';
    }

    // 3. Fallback to production URL (hardcoded to ensure it works on Vercel)
    console.log('🌍 Running on Production (Fallback) - Using https://nevostack-tool-backend-c717.vercel.app');
    return 'https://nevostack-tool-backend-c717.vercel.app';
  })(),

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/auth/profile',
      CHANGE_PASSWORD: '/api/auth/change-password',
      REGISTER: '/api/auth/register',
      REGISTER_COMPANY: '/api/auth/register-company'
    },

    // Users
    USERS: {
      BASE: '/api/users',
      PROFILE: (id: string) => `/api/users/${id}`,
      STATUS: (id: string) => `/api/users/${id}/status`,
      STATS: '/api/users/stats',
      BULK_ACTIONS: '/api/users/bulk',
      EXPORT: '/api/users/export',
      EXCHANGE_HOD: '/api/users/exchange-hod',
      EXCHANGE_MANAGER: '/api/users/exchange-manager'
    },

    // Departments
    DEPARTMENTS: {
      BASE: '/api/departments',
      BY_ID: (id: string) => `/api/departments/${id}`,
      EMPLOYEES: (id: string) => `/api/departments/${id}/employees`,
      STATS: '/api/departments/stats'
    },

    // Tasks
    TASKS: {
      BASE: '/api/tasks',
      BY_ID: (id: string) => `/api/tasks/${id}`,
      ASSIGN: '/api/tasks/assign',
      STATUS: (id: string) => `/api/tasks/${id}/status`,
      COMMENTS: (id: string) => `/api/tasks/${id}/comments`,
      ATTACHMENTS: (id: string) => `/api/tasks/${id}/attachments`,
      STATS: '/api/tasks/stats'
    },

    // Attendance
    ATTENDANCE: {
      BASE: '/api/attendance',
      CHECK_IN: '/api/attendance/check-in',
      CHECK_OUT: '/api/attendance/check-out',
      BY_ID: (id: string) => `/api/attendance/${id}`,
      STATS: '/api/attendance/stats',
      REPORTS: '/api/attendance/reports'
    },

    // Leave Management
    LEAVES: {
      BASE: '/api/leaves',
      BY_ID: (id: string) => `/api/leaves/${id}`,
      APPROVE: (id: string) => `/api/leaves/${id}/approve`,
      REJECT: (id: string) => `/api/leaves/${id}/reject`,
      BALANCE: '/api/leaves/balance',
      STATS: '/api/leaves/stats'
    },
    // Analytics
    ANALYTICS: {
      OVERVIEW: '/api/analytics/overview',
      DASHBOARD: '/api/analytics/dashboard',
      LEAVES_TIMESERIES: '/api/analytics/leaves/timeseries',
      LEAVES_TOP: '/api/analytics/leaves/top',
      ACTIVE_TASKS: '/api/analytics/active-tasks',
      TASKS_TIMESERIES: '/api/analytics/tasks/timeseries',
      TASK_STATUS_DISTRIBUTION: '/api/analytics/task-status-distribution',
      DEPARTMENTS: '/api/analytics/departments',
      // HOD specific endpoints
      HOD: {
        OVERVIEW: '/api/analytics/hod/overview',
        TASKS: '/api/analytics/hod/tasks',
        DEPARTMENT_TASKS: '/api/analytics/hod/department/tasks',
        DEPARTMENT_MEMBERS: '/api/analytics/hod/department/members',
        ANALYTICS: '/api/analytics/hod/analytics'
      }
    },

    // Meetings
    MEETINGS: {
      BASE: '/api/meetings',
      BY_ID: (id: string) => `/api/meetings/${id}`,
      STATUS: (id: string) => `/api/meetings/${id}/status`,
      PARTICIPANTS: (id: string) => `/api/meetings/${id}/participants`,
      STATS: '/api/meetings/stats'
    },

    // Events
    EVENTS: {
      BASE: '/api/events',
      BY_ID: (id: string) => `/api/events/${id}`,
      RSVP: (id: string) => `/api/events/${id}/rsvp`,
      STATS: '/api/events/stats'
    },

    // Notifications
    NOTIFICATIONS: {
      BASE: '/api/notifications',
      BY_ID: (id: string) => `/api/notifications/${id}`,
      READ: (id: string) => `/api/notifications/${id}/read`,
      READ_ALL: '/api/notifications/read-all',
      MARK_ALL_READ: '/api/notifications/mark-all-read'
    },

    // Device Management
    DEVICES: {
      BASE: '/api/devices',
      ACTIVITY: '/api/devices/activity',
      SETTINGS: '/api/devices/settings',
      TRUST: '/api/devices/trust',
      REVOKE: '/api/devices/revoke'
    },


    // File Upload
    FILES: {
      UPLOAD: '/api/files/upload',
      AVATAR: '/api/files/avatar',
      DOCUMENTS: '/api/files/documents',
      EXPORTS: '/api/files/exports'
    },


    // Workspaces
    WORKSPACES: {
      BASE: '/api/workspaces',
      BY_ID: (id: string) => `/api/workspaces/${id}`,
      BY_SUBDOMAIN: (subdomain: string) => `/api/workspaces/subdomain/${subdomain}`,
      UPGRADE: (id: string) => `/api/workspaces/${id}/upgrade`,
      STATS: '/api/workspaces/stats'
    },

    // Manager Dashboard
    MANAGER: {
      DASHBOARD: '/api/manager/dashboard',
      TEAM_MEMBERS: '/api/manager/team-members',
      URGENT_TASKS: '/api/manager/urgent-tasks',
      OVERDUE_TASKS: '/api/manager/overdue-tasks',
      TEAM_PERFORMANCE: '/api/manager/team-performance',
      MEMBER_TASKS: (memberId: string) => `/api/manager/member-tasks/${memberId}`,
      PROFILE: '/api/manager/profile',
      PROFILE_DETAILS: '/api/manager/profile/details',
      PROFILE_AVATAR: '/api/manager/profile/avatar',
      // Team Management endpoints
      TEAM_MANAGEMENT_OVERVIEW: '/api/manager/team-management/overview',
      TEAM_MEMBER_DETAILS: (memberId: string) => `/api/manager/team-management/member/${memberId}`,
      TEAM_MEMBER_STATUS: (memberId: string) => `/api/manager/team-management/member/${memberId}/status`,
      TEAM_PERFORMANCE_ANALYTICS: '/api/manager/team-management/performance'
    },

    // Member Dashboard
    MEMBERS: {
      DASHBOARD: '/api/members/dashboard',
      TASKS: '/api/members/tasks',
      PROFILE: '/api/members/profile',
      PROFILE_DETAILS: '/api/members/profile/details',
      PROFILE_AVATAR: '/api/members/profile/avatar',
      TEAM: '/api/members/team',
      STATS: '/api/members/stats',
      // Quick Actions
      QUICK_ACTIONS: {
        REQUEST_LEAVE: '/api/members/quick-actions/request-leave',
        UPCOMING_MEETINGS: '/api/members/quick-actions/upcoming-meetings',
        RECENT_TASKS: '/api/members/quick-actions/recent-tasks'
      }
    },

    // HOD Dashboard
    HOD: {
      PROFILE: '/api/hod/profile',
      PROFILE_DETAILS: '/api/hod/profile/details',
      PROFILE_AVATAR: '/api/hod/profile/avatar'
    },

    // HR Dashboard
    HR: {
      PROFILE: '/api/hr/profile',
      PROFILE_DETAILS: '/api/hr/profile/details',
      PROFILE_AVATAR: '/api/hr/profile/avatar'
    },

    // Companies
    COMPANIES: {
      BASE: '/api/companies',
      BY_ID: (id: string) => `/api/companies/${id}`,
      STATS: '/api/companies/stats',
      STATUS: (id: string) => `/api/companies/${id}/status`,
      SUBSCRIPTION: (id: string) => `/api/companies/${id}/subscription`,
      USERS: (id: string) => `/api/companies/${id}/users`
    },

    // SaaS Super Admin
    SAAS: {
      DASHBOARD_STATS: '/api/saas/dashboard/stats',
      MONTHLY_TRENDS: '/api/saas/monthly-trends',
      COMPANIES: '/api/saas/companies',
      COMPANY_DETAILS: (id: string) => `/api/saas/companies/${id}`,
      COMPANY_STATUS: (id: string) => `/api/saas/companies/${id}/status`,
      COMPANY_SUBSCRIPTION: (id: string) => `/api/saas/companies/${id}/subscription`,
      ANALYTICS: '/api/saas/analytics',
      ACTIVITY: '/api/saas/activity',
      PLANS: '/api/saas/plans',
      PLAN_DETAILS: (id: string) => `/api/saas/plans/${id}`,
      USERS: '/api/saas/users',
      USER_DETAILS: (id: string) => `/api/saas/users/${id}`,
      AUDIT_LOGS: '/api/saas/audit-logs',
      AUDIT_ANALYTICS: '/api/saas/audit-logs/analytics',
      AUDIT_EXPORT: '/api/saas/audit-logs/export',
      PLATFORM_SETTINGS: '/api/saas/platform-settings',
      CHANGE_USERNAME: '/api/saas/change-username'
    }
  },

  // Request Configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // Timeout settings
  TIMEOUT: 30000, // 30 seconds

  // Retry configuration
  RETRY: {
    attempts: 3,
    delay: 1000 // 1 second
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNKNOWN: 'An unexpected error occurred.'
} as const;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

// Request options
export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
