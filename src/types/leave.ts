export type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid' | 'compensatory';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  managerId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  rejectionReason?: string;
  documents?: string[];
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveType;
  totalAllowed: number;
  used: number;
  remaining: number;
  carryForward: number;
  year: number;
}

export interface LeavePolicy {
  id: string;
  departmentId?: string;
  leaveType: LeaveType;
  daysAllowed: number;
  carryForwardLimit: number;
  minAdvanceNotice: number; // days
  maxConsecutiveDays: number;
  requiresDocument: boolean;
  approverId: string[];
}

export const leaveTypeConfig = {
  annual: { label: 'Annual Leave', color: '#3B82F6', maxDays: 21 },
  sick: { label: 'Sick Leave', color: '#EF4444', maxDays: 10 },
  maternity: { label: 'Maternity Leave', color: '#EC4899', maxDays: 90 },
  paternity: { label: 'Paternity Leave', color: '#8B5CF6', maxDays: 15 },
  emergency: { label: 'Emergency Leave', color: '#F59E0B', maxDays: 5 },
  unpaid: { label: 'Unpaid Leave', color: '#6B7280', maxDays: 30 },
  compensatory: { label: 'Compensatory Leave', color: '#10B981', maxDays: 12 },
};