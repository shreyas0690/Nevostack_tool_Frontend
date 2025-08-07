export type EventVisibility = 'all' | 'managers_only' | 'department_specific' | 'role_specific' | 'user_specific';

export type EventType = 'meeting' | 'training' | 'announcement' | 'celebration' | 'deadline' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  posterImage?: string;
  attachedFiles?: EventFile[];
  isOnline: boolean;
  meetingLink?: string;
  visibility: EventVisibility;
  allowedDepartments?: string[];
  allowedRoles?: string[];
  allowedUsers?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface EventFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface EventPermission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}