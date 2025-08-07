import { LeaveRequest, LeaveBalance, LeavePolicy } from "@/types/leave";

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeId: '5',
    employeeName: 'Alex Rodriguez',
    departmentId: '1',
    managerId: '4',
    leaveType: 'annual',
    startDate: new Date('2024-02-20'),
    endDate: new Date('2024-02-23'),
    totalDays: 4,
    reason: 'Family vacation planned',
    status: 'pending',
    appliedDate: new Date('2024-02-10'),
  },
  {
    id: '2',
    employeeId: '4',
    employeeName: 'Emily Chen',
    departmentId: '1',
    managerId: '3',
    leaveType: 'sick',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-16'),
    totalDays: 2,
    reason: 'Fever and flu symptoms',
    status: 'approved',
    appliedDate: new Date('2024-02-14'),
    approvedBy: '3',
    approvedDate: new Date('2024-02-14'),
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'Mike Davis',
    departmentId: '1',
    managerId: '2',
    leaveType: 'compensatory',
    startDate: new Date('2024-02-25'),
    endDate: new Date('2024-02-25'),
    totalDays: 1,
    reason: 'Overtime compensation for weekend work',
    status: 'approved',
    appliedDate: new Date('2024-02-18'),
    approvedBy: '2',
    approvedDate: new Date('2024-02-19'),
  },
  {
    id: '4',
    employeeId: '5',
    employeeName: 'Alex Rodriguez',
    departmentId: '1',
    managerId: '4',
    leaveType: 'emergency',
    startDate: new Date('2024-01-28'),
    endDate: new Date('2024-01-28'),
    totalDays: 1,
    reason: 'Medical emergency in family',
    status: 'rejected',
    appliedDate: new Date('2024-01-27'),
    approvedBy: '4',
    approvedDate: new Date('2024-01-28'),
    rejectionReason: 'Insufficient advance notice for emergency leave',
  },
];

export const mockLeaveBalances: LeaveBalance[] = [
  // Alex Rodriguez balances
  { employeeId: '5', leaveType: 'annual', totalAllowed: 21, used: 8, remaining: 13, carryForward: 0, year: 2024 },
  { employeeId: '5', leaveType: 'sick', totalAllowed: 10, used: 2, remaining: 8, carryForward: 0, year: 2024 },
  { employeeId: '5', leaveType: 'emergency', totalAllowed: 5, used: 1, remaining: 4, carryForward: 0, year: 2024 },
  
  // Emily Chen balances
  { employeeId: '4', leaveType: 'annual', totalAllowed: 21, used: 5, remaining: 16, carryForward: 2, year: 2024 },
  { employeeId: '4', leaveType: 'sick', totalAllowed: 10, used: 3, remaining: 7, carryForward: 0, year: 2024 },
  
  // Mike Davis balances
  { employeeId: '3', leaveType: 'annual', totalAllowed: 25, used: 12, remaining: 13, carryForward: 3, year: 2024 },
  { employeeId: '3', leaveType: 'sick', totalAllowed: 12, used: 4, remaining: 8, carryForward: 0, year: 2024 },
  { employeeId: '3', leaveType: 'compensatory', totalAllowed: 12, used: 6, remaining: 6, carryForward: 0, year: 2024 },
];

export const mockLeavePolicies: LeavePolicy[] = [
  {
    id: '1',
    leaveType: 'annual',
    daysAllowed: 21,
    carryForwardLimit: 5,
    minAdvanceNotice: 7,
    maxConsecutiveDays: 15,
    requiresDocument: false,
    approverId: ['4', '3', '2'], // Manager -> Dept Head -> Admin
  },
  {
    id: '2',
    leaveType: 'sick',
    daysAllowed: 10,
    carryForwardLimit: 0,
    minAdvanceNotice: 0,
    maxConsecutiveDays: 5,
    requiresDocument: true,
    approverId: ['4', '3'],
  },
  {
    id: '3',
    leaveType: 'emergency',
    daysAllowed: 5,
    carryForwardLimit: 0,
    minAdvanceNotice: 0,
    maxConsecutiveDays: 3,
    requiresDocument: true,
    approverId: ['4', '3', '2'],
  },
  {
    id: '4',
    leaveType: 'maternity',
    daysAllowed: 90,
    carryForwardLimit: 0,
    minAdvanceNotice: 30,
    maxConsecutiveDays: 90,
    requiresDocument: true,
    approverId: ['3', '2', '1'], // Dept Head -> Admin -> Super Admin
  },
];