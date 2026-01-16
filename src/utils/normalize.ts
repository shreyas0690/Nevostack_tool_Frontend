import { toUiRole } from './roleMap';

// Safely extract a department id from various backend shapes
export function getDepartmentId(input: any): string {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    if (input._id) return String(input._id);
    if (input.id) return String(input.id);
  }
  return '';
}

// Normalize a user object to consistent UI shape
export function normalizeUser<T extends Record<string, any>>(user: T) {
  const departmentId = user?.departmentId
    ? getDepartmentId(user.departmentId)
    : user?.department
    ? getDepartmentId(user.department)
    : '';

  return {
    ...user,
    role: toUiRole(user?.role),
    departmentId,
  };
}

// Normalize a department object to ensure id/headId presence
export function normalizeDepartment<T extends Record<string, any>>(dept: T) {
  const id = getDepartmentId(dept?.id ?? dept?._id ?? '');

  // Try to infer headId from common shapes
  let headId = '';
  if (dept?.headId) headId = getDepartmentId(dept.headId);
  else if (dept?.hod) headId = getDepartmentId(dept.hod);
  else if (dept?.head) headId = getDepartmentId(dept.head);

  return {
    ...dept,
    id,
    headId,
  };
}

