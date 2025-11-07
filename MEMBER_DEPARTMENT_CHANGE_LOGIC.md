# Member Department Change Logic - Backend Implementation

## Overview
This document details the exact logic required when a member moves from one department to another in the user management system.

## 🎯 Business Logic Requirements

When a member changes departments, the following relationships must be updated:

### **OLD DEPARTMENT CLEANUP:**
1. **Remove from Old HOD's `managedMemberIds`**
   - Find the HOD of the old department
   - Remove the member's ID from `managedMemberIds` array

2. **Remove from Old Manager's `managedMemberIds`**
   - If member had a manager in the old department
   - Remove member's ID from that manager's `managedMemberIds` array

### **NEW DEPARTMENT SETUP:**
3. **Add to New HOD's `managedMemberIds`**
   - Find the HOD of the new department
   - Add member's ID to `managedMemberIds` array

4. **Add to New Manager's `managedMemberIds`**
   - If member has a new manager assigned in the new department
   - Add member's ID to that manager's `managedMemberIds` array

5. **Update Member's Record**
   - Update `departmentId` to new department
   - Update `managerId` to new manager (if assigned)

## 📝 Implementation Code

```javascript
// Trigger: When role remains 'member' but departmentId changes
if (previousUser.role === 'member' && updatedUser.role === 'member' &&
    previousUser.departmentId !== updatedUser.departmentId) {

  const oldDeptId = previousUser.departmentId;
  const newDeptId = updatedUser.departmentId;

  console.log(`Member ${updatedUser._id} moving from dept ${oldDeptId} to ${newDeptId}`);

  // 1. Find old and new HODs
  const oldHod = await User.findOne({
    role: 'department_head',
    departmentId: oldDeptId
  });

  const newHod = await User.findOne({
    role: 'department_head',
    departmentId: newDeptId
  });

  const operations = [];

  // 🗑️ STEP 1: Remove from OLD department relationships

  // 1a. Remove from old HOD's managedMemberIds
  if (oldHod && oldHod.managedMemberIds) {
    console.log(`Removing member from old HOD ${oldHod._id} managedMemberIds`);
    oldHod.managedMemberIds = oldHod.managedMemberIds.filter(
      id => id.toString() !== updatedUser._id.toString()
    );
    operations.push(oldHod.save());
  }

  // 1b. Remove from previous manager's managedMemberIds (if had a manager)
  if (previousUser.managerId) {
    const prevManager = await User.findById(previousUser.managerId);
    if (prevManager && prevManager.managedMemberIds) {
      console.log(`Removing member from old manager ${prevManager._id} managedMemberIds`);
      prevManager.managedMemberIds = prevManager.managedMemberIds.filter(
        id => id.toString() !== updatedUser._id.toString()
      );
      operations.push(prevManager.save());
    }
  }

  // ➕ STEP 2: Add to NEW department relationships

  // 2a. Add to new HOD's managedMemberIds
  if (newHod) {
    if (!newHod.managedMemberIds) newHod.managedMemberIds = [];
    if (!newHod.managedMemberIds.includes(updatedUser._id)) {
      console.log(`Adding member to new HOD ${newHod._id} managedMemberIds`);
      newHod.managedMemberIds.push(updatedUser._id);
      operations.push(newHod.save());
    }
  }

  // 2b. Add to new manager's managedMemberIds (if new manager assigned)
  if (updatedUser.managerId) {
    const newManager = await User.findById(updatedUser.managerId);
    if (newManager) {
      if (!newManager.managedMemberIds) newManager.managedMemberIds = [];
      if (!newManager.managedMemberIds.includes(updatedUser._id)) {
        console.log(`Adding member to new manager ${newManager._id} managedMemberIds`);
        newManager.managedMemberIds.push(updatedUser._id);
        operations.push(newManager.save());
      }
    }
  }

  // Execute all operations atomically
  await Promise.all(operations);

  console.log(`✅ Member department change completed for user ${updatedUser._id}`);
}
```

## 🔄 Complete Flow Diagram

```
OLD DEPARTMENT                    NEW DEPARTMENT
├── HOD                           ├── HOD
│   └── managedMemberIds[]        │   └── managedMemberIds[]
│       └── REMOVE userId         │       └── ADD userId
└── Manager (if exists)           └── Manager (if assigned)
    └── managedMemberIds[]            └── managedMemberIds[]
        └── REMOVE userId                 └── ADD userId

MEMBER RECORD
├── departmentId: UPDATE
└── managerId: UPDATE (if changed)
```

## 📊 Database Changes

### Before Member Move:
```javascript
// Old Department HOD
{
  _id: "hod_old_id",
  role: "department_head",
  managedMemberIds: ["user_id", "other_member_id"]
}

// Old Manager (if existed)
{
  _id: "manager_old_id",
  role: "manager",
  managedMemberIds: ["user_id", "other_member_id"]
}

// Member
{
  _id: "user_id",
  role: "member",
  departmentId: "old_dept_id",
  managerId: "manager_old_id"
}
```

### After Member Move:
```javascript
// Old Department HOD
{
  _id: "hod_old_id",
  role: "department_head",
  managedMemberIds: ["other_member_id"] // user_id removed
}

// Old Manager (if existed)
{
  _id: "manager_old_id",
  role: "manager",
  managedMemberIds: ["other_member_id"] // user_id removed
}

// New Department HOD
{
  _id: "hod_new_id",
  role: "department_head",
  managedMemberIds: ["existing_member_id", "user_id"] // user_id added
}

// New Manager (if assigned)
{
  _id: "manager_new_id",
  role: "manager",
  managedMemberIds: ["existing_member_id", "user_id"] // user_id added
}

// Member
{
  _id: "user_id",
  role: "member",
  departmentId: "new_dept_id", // updated
  managerId: "manager_new_id" // updated
}
```

## 🔍 Verification Queries

```javascript
// Check old relationships are cleaned up
const oldHod = await User.findOne({
  departmentId: oldDeptId,
  role: 'department_head'
});
console.log('Old HOD managedMemberIds:', oldHod.managedMemberIds);
// Should NOT contain userId

if (oldManagerId) {
  const oldManager = await User.findById(oldManagerId);
  console.log('Old Manager managedMemberIds:', oldManager.managedMemberIds);
  // Should NOT contain userId
}

// Check new relationships are set up
const newHod = await User.findOne({
  departmentId: newDeptId,
  role: 'department_head'
});
console.log('New HOD managedMemberIds:', newHod.managedMemberIds);
// Should contain userId

if (newManagerId) {
  const newManager = await User.findById(newManagerId);
  console.log('New Manager managedMemberIds:', newManager.managedMemberIds);
  // Should contain userId
}

// Check member record is updated
const member = await User.findById(userId);
console.log('Member departmentId:', member.departmentId); // Should be newDeptId
console.log('Member managerId:', member.managerId); // Should be newManagerId
```

## ⚠️ Critical Points

1. **Transaction Safety**: All operations should be wrapped in a database transaction
2. **Error Handling**: If any operation fails, rollback all changes
3. **Null Checks**: Handle cases where HOD or manager might not exist
4. **Duplicate Prevention**: Check for existing IDs before adding
5. **Atomic Operations**: Use `Promise.all()` for parallel execution

## 🧪 Testing Scenarios

1. **Member moves with manager change**
2. **Member moves without manager change**
3. **Member moves to department without HOD**
4. **Member moves from department without HOD**
5. **Concurrent member moves** (race conditions)

## 🔧 Implementation Location

This logic should be implemented in the user update endpoint (`PUT /api/users/:id`) in your backend server, specifically in the section that handles member department changes.



