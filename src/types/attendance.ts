export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  loginTime: Date;
  logoutTime?: Date;
  loginDate: string;
  sessionId: string;
  isLate?: boolean;
  workingHours?: number;
}

export interface AttendanceData {
  records: AttendanceRecord[];
  lastUpdated: Date;
}