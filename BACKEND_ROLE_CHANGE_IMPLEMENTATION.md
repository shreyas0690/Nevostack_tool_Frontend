# Backend Role Change Implementation Guide

## Overview
The backend needs to implement automatic role change logic in the user update endpoint (`PUT /api/users/:id`) to handle the complex business rules for department hierarchy management.

## Current API Payload Structure
The frontend sends this data to `userService.updateUser()`:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "mobileNumber": "string",
  "role": "department_head|manager|member|hr|hr_manager|person",
  "departmentId": "string|null",
  "managerId": "string|null|undefined",
  "hodId": "string|null|undefined"
}
```

## Required Backend Implementation

### 🔹 Case 1 – Change HOD (Head of Department)
**Trigger:** When `role` is changed to `"department_head"`

**Logic:**
```javascript
if (updatedUser.role === 'department_head' && previousUser.role !== 'department_head') {
  const deptId = updatedUser.departmentId;

  if (deptId) {
    // 1. Find existing HOD for this department
    const prevHead = await User.findOne({
      role: 'department_head',
      departmentId: deptId,
      _id: { $ne: updatedUser._id }
    });

    if (prevHead) {
      // 2. Transfer managed lists from previous HOD to new HOD
      const newHodManagedManagers = [
        ...(updatedUser.managedManagerIds || []),
        ...(prevHead.managedManagerIds || [])
      ];

      const newHodManagedMembers = [
        ...(updatedUser.managedMemberIds || []),
        ...(prevHead.managedMemberIds || [])
      ];

      // Remove duplicates
      updatedUser.managedManagerIds = [...new Set(newHodManagedManagers)];
      updatedUser.managedMemberIds = [...new Set(newHodManagedMembers)];

      // 3. Demote previous HOD to member
      await User.updateOne(
        { _id: prevHead._id },
        {
          role: 'member',
          departmentId: null,
          managedManagerIds: [],
          managedMemberIds: []
        }
      );
    }

    // 4. Update department head reference
    await Department.updateOne(
      { _id: deptId },
      { headId: updatedUser._id }
    );
  }
}
```

### 🔹 Case 2 – Manager Department Change
**Trigger:** When `role` remains `"manager"` but `departmentId` changes

**Logic:**
```javascript
if (previousUser.role === 'manager' && updatedUser.role === 'manager' &&
    previousUser.departmentId !== updatedUser.departmentId) {

  const oldDeptId = previousUser.departmentId;
  const newDeptId = updatedUser.departmentId;

  // 1. Find old and new HODs
  const oldHod = await User.findOne({
    role: 'department_head',
    departmentId: oldDeptId
  });

  const newHod = await User.findOne({
    role: 'department_head',
    departmentId: newDeptId
  });

  // 2. Remove from old HOD's managedManagerIds
  if (oldHod && oldHod.managedManagerIds) {
    oldHod.managedManagerIds = oldHod.managedManagerIds.filter(
      id => id.toString() !== updatedUser._id.toString()
    );
    await oldHod.save();
  }

  // 3. Add to new HOD's managedManagerIds
  if (newHod) {
    if (!newHod.managedManagerIds) newHod.managedManagerIds = [];
    if (!newHod.managedManagerIds.includes(updatedUser._id)) {
      newHod.managedManagerIds.push(updatedUser._id);
      await newHod.save();
    }
  }
}
```

### 🔹 Case 3 – Member Department Change (Most Important)
**Trigger:** When `role` remains `"member"` but `departmentId` changes

**Business Logic:**
```javascript
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

**Step-by-Step Process:**
1. **Remove from old relationships:**
   - Old department HOD's `managedMemberIds`
   - Old manager's `managedMemberIds` (if existed)

2. **Add to new relationships:**
   - New department HOD's `managedMemberIds`
   - New manager's `managedMemberIds` (if assigned)

3. **Update member's `managerId`** to reflect new manager assignment

**Critical Points:**
- Must handle cases where HOD doesn't exist
- Must handle cases where manager doesn't exist
- All operations should be in a transaction
- Must update both HOD and manager relationships
- Member's `managerId` field must be updated

## Database Schema Requirements

### User Model
```javascript
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'department_head', 'manager', 'member', 'hr', 'hr_manager', 'person']
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managedManagerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  managedMemberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Department Model
```javascript
const departmentSchema = new mongoose.Schema({
  name: String,
  headId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## Implementation Steps

1. **Update User Update Endpoint** - Add role change logic before saving user
2. **Add Helper Functions** - Create reusable functions for each case
3. **Add Transaction Support** - Wrap operations in database transactions
4. **Add Validation** - Ensure data consistency after changes
5. **Add Logging** - Log all role changes for audit trail
6. **Test Scenarios** - Test all three cases thoroughly

## Error Handling
- Handle cases where HOD doesn't exist for a department
- Handle concurrent updates with optimistic locking
- Rollback changes if any operation fails
- Log errors for debugging

## Member Department Change - Complete Flow

### 🔄 **Complete Process for Member Movement:**

1. **OLD DEPARTMENT CLEANUP:**
   ```javascript
   // Remove from old HOD's managedMemberIds
   oldHod.managedMemberIds = oldHod.managedMemberIds.filter(id => id !== userId);

   // Remove from old manager's managedMemberIds (if had manager)
   if (oldManager) {
     oldManager.managedMemberIds = oldManager.managedMemberIds.filter(id => id !== userId);
   }
   ```

2. **NEW DEPARTMENT SETUP:**
   ```javascript
   // Add to new HOD's managedMemberIds
   newHod.managedMemberIds.push(userId);

   // Add to new manager's managedMemberIds (if new manager assigned)
   if (newManager) {
     newManager.managedMemberIds.push(userId);
   }
   ```

3. **UPDATE MEMBER RECORD:**
   ```javascript
   // Update member's managerId field
   member.managerId = newManagerId;
   member.departmentId = newDepartmentId;
   ```

### 📊 **Database Relationships Updated:**
- **HOD Relationships:** `managedMemberIds` arrays
- **Manager Relationships:** `managedMemberIds` arrays
- **Member Record:** `managerId` and `departmentId` fields

## Testing Scenarios
1. Promote member to department_head (Case 1)
2. Move manager between departments (Case 2)
3. Move member between departments with manager change (Case 3)
4. Move member between departments without manager change
5. Edge cases: department without HOD, etc.

## 🔍 **Verification Queries:**
```javascript
// Check if member was removed from old relationships
const oldHod = await User.findOne({ departmentId: oldDeptId, role: 'department_head' });
const oldManager = await User.findById(oldManagerId);

// Check if member was added to new relationships
const newHod = await User.findOne({ departmentId: newDeptId, role: 'department_head' });
const newManager = await User.findById(newManagerId);

// Verify member's record is updated
const member = await User.findById(memberId);
```
