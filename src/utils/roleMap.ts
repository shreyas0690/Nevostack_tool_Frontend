export type UiRole =
  | 'super_admin'
  | 'admin'
  | 'department_head'
  | 'manager'
  | 'member'
  | 'hr'
  | 'hr_manager'
  | 'person';

// Map backend roles to UI roles
export function toUiRole(role: string | undefined | null): UiRole | string {
  if (!role) return '';
  switch (role) {
    case 'hod':
      return 'department_head';
    // Keep super_admin as-is
    default:
      return role;
  }
}

// Map UI roles to backend roles
export function toApiRole(role: string | undefined | null): string {
  if (!role) return '';
  switch (role) {
    case 'department_head':
      return 'hod';
    case 'admin':
      // If backend doesn’t have admin, map to super_admin
      return 'super_admin';
    default:
      return role;
  }
}

export function isAdminRole(role: string | undefined | null): boolean {
  const r = toUiRole(role || '') as string;
  return r === 'admin' || r === 'super_admin';
}

