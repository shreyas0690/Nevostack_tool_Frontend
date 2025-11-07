/**
 * Backend Implementation: User Update with Role Change Logic
 *
 * This file implements automatic role change handling when users are updated.
 * It handles three critical scenarios:
 *
 * 1. HOD Change: Transfer managed lists when promoting to department_head
 * 2. Manager Department Change: Update HOD relationships when manager moves
 * 3. Member Department Change: Update HOD/manager relationships when member moves
 *
 * Features:
 * - Database transactions for atomicity
 * - Comprehensive validation and error handling
 * - Detailed logging for debugging
 * - Helper functions for relationship management
 * - Maintenance and validation endpoints
 *
 * File: controllers/userController.js or routes/users.js
 */

const User = require('../models/User');
const Department = require('../models/Department');

// Validation helper
const validateUpdateData = (data) => {
  const errors = [];

  if (data.role && !['super_admin', 'admin', 'department_head', 'manager', 'member', 'hr', 'hr_manager', 'person'].includes(data.role)) {
    errors.push('Invalid role specified');
  }

  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Invalid email format');
  }

  return errors;
};

// Helper to safely update managed lists
const updateManagedList = async (userId, field, operation, targetUserId, session) => {
  const user = await User.findById(userId).session(session);
  if (!user) return false;

  if (!user[field]) user[field] = [];

  if (operation === 'add' && !user[field].includes(targetUserId)) {
    user[field].push(targetUserId);
  } else if (operation === 'remove') {
    user[field] = user[field].filter(id => id.toString() !== targetUserId.toString());
  }

  await user.save({ session });
  return true;
};

