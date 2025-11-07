import { apiService } from './apiService';
import { API_CONFIG, type ApiResponse } from '@/config/api';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  category: string;
  tags: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    author: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  category?: string;
  tags?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  progress?: number;
}

export interface TaskFilters {
  search?: string;
  assignedTo?: string;
  assignedBy?: string;
  priority?: string;
  status?: string;
  category?: string;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  tasksByCategory: Record<string, number>;
  averageCompletionTime: number;
  productivity: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

class TaskService {
  // Get all tasks with pagination and filters
  async getTasks(
    page: number = 1,
    limit: number = 20,
    filters: TaskFilters = {}
  ): Promise<ApiResponse<Task[]>> {
    return apiService.getPaginated<Task>(API_CONFIG.ENDPOINTS.TASKS.BASE, {
      page,
      limit,
      filters
    });
  }

  // Get HR Management tasks (excludes completed, blocked, cancelled, and overdue tasks)
  async getHRManagementTasks(
    page: number = 1,
    limit: number = 500,
    filters: TaskFilters = {}
  ): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/hr-management`, {
      page,
      limit,
      ...filters
    });
  }

  // Get tasks for multiple assignees (manager's team)
  async getTasksByAssignedToList(
    memberIds: string[],
    page: number = 1,
    limit: number = 1000,
    filters: TaskFilters = {}
  ): Promise<ApiResponse<Task[]>> {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return { success: true, data: [] } as ApiResponse<Task[]>;
    }

    // Backend expects a comma separated list for assignedTo (or handles repeated params)
    const assignedTo = memberIds.join(',');
    return apiService.getPaginated<Task>(API_CONFIG.ENDPOINTS.TASKS.BASE, {
      page,
      limit,
      filters: {
        ...filters,
        assignedTo
      }
    });
  }

  // Get task by ID
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return apiService.get<Task>(API_CONFIG.ENDPOINTS.TASKS.BY_ID(id));
  }

  // Create new task
  async createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return apiService.post<Task>(API_CONFIG.ENDPOINTS.TASKS.BASE, taskData);
  }

  // Update task
  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return apiService.put<Task>(API_CONFIG.ENDPOINTS.TASKS.BY_ID(id), taskData);
  }

  // Delete task
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(API_CONFIG.ENDPOINTS.TASKS.BY_ID(id));
  }

  // Update task status
  async updateTaskStatus(id: string, status: Task['status']): Promise<ApiResponse<Task>> {
    return apiService.patch<Task>(API_CONFIG.ENDPOINTS.TASKS.STATUS(id), { status });
  }

  // Update task progress
  async updateTaskProgress(id: string, progress: number): Promise<ApiResponse<Task>> {
    return apiService.patch<Task>(API_CONFIG.ENDPOINTS.TASKS.BY_ID(id), { progress });
  }

  // Assign task to user
  async assignTask(id: string, assignedTo: string): Promise<ApiResponse<Task>> {
    return apiService.post<Task>(API_CONFIG.ENDPOINTS.TASKS.ASSIGN, {
      taskId: id,
      assignedTo
    });
  }

  // Get my tasks
  async getMyTasks(filters: Omit<TaskFilters, 'assignedTo'> = {}): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/my-tasks`, {
      headers: {
        'X-Filters': JSON.stringify(filters)
      }
    });
  }

  // Get tasks assigned by me
  async getTasksAssignedByMe(filters: TaskFilters = {}): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/assigned-by-me`, {
      headers: {
        'X-Filters': JSON.stringify(filters)
      }
    });
  }

  // Get overdue tasks
  async getOverdueTasks(): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/overdue`);
  }

  // Get task statistics
  async getTaskStats(userId?: string): Promise<ApiResponse<TaskStats>> {
    const endpoint = userId 
      ? `${API_CONFIG.ENDPOINTS.TASKS.STATS}?userId=${userId}`
      : API_CONFIG.ENDPOINTS.TASKS.STATS;
    return apiService.get<TaskStats>(endpoint);
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<ApiResponse<TaskComment[]>> {
    return apiService.get<TaskComment[]>(API_CONFIG.ENDPOINTS.TASKS.COMMENTS(taskId));
  }

  async addTaskComment(taskId: string, text: string): Promise<ApiResponse<TaskComment>> {
    return apiService.post<TaskComment>(API_CONFIG.ENDPOINTS.TASKS.COMMENTS(taskId), { text });
  }

  async updateTaskComment(taskId: string, commentId: string, text: string): Promise<ApiResponse<TaskComment>> {
    return apiService.put<TaskComment>(`${API_CONFIG.ENDPOINTS.TASKS.COMMENTS(taskId)}/${commentId}`, { text });
  }

  async deleteTaskComment(taskId: string, commentId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`${API_CONFIG.ENDPOINTS.TASKS.COMMENTS(taskId)}/${commentId}`);
  }

  // Task Attachments
  async getTaskAttachments(taskId: string): Promise<ApiResponse<Task['attachments']>> {
    return apiService.get<Task['attachments']>(API_CONFIG.ENDPOINTS.TASKS.ATTACHMENTS(taskId));
  }

  async uploadTaskAttachment(taskId: string, file: File): Promise<ApiResponse<Task['attachments'][0]>> {
    return apiService.upload<Task['attachments'][0]>(
      API_CONFIG.ENDPOINTS.TASKS.ATTACHMENTS(taskId),
      file
    );
  }

  async deleteTaskAttachment(taskId: string, attachmentId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`${API_CONFIG.ENDPOINTS.TASKS.ATTACHMENTS(taskId)}/${attachmentId}`);
  }

  // Bulk operations
  async bulkUpdateTasks(ids: string[], updateData: UpdateTaskRequest): Promise<ApiResponse<Task[]>> {
    return apiService.bulkOperation<Task[]>(
      API_CONFIG.ENDPOINTS.TASKS.BASE,
      'update',
      ids,
      updateData
    );
  }

  async bulkDeleteTasks(ids: string[]): Promise<ApiResponse<void>> {
    return apiService.bulkOperation<void>(
      API_CONFIG.ENDPOINTS.TASKS.BASE,
      'delete',
      ids
    );
  }

  async bulkChangeStatus(ids: string[], status: Task['status']): Promise<ApiResponse<Task[]>> {
    return apiService.bulkOperation<Task[]>(
      API_CONFIG.ENDPOINTS.TASKS.BASE,
      'status',
      ids,
      { status }
    );
  }

  async bulkAssignTasks(ids: string[], assignedTo: string): Promise<ApiResponse<Task[]>> {
    return apiService.bulkOperation<Task[]>(
      API_CONFIG.ENDPOINTS.TASKS.BASE,
      'assign',
      ids,
      { assignedTo }
    );
  }

  // Search and filtering
  async searchTasks(query: string, limit: number = 10): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getTasksByCategory(category: string): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}?category=${category}`);
  }

  async getTasksByPriority(priority: Task['priority']): Promise<ApiResponse<Task[]>> {
    return apiService.get<Task[]>(`${API_CONFIG.ENDPOINTS.TASKS.BASE}?priority=${priority}`);
  }

  // Export tasks
  async exportTasks(filters: TaskFilters = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...filters
    });
    
    return apiService.downloadFile(
      `${API_CONFIG.ENDPOINTS.TASKS.BASE}/export?${params}`,
      `tasks_export_${new Date().toISOString().split('T')[0]}.${format}`
    );
  }

  // Time tracking
  async startTimer(taskId: string): Promise<ApiResponse<void>> {
    return apiService.post<void>(`${API_CONFIG.ENDPOINTS.TASKS.BY_ID(taskId)}/timer/start`);
  }

  async stopTimer(taskId: string): Promise<ApiResponse<{ timeSpent: number }>> {
    return apiService.post<{ timeSpent: number }>(`${API_CONFIG.ENDPOINTS.TASKS.BY_ID(taskId)}/timer/stop`);
  }

  async logTime(taskId: string, hours: number, description?: string): Promise<ApiResponse<void>> {
    return apiService.post<void>(`${API_CONFIG.ENDPOINTS.TASKS.BY_ID(taskId)}/time`, {
      hours,
      description
    });
  }

  async getTimeLog(taskId: string): Promise<ApiResponse<Array<{
    id: string;
    hours: number;
    description: string;
    date: string;
    user: string;
  }>>> {
    return apiService.get<Array<{
      id: string;
      hours: number;
      description: string;
      date: string;
      user: string;
    }>>(`${API_CONFIG.ENDPOINTS.TASKS.BY_ID(taskId)}/time`);
  }
}

export const taskService = new TaskService();
export default taskService;
