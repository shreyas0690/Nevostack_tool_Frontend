import { User, UserRole } from '@/types/company';

// Permission levels and roles hierarchy
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'super_admin': 100,
  'admin': 90,
  'department_head': 80,
  'hr_manager': 70,
  'hr': 60,
  'manager': 50,
  'member': 40,
  'person': 30,
};

// HOD specific permissions
export const HOD_PERMISSIONS = {
  // Team Management
  ADD_TEAM_MEMBER: 'add_team_member',
  EDIT_TEAM_MEMBER: 'edit_team_member',
  DELETE_TEAM_MEMBER: 'delete_team_member',
  VIEW_TEAM_MEMBER: 'view_team_member',
  
  // Manager Assignment
  ASSIGN_MANAGER: 'assign_manager',
  REMOVE_MANAGER: 'remove_manager',
  
  // Task Management
  ASSIGN_TASK: 'assign_task',
  VIEW_ALL_DEPARTMENT_TASKS: 'view_all_department_tasks',
  UPDATE_TASK_STATUS: 'update_task_status',
  
  // Analytics & Reports
  VIEW_DEPARTMENT_ANALYTICS: 'view_department_analytics',
  VIEW_TEAM_PERFORMANCE: 'view_team_performance',
  
  // Department Settings
  MANAGE_DEPARTMENT_SETTINGS: 'manage_department_settings',
  BULK_OPERATIONS: 'bulk_operations',
} as const;

export type HODPermission = typeof HOD_PERMISSIONS[keyof typeof HOD_PERMISSIONS];

/**
 * Check if user has required role level
 */
export function hasMinimumRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user is HOD of specific department
 */
export function isHODOfDepartment(user: User | null, departmentId: string): boolean {
  if (!user || !departmentId) return false;
  
  return (
    user.role === 'department_head' && 
    user.departmentId === departmentId
  );
}

/**
 * Check if user can manage specific department member
 */
export function canManageDepartmentMember(
  currentUser: User | null, 
  targetUser: User, 
  departmentId: string
): boolean {
  if (!currentUser || !targetUser) return false;
  
  // Super admin and admin can manage anyone
  if (hasMinimumRole(currentUser, 'admin')) return true;
  
  // HOD can manage members in their department
  if (isHODOfDepartment(currentUser, departmentId)) {
    // Cannot manage other HODs or higher roles
    if (hasMinimumRole(targetUser, 'department_head')) return false;
    
    // Can manage members and managers in their department
    return targetUser.departmentId === departmentId;
  }
  
  // Manager can manage their direct reports
  if (currentUser.role === 'manager') {
    return targetUser.managerId === currentUser.id;
  }
  
  return false;
}

/**
 * Check specific HOD permission
 */
export function hasHODPermission(
  user: User | null, 
  permission: HODPermission, 
  departmentId?: string,
  targetUser?: User
): boolean {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  // Admin has most permissions
  if (user.role === 'admin') {
    return ![
      HOD_PERMISSIONS.MANAGE_DEPARTMENT_SETTINGS
    ].includes(permission);
  }
  
  // Check if user is HOD of the department
  if (!departmentId || !isHODOfDepartment(user, departmentId)) {
    return false;
  }
  
  // HOD specific permission checks
  switch (permission) {
    case HOD_PERMISSIONS.ADD_TEAM_MEMBER:
    case HOD_PERMISSIONS.VIEW_TEAM_MEMBER:
    case HOD_PERMISSIONS.VIEW_ALL_DEPARTMENT_TASKS:
    case HOD_PERMISSIONS.VIEW_DEPARTMENT_ANALYTICS:
    case HOD_PERMISSIONS.VIEW_TEAM_PERFORMANCE:
    case HOD_PERMISSIONS.ASSIGN_TASK:
      return true;
      
    case HOD_PERMISSIONS.EDIT_TEAM_MEMBER:
    case HOD_PERMISSIONS.DELETE_TEAM_MEMBER:
    case HOD_PERMISSIONS.ASSIGN_MANAGER:
    case HOD_PERMISSIONS.REMOVE_MANAGER:
      // Cannot modify department heads or higher roles
      if (targetUser && hasMinimumRole(targetUser, 'department_head')) {
        return false;
      }
      return true;
      
    case HOD_PERMISSIONS.UPDATE_TASK_STATUS:
      return true;
      
    case HOD_PERMISSIONS.MANAGE_DEPARTMENT_SETTINGS:
    case HOD_PERMISSIONS.BULK_OPERATIONS:
      return true;
      
    default:
      return false;
  }
}

/**
 * Get available actions for a user in HOD context
 */
export function getAvailableHODActions(
  currentUser: User | null,
  targetUser: User | null,
  departmentId: string
): HODPermission[] {
  const availableActions: HODPermission[] = [];
  
  if (!currentUser || !departmentId) return availableActions;
  
  // Check each permission
  Object.values(HOD_PERMISSIONS).forEach(permission => {
    if (hasHODPermission(currentUser, permission, departmentId, targetUser || undefined)) {
      availableActions.push(permission);
    }
  });
  
  return availableActions;
}

/**
 * Check if user can perform bulk operations
 */
export function canPerformBulkOperations(user: User | null, departmentId: string): boolean {
  return hasHODPermission(user, HOD_PERMISSIONS.BULK_OPERATIONS, departmentId);
}

/**
 * Check if user can view sensitive department information
 */
export function canViewSensitiveInfo(user: User | null, departmentId: string): boolean {
  if (!user) return false;
  
  return (
    hasMinimumRole(user, 'admin') ||
    isHODOfDepartment(user, departmentId)
  );
}

/**
 * Validate department access for current user
 */
export function validateDepartmentAccess(
  user: User | null, 
  departmentId: string
): { hasAccess: boolean; reason?: string } {
  if (!user) {
    return { hasAccess: false, reason: 'User not authenticated' };
  }
  
  if (!departmentId) {
    return { hasAccess: false, reason: 'Department ID required' };
  }
  
  // Super admin and admin have access to all departments
  if (hasMinimumRole(user, 'admin')) {
    return { hasAccess: true };
  }
  
  // HOD has access to their own department
  if (isHODOfDepartment(user, departmentId)) {
    return { hasAccess: true };
  }
  
  // Manager/Member have limited access to their own department
  if (user.departmentId === departmentId) {
    return { 
      hasAccess: true, 
      reason: 'Limited access - same department member' 
    };
  }
  
  return { 
    hasAccess: false, 
    reason: 'Insufficient permissions for this department' 
  };
}