// Main update function
exports.updateUser = async (req, res) => {
  const session = await User.startSession();

  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate input
    const validationErrors = validateUpdateData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Get the current user before update
    const previousUser = await User.findById(id).session(session);
    if (!previousUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🔄 Updating user ${id}:`, {
      previous: {
        role: previousUser.role,
        departmentId: previousUser.departmentId,
        managerId: previousUser.managerId
      },
      updated: {
        role: updateData.role,
        departmentId: updateData.departmentId,
        managerId: updateData.managerId,
        hodId: updateData.hodId
      }
    });

    // Start transaction
    session.startTransaction();
    let roleChangeProcessed = false;
      // ============================================
      // CASE 1: Change HOD (Department Head)
      // ============================================
      if (updateData.role === 'department_head' && previousUser.role !== 'department_head') {
        console.log('🎯 Case 1: Promoting user to Department Head');
        roleChangeProcessed = true;

        const deptId = updateData.departmentId;
        if (!deptId) {
          throw new Error('Department ID required when assigning department head role');
        }

        // Find existing HOD for this department
        const prevHead = await User.findOne({
          role: 'department_head',
          departmentId: deptId,
          _id: { $ne: id }
        }).session(session);

        if (prevHead) {
          console.log(`👑 Found previous HOD: ${prevHead._id}`);

          // Transfer all managed relationships from previous HOD to new HOD
          const managersToTransfer = prevHead.managedManagerIds || [];
          const membersToTransfer = prevHead.managedMemberIds || [];

          // Initialize arrays if not exist
          if (!updateData.managedManagerIds) updateData.managedManagerIds = [];
          if (!updateData.managedMemberIds) updateData.managedMemberIds = [];

          // Transfer managers
          for (const managerId of managersToTransfer) {
            if (!updateData.managedManagerIds.includes(managerId)) {
              updateData.managedManagerIds.push(managerId);
            }
          }

          // Transfer members
          for (const memberId of membersToTransfer) {
            if (!updateData.managedMemberIds.includes(memberId)) {
              updateData.managedMemberIds.push(memberId);
            }
          }

          console.log(`📋 Transferred ${managersToTransfer.length} managers and ${membersToTransfer.length} members`);

          // Demote previous HOD to member and clear all relationships
          await User.updateOne(
            { _id: prevHead._id },
            {
              role: 'member',
              departmentId: null,
              managerId: null,
              managedManagerIds: [],
              managedMemberIds: []
            },
            { session }
          );

          console.log(`⬇️ Demoted previous HOD ${prevHead._id} to member`);
        }

        // Update department head reference
        const deptUpdateResult = await Department.updateOne(
          { _id: deptId },
          { headId: id },
          { session }
        );

        if (deptUpdateResult.matchedCount === 0) {
          throw new Error(`Department ${deptId} not found`);
        }

        console.log(`🏢 Updated department ${deptId} head to ${id}`);
      }

      // ============================================
      // CASE 2: Manager Department Change
      // ============================================
      else if (previousUser.role === 'manager' && updateData.role === 'manager' &&
               previousUser.departmentId !== updateData.departmentId) {
        console.log('👨‍💼 Case 2: Manager changing departments');
        roleChangeProcessed = true;

        const oldDeptId = previousUser.departmentId;
        const newDeptId = updateData.departmentId;

        if (!oldDeptId || !newDeptId) {
          throw new Error('Both old and new department IDs required for manager department change');
        }

        // Find old and new HODs
        const [oldHod, newHod] = await Promise.all([
          User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
          User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
        ]);

        if (!newHod) {
          throw new Error(`No department head found for new department ${newDeptId}`);
        }

        // Remove from old HOD's managedManagerIds
        if (oldHod) {
          const success = await updateManagedList(oldHod._id, 'managedManagerIds', 'remove', id, session);
          if (success) console.log(`❌ Removed manager from old HOD ${oldHod._id}`);
        }

        // Add to new HOD's managedManagerIds
        const success = await updateManagedList(newHod._id, 'managedManagerIds', 'add', id, session);
        if (success) console.log(`➕ Added manager to new HOD ${newHod._id}`);
      }

      // ============================================
      // CASE 3: Member Department Change (MOST IMPORTANT)
      // ============================================
      else if (previousUser.role === 'member' && updateData.role === 'member' &&
               previousUser.departmentId !== updateData.departmentId) {
        console.log('👤 Case 3: Member changing departments (MOST CRITICAL)');
        roleChangeProcessed = true;

        const oldDeptId = previousUser.departmentId;
        const newDeptId = updateData.departmentId;

        if (!oldDeptId || !newDeptId) {
          throw new Error('Both old and new department IDs required for member department change');
        }

        console.log(`📍 Moving from department ${oldDeptId} to ${newDeptId}`);

        // 1. Find old and new HODs
        const [oldHod, newHod] = await Promise.all([
          User.findOne({ role: 'department_head', departmentId: oldDeptId }).session(session),
          User.findOne({ role: 'department_head', departmentId: newDeptId }).session(session)
        ]);

        if (!newHod) {
          throw new Error(`No department head found for new department ${newDeptId}`);
        }

        const operations = [];

        // 🗑️ STEP 1: CLEANUP - Remove from OLD department relationships

        // 1a. Remove from old HOD's managedMemberIds
        if (oldHod) {
          const success = await updateManagedList(oldHod._id, 'managedMemberIds', 'remove', id, session);
          if (success) console.log(`❌ Removed from old HOD ${oldHod._id} managedMemberIds`);
        } else {
          console.warn(`⚠️ No HOD found for old department ${oldDeptId}`);
        }

        // 1b. Remove from previous manager's managedMemberIds (if had a manager)
        if (previousUser.managerId) {
          const prevManager = await User.findById(previousUser.managerId).session(session);
          if (prevManager) {
            const success = await updateManagedList(prevManager._id, 'managedMemberIds', 'remove', id, session);
            if (success) console.log(`❌ Removed from old manager ${prevManager._id} managedMemberIds`);
          }
        }

        // ➕ STEP 2: SETUP - Add to NEW department relationships

        // 2a. Add to new HOD's managedMemberIds
        const hodSuccess = await updateManagedList(newHod._id, 'managedMemberIds', 'add', id, session);
        if (hodSuccess) console.log(`➕ Added to new HOD ${newHod._id} managedMemberIds`);

        // 2b. Add to new manager's managedMemberIds (if new manager assigned)
        if (updateData.managerId) {
          const newManager = await User.findById(updateData.managerId).session(session);
          if (newManager) {
            const managerSuccess = await updateManagedList(newManager._id, 'managedMemberIds', 'add', id, session);
            if (managerSuccess) console.log(`➕ Added to new manager ${newManager._id} managedMemberIds`);
          } else {
            console.warn(`⚠️ New manager ${updateData.managerId} not found`);
          }
        } else {
          console.log(`ℹ️ No new manager assigned - member reports directly to HOD`);
        }

        console.log(`✅ Member department change completed for user ${id}`);
        console.log(`📊 Summary: Removed from old dept ${oldDeptId}, added to new dept ${newDeptId}`);
      }

      // ============================================
      // UPDATE THE MAIN USER RECORD
      // ============================================
      console.log(`💾 Updating main user record for ${id}`);
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
          session
        }
      );

      if (!updatedUser) {
        throw new Error('Failed to update user record');
      }

      // Commit the transaction
      await session.commitTransaction();

      console.log(`✅ User ${id} updated successfully`);
      if (roleChangeProcessed) {
        console.log(`🔄 Role change logic executed for user ${id}`);
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser,
        roleChangeProcessed: roleChangeProcessed
      });

    } catch (error) {
      // Abort transaction on error
      console.error('❌ Transaction failed:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('💥 Error updating user:', error);

    // Determine appropriate error status
    let statusCode = 500;
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('Validation') || error.message.includes('required')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to get user with populated relationships (for debugging)
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName role')
      .populate('managedManagerIds', 'firstName lastName role')
      .populate('managedMemberIds', 'firstName lastName role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get department head info
    let departmentHead = null;
    if (user.departmentId) {
      departmentHead = await User.findOne({
        role: 'department_head',
        departmentId: user.departmentId
      }).select('firstName lastName _id');
    }

    res.json({
      success: true,
      user: user,
      departmentHead: departmentHead,
      relationships: {
        reportsTo: user.managerId,
        managesManagers: user.managedManagerIds?.length || 0,
        managesMembers: user.managedMemberIds?.length || 0,
        departmentHead: departmentHead?._id || null
      }
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user details',
      error: error.message
    });
  }
};

// Bulk update relationships (for maintenance/testing)
exports.bulkUpdateRelationships = async (req, res) => {
  try {
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Rebuild all HOD relationships
      const hods = await User.find({ role: 'department_head' }).session(session);

      for (const hod of hods) {
        // Find all managers in this department
        const managers = await User.find({
          role: 'manager',
          departmentId: hod.departmentId
        }).session(session);

        // Find all members in this department (not assigned to managers)
        const members = await User.find({
          role: 'member',
          departmentId: hod.departmentId,
          managerId: { $exists: false }
        }).session(session);

        // Update HOD's managed lists
        hod.managedManagerIds = managers.map(m => m._id);
        hod.managedMemberIds = members.map(m => m._id);
        await hod.save({ session });
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Relationships rebuilt successfully',
        hodsProcessed: hods.length
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error rebuilding relationships:', error);
    res.status(500).json({
      success: false,
      message: 'Error rebuilding relationships',
      error: error.message
    });
  }
};

// Validate department relationships (for testing)
exports.validateRelationships = async (req, res) => {
  try {
    const issues = [];

    // Check all HODs have departments
    const hodsWithoutDept = await User.find({
      role: 'department_head',
      departmentId: { $exists: false }
    });
    if (hodsWithoutDept.length > 0) {
      issues.push(`${hodsWithoutDept.length} HODs without department`);
    }

    // Check departments have HODs
    const deptsWithoutHod = await Department.find({
      headId: { $exists: false }
    });
    if (deptsWithoutHod.length > 0) {
      issues.push(`${deptsWithoutHod.length} departments without HOD`);
    }

    // Check managers are in HOD's managed list
    const managers = await User.find({ role: 'manager' });
    for (const manager of managers) {
      const hod = await User.findOne({
        role: 'department_head',
        departmentId: manager.departmentId
      });

      if (hod && !hod.managedManagerIds?.includes(manager._id)) {
        issues.push(`Manager ${manager._id} not in HOD's managed list`);
      }
    }

    res.json({
      success: true,
      valid: issues.length === 0,
      issues: issues,
      summary: {
        totalHods: await User.countDocuments({ role: 'department_head' }),
        totalManagers: managers.length,
        totalMembers: await User.countDocuments({ role: 'member' })
      }
    });

  } catch (error) {
    console.error('Error validating relationships:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating relationships',
      error: error.message
    });
  }
};
