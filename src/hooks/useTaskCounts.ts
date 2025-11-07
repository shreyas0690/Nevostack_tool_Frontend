import { useMemo } from 'react';
import { mockTasks } from '@/data/mockData';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useTaskCounts = () => {
  const { currentUser } = useAuth();

  const taskCounts = useMemo(() => {
    if (!currentUser) {
      return {
        myTasks: 0,
        teamTasks: 0,
        departmentTasks: 0,
        allTasks: 0,
        pendingTasks: 0,
        urgentTasks: 0
      };
    }

    // My personal tasks (assigned to me)
    const myTasks = mockTasks.filter(task => 
      task.assignedTo === currentUser.id && task.status !== 'completed'
    ).length;

    // Team tasks (for managers - tasks assigned to team members)
    const teamTasks = mockTasks.filter(task => {
      if (currentUser.role === 'manager') {
        // Find users who report to this manager
        return task.managerId === currentUser.id && task.status !== 'completed';
      }
      return 0;
    }).length;

    // Department tasks (for HOD - tasks in their department)
    const departmentTasks = mockTasks.filter(task => {
      if (currentUser.role === 'department_head') {
        return task.departmentId === currentUser.departmentId && task.status !== 'completed';
      }
      return 0;
    }).length;

    // All system tasks (for super admin)
    const allTasks = mockTasks.filter(task => task.status !== 'completed').length;

    // Get relevant tasks based on user role
    let relevantTasks = [];
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      relevantTasks = mockTasks;
    } else if (currentUser.role === 'department_head') {
      relevantTasks = mockTasks.filter(t => t.departmentId === currentUser.departmentId);
    } else if (currentUser.role === 'manager') {
      relevantTasks = mockTasks.filter(t => t.managerId === currentUser.id || t.assignedTo === currentUser.id);
    } else {
      relevantTasks = mockTasks.filter(t => t.assignedTo === currentUser.id);
    }

    // Pending tasks (tasks assigned but not started)
    const pendingTasks = relevantTasks.filter(t => t.status === 'assigned').length;

    // Urgent tasks
    const urgentTasks = relevantTasks.filter(t => 
      (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
    ).length;

    // Overdue tasks
    const overdueTasks = relevantTasks.filter(task => {
      return new Date(task.dueDate) < new Date() && task.status !== 'completed';
    }).length;

    return {
      myTasks,
      teamTasks,
      departmentTasks,
      allTasks,
      pendingTasks,
      urgentTasks,
      overdueTasks
    };
  }, [currentUser]);

  return taskCounts;
};
