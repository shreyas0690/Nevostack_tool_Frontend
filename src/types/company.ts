export type UserRole = 'super_admin' | 'admin' | 'department_head' | 'manager' | 'member' | 'hr' | 'hr_manager' | 'person';

export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  role: UserRole;
  departmentId?: string;
  companyId?: string;
  managerId?: string;
  managedMemberIds?: string[];
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
  companyId?: string;
  status?: 'active' | 'inactive' | 'archived' | 'pending';
  type?: 'main' | 'sub' | 'project' | 'temporary';
  level?: number;
  settings?: {
    allowLeaveRequests?: boolean;
    requireManagerApproval?: boolean;
    maxLeaveDays?: number;
    workingHours?: {
      start: string;
      end: string;
    };
    workingDays?: string[];
    allowUserCreation?: boolean;
    allowUserDeletion?: boolean;
    requireApprovalForChanges?: boolean;
    autoAssignManager?: boolean;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
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

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | string[] | any;
  assignedToList?: Array<string | { id?: string; _id?: string; name?: string; fullName?: string; email?: string }>;
  assignedBy: string;
  assignedByRole?: UserRole; // Track the role of who assigned the task
  departmentId: string;
  managerId?: string; // Track which manager this task is under
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  comments?: TaskComment[];
  meeting?: TaskMeeting;
  attachments?: TaskAttachment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}
