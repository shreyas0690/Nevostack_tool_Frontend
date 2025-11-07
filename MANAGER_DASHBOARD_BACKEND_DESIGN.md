# Manager Dashboard Backend Design

## Overview
This document outlines the backend API design for the Manager Dashboard, specifically focusing on the "Team Tasks" section that should show both manager's tasks and team members' tasks with proper filtering.

## API Endpoints

### 1. Manager Dashboard Overview
**Endpoint:** `GET /api/manager/dashboard`

**Purpose:** Get comprehensive dashboard data for a manager including team tasks, statistics, and overview.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "teamMembers": 5,
    "teamTasks": 12,
    "completionRate": 75,
    "urgent": {
      "count": 3,
      "tasks": [...]
    },
    "overdue": {
      "count": 1,
      "tasks": [...]
    },
    "recentTasks": [
      {
        "_id": "task_id",
        "title": "Task Title",
        "description": "Task Description",
        "assignedTo": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@company.com",
          "role": "member"
        },
        "assignedBy": {
          "_id": "manager_id",
          "firstName": "Manager",
          "lastName": "Name",
          "email": "manager@company.com"
        },
        "companyId": "company_id",
        "departmentId": {
          "_id": "dept_id",
          "name": "Engineering"
        },
        "priority": "high",
        "status": "in_progress",
        "dueDate": "2024-01-15T10:00:00Z",
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2024-01-12T10:00:00Z",
        "progress": 60
      }
    ]
  }
}
```

### 2. Team Members
**Endpoint:** `GET /api/manager/team-members`

**Purpose:** Get list of team members under the manager with their task statistics.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "teamMembers": [
      {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "role": "member",
        "position": "Developer",
        "departmentId": {
          "_id": "dept_id",
          "name": "Engineering"
        },
        "taskStats": {
          "total": 8,
          "completed": 6,
          "inProgress": 2,
          "urgent": 1,
          "overdue": 0,
          "completionRate": 75
        }
      }
    ],
    "totalMembers": 5
  }
}
```

## Backend Implementation Requirements

### 1. Manager Dashboard Service
```javascript
// backend/services/managerService.js

class ManagerService {
  async getDashboard(managerId) {
    // Get manager's team members
    const teamMembers = await this.getTeamMembers(managerId);
    const teamMemberIds = teamMembers.map(member => member._id);
    
    // Get all tasks for manager and team members
    const allTasks = await Task.find({
      $or: [
        { assignedTo: managerId },
        { assignedTo: { $in: teamMemberIds } }
      ]
    }).populate('assignedTo assignedBy departmentId');
    
    // Filter active tasks (not completed, blocked, or overdue)
    const activeTasks = allTasks.filter(task => {
      const isNotCompleted = task.status !== 'completed';
      const isNotBlocked = task.status !== 'blocked';
      const isNotOverdue = !task.dueDate || new Date(task.dueDate) >= new Date();
      return isNotCompleted && isNotBlocked && isNotOverdue;
    });
    
    // Calculate statistics
    const urgentTasks = activeTasks.filter(task => task.priority === 'urgent');
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    );
    
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const completionRate = allTasks.length > 0 ? 
      Math.round((completedTasks.length / allTasks.length) * 100) : 0;
    
    return {
      teamMembers: teamMembers.length,
      teamTasks: activeTasks.length,
      completionRate,
      urgent: {
        count: urgentTasks.length,
        tasks: urgentTasks.slice(0, 5) // Limit to 5 for dashboard
      },
      overdue: {
        count: overdueTasks.length,
        tasks: overdueTasks.slice(0, 5) // Limit to 5 for dashboard
      },
      recentTasks: activeTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10) // Show latest 10 active tasks
    };
  }
  
  async getTeamMembers(managerId) {
    // Get users where managerId matches the current manager
    const teamMembers = await User.find({
      $or: [
        { managerId: managerId },
        { manager: managerId }
      ],
      isActive: true
    }).populate('departmentId');
    
    // Get task statistics for each team member
    const teamMembersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        const tasks = await Task.find({ assignedTo: member._id });
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const urgent = tasks.filter(t => t.priority === 'urgent').length;
        const overdue = tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length;
        
        return {
          ...member.toObject(),
          taskStats: {
            total: tasks.length,
            completed,
            inProgress,
            urgent,
            overdue,
            completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
          }
        };
      })
    );
    
    return teamMembersWithStats;
  }
}
```

