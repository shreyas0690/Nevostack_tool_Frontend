# Backend Roadmap - Part 3: API Architecture & Endpoints

## 🏗️ **API Architecture Overview**

### **RESTful API Design Principles**
- **Resource-based URLs**: `/api/v1/users`, `/api/v1/tasks`
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Consistent Response Format**: Standardized JSON responses
- **Status Codes**: Proper HTTP status code usage
- **Versioning**: API versioning strategy (`/api/v1/`)

### **API Structure**
```
/api/v1/
├── auth/          # Authentication endpoints
├── users/         # User management
├── departments/   # Department management
├── tasks/         # Task management
├── attendance/    # Attendance tracking
├── leaves/        # Leave management
├── meetings/      # Meeting management
├── events/        # Event management
├── notifications/ # Notification system
├── analytics/     # Analytics & reporting
└── admin/         # Admin-only endpoints
```

---

## 🔐 **Authentication & Authorization APIs**

### **Authentication Endpoints**

#### **POST /api/v1/auth/login**
**Purpose**: User login with email/username and password

```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "manager",
      "department": {
        "id": "dept_id",
        "name": "Sales"
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### **POST /api/v1/auth/logout**
**Purpose**: User logout and token invalidation

```typescript
// Request Headers
Authorization: Bearer <access_token>

// Response
{
  "success": true,
  "message": "Logout successful"
}
```

#### **POST /api/v1/auth/refresh**
**Purpose**: Refresh access token using refresh token

```typescript
// Request
{
  "refreshToken": "jwt_refresh_token"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 3600
  }
}
```

#### **POST /api/v1/auth/forgot-password**
**Purpose**: Request password reset

```typescript
// Request
{
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

#### **POST /api/v1/auth/reset-password**
**Purpose**: Reset password with token

```typescript
// Request
{
  "token": "reset_token",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}

// Response
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 👥 **User Management APIs**

### **User CRUD Operations**

#### **GET /api/v1/users**
**Purpose**: Get all users (with role-based filtering and pagination)

```typescript
// Query Parameters
?page=1&limit=20&role=manager&department=dept_id&status=active&search=john

// Response
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "manager",
        "department": {
          "id": "dept_id",
          "name": "Sales"
        },
        "manager": {
          "id": "manager_id",
          "name": "Jane Smith"
        },
        "status": "active",
        "lastLogin": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### **GET /api/v1/users/:id**
**Purpose**: Get specific user details

```typescript
// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "manager",
      "department": {
        "id": "dept_id",
        "name": "Sales",
        "color": "#3B82F6"
      },
      "manager": {
        "id": "manager_id",
        "name": "Jane Smith"
      },
      "subordinates": [
        {
          "id": "sub_id",
          "name": "Alex Johnson",
          "role": "member"
        }
      ],
      "profile": {
        "phone": "+1234567890",
        "avatar": "avatar_url",
        "dateOfBirth": "1990-05-15",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001"
        }
      },
      "employment": {
        "employeeId": "EMP001",
        "dateOfJoining": "2023-01-15",
        "position": "Sales Manager",
        "salary": 75000
      }
    }
  }
}
```

#### **POST /api/v1/users**
**Purpose**: Create new user (Admin/HR only)

```typescript
// Request
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "role": "member",
  "departmentId": "dept_id",
  "managerId": "manager_id",
  "profile": {
    "phone": "+1234567890",
    "dateOfBirth": "1995-08-20"
  },
  "employment": {
    "employeeId": "EMP099",
    "position": "Junior Developer",
    "dateOfJoining": "2024-02-01"
  }
}

// Response
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "new_user_id",
      "username": "newuser",
      "email": "newuser@example.com",
      // ... other user data
    }
  }
}
```

#### **PUT /api/v1/users/:id**
**Purpose**: Update user information

#### **PATCH /api/v1/users/:id/status**
**Purpose**: Change user status (activate/deactivate)

#### **DELETE /api/v1/users/:id**
**Purpose**: Delete user (Admin only)

#### **PUT /api/v1/users/:id/change-password**
**Purpose**: Admin password change for user

```typescript
// Request
{
  "newPassword": "newPassword123"
}

// Response
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 🏢 **Department Management APIs**

### **Department Operations**

#### **GET /api/v1/departments**
**Purpose**: Get all departments with hierarchy

```typescript
// Response
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "dept_id",
        "name": "Sales",
        "description": "Sales and revenue generation",
        "code": "SALES",
        "color": "#3B82F6",
        "hod": {
          "id": "hod_id",
          "name": "John Smith",
          "email": "john.smith@example.com"
        },
        "managers": [
          {
            "id": "manager_id",
            "name": "Jane Doe",
            "email": "jane.doe@example.com"
          }
        ],
        "stats": {
          "totalMembers": 25,
          "activeMembers": 23,
          "managersCount": 3
        },
        "subDepartments": [
          {
            "id": "sub_dept_id",
            "name": "Inside Sales"
          }
        ]
      }
    ]
  }
}
```

#### **POST /api/v1/departments**
**Purpose**: Create new department

#### **GET /api/v1/departments/:id**
**Purpose**: Get specific department details

#### **PUT /api/v1/departments/:id**
**Purpose**: Update department

#### **DELETE /api/v1/departments/:id**
**Purpose**: Delete department

#### **POST /api/v1/departments/:id/members**
**Purpose**: Add member to department

#### **DELETE /api/v1/departments/:id/members/:userId**
**Purpose**: Remove member from department

---

## 📋 **Task Management APIs**

### **Task Operations**

#### **GET /api/v1/tasks**
**Purpose**: Get tasks based on user role and filters

```typescript
// Query Parameters
?page=1&limit=20&status=in_progress&priority=high&assignedTo=user_id&dueDate=2024-02-15

