import { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceData } from '@/types/attendance';
import { dummyAttendanceData } from '@/data/attendanceData';

const ATTENDANCE_STORAGE_KEY = 'nevostack_attendance';

export function useAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    records: dummyAttendanceData,
    lastUpdated: new Date()
  });

  useEffect(() => {
    // Load attendance data from localStorage
    const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setAttendanceData({
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
        records: parsed.records.map((record: any) => ({
          ...record,
          loginTime: new Date(record.loginTime)
        }))
      });
    } else {
      // Initialize with dummy data if no stored data
      const initialData = {
        records: dummyAttendanceData,
        lastUpdated: new Date()
      };
      setAttendanceData(initialData);
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(initialData));
    }
  }, []);

  const recordAttendance = (userId: string, userName: string) => {
    const now = new Date();
    const workStartTime = new Date(now);
    workStartTime.setHours(9, 0, 0, 0); // 9:00 AM office start time
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId,
      userName,
      loginTime: now,
      loginDate: now.toISOString().split('T')[0],
      sessionId: `session_${Date.now()}_${userId}`,
      isLate: now > workStartTime
    };

    const updatedData: AttendanceData = {
      records: [newRecord, ...attendanceData.records],
      lastUpdated: now
    };

    setAttendanceData(updatedData);
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedData));
  };

  const getAttendanceByDate = (date: string) => {
    return attendanceData.records.filter(record => record.loginDate === date);
  };

  const getAttendanceByUser = (userId: string) => {
    return attendanceData.records.filter(record => record.userId === userId);
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return getAttendanceByDate(today);
  };

  const recordLogout = (userId: string) => {
    const now = new Date();
    const updatedRecords = attendanceData.records.map(record => {
      if (record.userId === userId && record.loginDate === now.toISOString().split('T')[0] && !record.logoutTime) {
        const workingHours = (now.getTime() - record.loginTime.getTime()) / (1000 * 60 * 60);
        return {
          ...record,
          logoutTime: now,
          workingHours: Number(workingHours.toFixed(2))
        };
      }
      return record;
    });

    const updatedData: AttendanceData = {
      records: updatedRecords,
      lastUpdated: now
    };

    setAttendanceData(updatedData);
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedData));
  };

  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = getAttendanceByDate(today);
    const totalUsers = new Set(attendanceData.records.map(r => r.userId)).size;
    const presentToday = todayRecords.length;
    const lateToday = todayRecords.filter(r => r.isLate).length;
    const avgWorkingHours = attendanceData.records
      .filter(r => r.workingHours)
      .reduce((sum, r) => sum + (r.workingHours || 0), 0) / 
      attendanceData.records.filter(r => r.workingHours).length || 0;

    return {
      totalUsers,
      presentToday,
      lateToday,
      avgWorkingHours: Number(avgWorkingHours.toFixed(2)),
      attendanceRate: totalUsers > 0 ? Number(((presentToday / totalUsers) * 100).toFixed(1)) : 0
    };
  };

  return {
    attendanceData,
    recordAttendance,
    recordLogout,
    getAttendanceByDate,
    getAttendanceByUser,
    getTodayAttendance,
    getAttendanceStats
  };
}