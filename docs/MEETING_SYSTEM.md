# Meeting Scheduling System - Design & Implementation Guide

This document specifies a meeting scheduling system for roles: `admin`, `department_head` (HOD), `manager`, and `member`.

## Goals
- Allow each role to create/view meetings according to their permissions.
- When a meeting is created for a department, it should appear for HOD, Managers and Members of that department.
- Frontend should make it easy to pick department → then auto-list HOD, Managers, Members for selection.

## Roles & Permissions

- **Admin**
  - Can create meetings for any department or individual users.
  - If `department` is selected, the meeting is visible to all users in that department (including HOD, managers, members).
  - If specific users are selected, the meeting is visible only to those users.

- **HOD (department_head)**
  - Can create meetings limited to their own department.
  - Can select managers and members under their department as invitees.

- **Manager**
  - Can create meetings for members assigned to them (their team).
  - Can only invite members (not other managers/HOD unless they are explicitly allowed by business rules).

- **Member**
  - Can only view meetings they were invited to or meetings created for their department.
  - Cannot create meetings.

## Data model (suggested)

- Meeting
  - id: string
  - title: string
  - description: string
  - organizerId: string
  - organizerRole: string
  - startTime: ISODate (required)  // meeting start datetime 
  - meetingLink?: string           // URL for online meeting (Zoom/Teams/etc.)
  - endTime: ISODate (optional)    // endTime is optional; system should primarily use startTime
  - departmentId?: string // optional when meeting targets whole department
  - inviteeUserIds: string[] // explicit users
  - inviteeRoles?: string[] // optional roles (e.g., ['manager'])
  - createdAt, updatedAt

- User (existing) should include: id, role, departmentId, managerId, managedMemberIds

## API endpoints (examples)

- POST /api/meetings
  - Body: { title, description, startTime, meetingLink?, endTime?, departmentId?, inviteeUserIds?, inviteeRoles? }
  - Authorization: admin OR (department_head and departmentId === their dept) OR (manager and inviteeUserIds subset of their managed members)
  - Behavior: If departmentId is present, the backend expands the department members (HOD, managers, members) into inviteeUserIds internally (or stores departmentId and resolves on query).

- GET /api/meetings?userId=<id>
  - Returns meetings where userId is in inviteeUserIds OR meetings with departmentId equal to user's departmentId OR meetings created by the user (organizer)

## Frontend behavior & improvements

- **Department Auto-Selection**: For HOD and Manager roles, their department is automatically selected and displayed as read-only when creating meetings (they can only create meetings for their own department).

- When creating a meeting and the user selects a `department` in the UI, automatically fetch department hierarchy and list:
  - Department Head (HOD)
  - Managers in department
  - Members grouped by manager

- Provide multi-select UI with checkboxes for invitee selection. For HOD/Manager, only show members from their department.

- Validation before submit:
  - If current user is `manager`, ensure selected inviteeUserIds are subset of `currentUser.managedMemberIds`.
  - If current user is `department_head`, ensure departmentId === currentUser.departmentId.
  - If `admin`, no restrictions.

## Backend implementation details

- On POST /api/meetings, server should:
  1. Validate payload and user permissions.
  2. If departmentId present, fetch full list of employees in that department and expand inviteeUserIds = unique(users in dept).
  3. Save meeting with inviteeUserIds populated (or alternatively store departmentId and a derived invitee list for quick queries).

- On GET /api/meetings (for a user):
  - Query for meetings where `inviteeUserIds` includes userId OR `departmentId` equals user's departmentId OR `organizerId` equals userId.

## Example permission checks (pseudo)

function canCreateMeeting(user, payload) {
  if (user.role === 'admin') return true;
  if (user.role === 'department_head') return payload.departmentId && String(payload.departmentId) === String(user.departmentId);
  if (user.role === 'manager') {
    // only allow manager to invite their team members
    return Array.isArray(payload.inviteeUserIds) && payload.inviteeUserIds.every(id => user.managedMemberIds.includes(id));
  }
  return false;
}

## Frontend: Department select flow (UX)

1. User selects a department from dropdown.
2. Frontend calls `/api/departments/{id}/employees?includeHierarchy=true` and receives:
   - departmentHead, managers[], members[] or managerTeams[] grouping.
3. Populate the multi-select with grouped options: HOD (single), Managers (list), Members under each manager.
4. User selects invitees and submits.

## Notes & trade-offs

- Storing both `departmentId` and `inviteeUserIds` helps querying (fast filter by invitee) while retaining semantic grouping.
- For very large departments, avoid expanding inviteeUserIds and instead store departmentId and treat department-level meetings specially in queries.

## Next steps / Implementation tasks

1. Create `Meeting` model in backend (Mongoose) and migration if applicable.
2. Add routes: POST /api/meetings, GET /api/meetings, GET /api/meetings/:id
3. Implement frontend `CreateMeetingDialog` with department → hierarchy fetch and grouped multi-select.
4. Add permissions checks in backend route handlers.

---
For any specific code snippets or implementation help (Mongoose model, route handlers, or React component), tell me which piece you want first and I'll implement it.
