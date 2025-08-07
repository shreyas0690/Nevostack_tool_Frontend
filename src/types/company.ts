export type UserRole = 'super_admin' | 'admin' | 'department_head' | 'manager' | 'executive';

export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  managerId?: string;
  avatar?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headId?: string;
  managerIds: string[];
  memberIds: string[];
  color: string;
  memberCount: number;
  createdAt: Date;
}

export interface TaskMeeting {
  enabled: boolean;
  type: 'department' | 'user';
  selectedDepartments?: string[];
  selectedUsers?: string[];
  meetingDate?: Date;
  meetingTime?: string;
  meetingLocation?: string;
  meetingLink?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  assignedBy: string;
  departmentId: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  comments?: TaskComment[];
  meeting?: TaskMeeting;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}