### 2. Manager Dashboard Route
```javascript
// backend/routes/manager.js

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const managerId = req.user.id;
    const managerService = new ManagerService();
    
    const dashboardData = await managerService.getDashboard(managerId);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load manager dashboard',
      message: error.message
    });
  }
});

router.get('/team-members', authenticateToken, async (req, res) => {
  try {
    const managerId = req.user.id;
    const managerService = new ManagerService();
    
    const teamMembers = await managerService.getTeamMembers(managerId);
    
    res.json({
      success: true,
      data: {
        teamMembers,
        totalMembers: teamMembers.length
      }
    });
  } catch (error) {
    console.error('Team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load team members',
      message: error.message
    });
  }
});
```

## Database Schema Requirements

### User Model
```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['admin', 'super_admin', 'department_head', 'manager', 'member'],
    required: true 
  },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For team members
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Alternative field
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isActive: { type: Boolean, default: true },
  // ... other fields
});
```

### Task Model
```javascript
// backend/models/Task.js
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['assigned', 'in_progress', 'review', 'completed', 'cancelled', 'blocked'],
    default: 'assigned' 
  },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedDate: { type: Date },
  progress: { type: Number, min: 0, max: 100, default: 0 }
});
```

## Key Features

### 1. Task Filtering Logic
- **Active Tasks Only**: Exclude completed, blocked, and overdue tasks
- **Manager + Team Tasks**: Include both manager's tasks and team members' tasks
- **Recent First**: Sort by creation date (most recent first)
- **Limit Results**: Show latest 10 active tasks for dashboard

### 2. Statistics Calculation
- **Team Size**: Count of active team members
- **Active Tasks**: Count of non-completed, non-blocked, non-overdue tasks
- **Completion Rate**: Percentage of completed tasks
- **Urgent Tasks**: Count of urgent priority tasks
- **Overdue Tasks**: Count of tasks past due date

### 3. Performance Optimization
- **Pagination**: Limit dashboard results to prevent large data loads
- **Indexing**: Add database indexes on frequently queried fields
- **Caching**: Consider caching dashboard data for better performance

## Frontend Integration

The frontend will use the `useManager` hook to fetch data from these endpoints:

```javascript
// Frontend will call:
// GET /api/manager/dashboard - for dashboard overview
// GET /api/manager/team-members - for team member details
```

The `recentTasks` array from the dashboard endpoint will contain both manager's tasks and team members' tasks, properly filtered to show only active tasks.

## Testing

### Test Cases
1. **Manager with team members**: Should show manager's tasks + team members' tasks
2. **Manager without team members**: Should show only manager's tasks
3. **Task filtering**: Should exclude completed, blocked, and overdue tasks
4. **Statistics accuracy**: Counts should match actual task data
5. **Performance**: Dashboard should load within 2 seconds

### Sample Test Data
```javascript
// Create test manager
const manager = await User.create({
  firstName: 'John',
  lastName: 'Manager',
  email: 'manager@test.com',
  role: 'manager'
});

// Create test team members
const teamMember1 = await User.create({
  firstName: 'Jane',
  lastName: 'Developer',
  email: 'jane@test.com',
  role: 'member',
  managerId: manager._id
});

// Create test tasks
await Task.create({
  title: 'Manager Task',
  assignedTo: manager._id,
  assignedBy: admin._id,
  status: 'in_progress',
  priority: 'high'
});

await Task.create({
  title: 'Team Member Task',
  assignedTo: teamMember1._id,
  assignedBy: manager._id,
  status: 'assigned',
  priority: 'medium'
});
```

This design ensures that the Manager Dashboard properly shows both manager's tasks and team members' tasks with correct filtering and statistics.