// Response
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_id",
        "title": "Q1 Sales Report",
        "description": "Prepare comprehensive sales analysis",
        "status": "in_progress",
        "priority": "high",
        "progress": 75,
        "assignedTo": {
          "id": "user_id",
          "name": "John Doe",
          "avatar": "avatar_url"
        },
        "assignedBy": {
          "id": "assigner_id",
          "name": "Jane Smith",
          "role": "manager"
        },
        "department": {
          "id": "dept_id",
          "name": "Sales"
        },
        "dueDate": "2024-02-15T23:59:59Z",
        "estimatedHours": 40,
        "actualHours": 30,
        "tags": ["report", "sales", "q1"],
        "attachments": [
          {
            "id": "attachment_id",
            "name": "sales_data.xlsx",
            "url": "file_url",
            "size": 2048000
          }
        ],
        "createdAt": "2024-02-01T10:00:00Z",
        "updatedAt": "2024-02-10T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTasks": 50
    }
  }
}
```

#### **POST /api/v1/tasks**
**Purpose**: Create new task

```typescript
// Request
{
  "title": "New Task",
  "description": "Task description",
  "assignedTo": "user_id",
  "departmentId": "dept_id",
  "priority": "high",
  "dueDate": "2024-03-01T23:59:59Z",
  "estimatedHours": 20,
  "tags": ["urgent", "client"],
  "meeting": {
    "enabled": true,
    "scheduledDate": "2024-02-20T10:00:00Z",
    "location": "Conference Room A"
  }
}
```

#### **GET /api/v1/tasks/:id**
**Purpose**: Get specific task details

#### **PUT /api/v1/tasks/:id**
**Purpose**: Update task

#### **PATCH /api/v1/tasks/:id/status**
**Purpose**: Update task status

#### **POST /api/v1/tasks/:id/comments**
**Purpose**: Add comment to task

#### **POST /api/v1/tasks/:id/attachments**
**Purpose**: Upload task attachment

---

## 🕐 **Attendance Management APIs**

### **Attendance Operations**

#### **POST /api/v1/attendance/check-in**
**Purpose**: Record user check-in

```typescript
// Request
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY"
  }
}

// Response
{
  "success": true,
  "message": "Check-in recorded successfully",
  "data": {
    "attendance": {
      "id": "attendance_id",
      "checkIn": {
        "time": "2024-02-15T09:00:00Z",
        "location": {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "address": "123 Main St, New York, NY"
        }
      },
      "isLate": false
    }
  }
}
```

#### **POST /api/v1/attendance/check-out**
**Purpose**: Record user check-out

#### **GET /api/v1/attendance**
**Purpose**: Get attendance records

```typescript
// Query Parameters
?startDate=2024-02-01&endDate=2024-02-15&userId=user_id

// Response
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "attendance_id",
        "user": {
          "id": "user_id",
          "name": "John Doe"
        },
        "date": "2024-02-15",
        "checkIn": {
          "time": "2024-02-15T09:00:00Z",
          "location": "Office"
        },
        "checkOut": {
          "time": "2024-02-15T18:00:00Z",
          "location": "Office"
        },
        "totalHours": 8.5,
        "status": "present",
        "isLate": false
      }
    ],
    "summary": {
      "totalDays": 15,
      "presentDays": 13,
      "absentDays": 2,
      "avgWorkingHours": 8.2,
      "totalWorkingHours": 106.6
    }
  }
}
```

#### **GET /api/v1/attendance/today**
**Purpose**: Get today's attendance status

#### **GET /api/v1/attendance/analytics**
**Purpose**: Get attendance analytics (Admin/Manager only)

---

## 🏖️ **Leave Management APIs**

### **Leave Operations**

#### **POST /api/v1/leaves/request**
**Purpose**: Submit leave request

```typescript
// Request
{
  "leaveType": "annual",
  "startDate": "2024-03-01",
  "endDate": "2024-03-03",
  "totalDays": 3,
  "reason": "Family vacation",
  "isHalfDay": false,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "spouse"
  }
}

// Response
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leaveRequest": {
      "id": "leave_id",
      "employee": {
        "id": "user_id",
        "name": "John Doe"
      },
      "leaveType": "annual",
      "startDate": "2024-03-01",
      "endDate": "2024-03-03",
      "totalDays": 3,
      "status": "pending",
      "appliedDate": "2024-02-15T10:00:00Z",
      "balanceAfter": 18
    }
  }
}
```

#### **GET /api/v1/leaves**
**Purpose**: Get leave requests

#### **GET /api/v1/leaves/:id**
**Purpose**: Get specific leave request

#### **PATCH /api/v1/leaves/:id/approve**
**Purpose**: Approve leave request (Manager/HOD only)

#### **PATCH /api/v1/leaves/:id/reject**
**Purpose**: Reject leave request

#### **GET /api/v1/leaves/balance**
**Purpose**: Get user's leave balance

```typescript
// Response
{
  "success": true,
  "data": {
    "balances": [
      {
        "leaveType": "annual",
        "totalAllowed": 21,
        "used": 3,
        "pending": 3,
        "available": 15
      },
      {
        "leaveType": "sick",
        "totalAllowed": 10,
        "used": 1,
        "pending": 0,
        "available": 9
      }
    ]
  }
}
```

---

## 🤝 **Meeting Management APIs**

### **Meeting Operations**

#### **POST /api/v1/meetings**
**Purpose**: Create new meeting

```typescript
// Request
{
  "title": "Weekly Team Meeting",
  "description": "Discussion of weekly goals and updates",
  "date": "2024-02-20T10:00:00Z",
  "duration": 60,
  "type": "virtual",
  "meetingLink": "https://zoom.us/j/123456789",
  "attendees": [
    {
      "user": "user_id_1",
      "role": "required"
    },
    {
      "user": "user_id_2",
      "role": "optional"
    }
  ],
  "departments": ["dept_id"],
  "recurring": {
    "enabled": true,
    "pattern": "weekly",
    "endDate": "2024-06-01"
  }
}
```

#### **GET /api/v1/meetings**
**Purpose**: Get meetings

#### **GET /api/v1/meetings/:id**
**Purpose**: Get specific meeting

#### **PUT /api/v1/meetings/:id**
**Purpose**: Update meeting

#### **PATCH /api/v1/meetings/:id/status**
**Purpose**: Update meeting status

#### **POST /api/v1/meetings/:id/attend**
**Purpose**: Mark attendance for meeting

---

## 📅 **Event Management APIs**

### **Event Operations**

#### **POST /api/v1/events**
**Purpose**: Create new event

#### **GET /api/v1/events**
**Purpose**: Get events based on user access

#### **GET /api/v1/events/:id**
**Purpose**: Get specific event

#### **POST /api/v1/events/:id/register**
**Purpose**: Register for event

---

## 🔔 **Notification APIs**

### **Notification Operations**

#### **GET /api/v1/notifications**
**Purpose**: Get user notifications

#### **PATCH /api/v1/notifications/:id/read**
**Purpose**: Mark notification as read

#### **PATCH /api/v1/notifications/mark-all-read**
**Purpose**: Mark all notifications as read

#### **DELETE /api/v1/notifications/:id**
**Purpose**: Delete notification

---

## 📊 **Analytics & Reporting APIs**

### **Analytics Operations**

#### **GET /api/v1/analytics/dashboard**
**Purpose**: Get role-based dashboard analytics

#### **GET /api/v1/analytics/tasks**
**Purpose**: Get task analytics

#### **GET /api/v1/analytics/attendance**
**Purpose**: Get attendance analytics

#### **GET /api/v1/analytics/leaves**
**Purpose**: Get leave analytics

#### **GET /api/v1/analytics/departments**
**Purpose**: Get department analytics

---

## 🛡️ **Error Handling & Response Format**

### **Standard Response Format**

```typescript
// Success Response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "meta": {
    // Metadata (pagination, etc.)
  }
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information",
    "field": "fieldName" // For validation errors
  },
  "timestamp": "2024-02-15T10:30:00Z",
  "path": "/api/v1/users"
}
```

### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

---

**Next:** [Backend Roadmap Part 4: Authentication & Security](./BACKEND_ROADMAP_04_AUTH_SECURITY.md)





































































































