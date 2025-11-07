import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User as UserType, UserRole } from '@/types/company';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { 
  UserPlus, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Calendar, 
  Shield, 
  Building2, 
  Users, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Phone
} from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobileNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  role: z.enum(['department_head', 'manager', 'member', 'hr', 'hr_manager', 'person']),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (user: UserType) => void;
}

export default function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      mobileNumber: '',
      dateOfBirth: '',
      role: 'person',
      departmentId: '',
      managerId: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const newUser: any = {
        id: `user-${Date.now()}`,
        name: `${data.firstName} ${data.lastName || ''}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName || '',
        email: data.email,
        password: data.password,
        mobileNumber: data.mobileNumber || undefined,
        role: data.role,
        departmentId: data.departmentId || undefined,
        managerId: data.managerId || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        isActive: data.isActive,
        createdAt: new Date(),
      };


      // If creating a manager, attach hodId so backend validation passes
      if (data.role === 'manager') {
        // find HOD for the selected department
        const dept = departmentsWithHODs.find((d: any) => String(d.id) === String(data.departmentId));
        if (!dept || !dept.hod) {
          console.error('No HOD found for selected department');
          return;
        }
        // include hodId in the payload passed to parent
        (newUser as any).hodId = dept.hod.id || dept.hod._id;
      }

      // include managerId as provided (or 'none') so backend can attach member to manager or HOD
      (newUser as any).managerId = data.managerId || 'none';
      onUserAdded(newUser);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = String(form.watch('role'));
  const selectedDepartmentId = String(form.watch('departmentId'));
  console.log("selectedRole", selectedRole)

  // Fetch departments and users from API
  const { data: fetchedDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res: any = await departmentService.getDepartments({ limit: 1000 });
      return (res && (res.data || res.departments)) || [];
    }
  });

  const { data: fetchedUsers = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => {
      const res: any = await userService.getUsers({ limit: 1000 });
      return (res && (res.data || res.users)) || [];
      console.log("name",res.data)
    }
  });

  // Normalize departments with their HODs (only show departments that have an active HOD)
  const departmentsWithHODs = fetchedDepts.map((dept: any) => {
    const hod = fetchedUsers.find((user: any) =>
      user.role === 'department_head' &&
      (String(user.departmentId || (user.department && (user.department._id || user.department.id))) === String(dept.id) || String(user.departmentId) === String(dept.id)) &&
      user.isActive
    );
    return { ...dept, hod };
  }).filter((dept: any) => dept.hod);

  // Helper to normalize user's department id from different backend shapes
  const extractUserDepartmentId = (user: any) => {
    if (!user) return '';
    
    // Try different possible department ID locations
    let departmentId = '';
    
    // First try departmentId field (string)
    if (user.departmentId && typeof user.departmentId === 'string') {
      departmentId = user.departmentId;
    }
    // Then try department object reference
    else if (user.department) {
      if (typeof user.department === 'string') {
        departmentId = user.department;
      } else if (user.department._id) {
        departmentId = String(user.department._id);
      } else if (user.department.id) {
        departmentId = String(user.department.id);
      }
    }
    // Try other possible field names
    else if (user.dept) {
      departmentId = typeof user.dept === 'string' ? user.dept : String(user.dept._id || user.dept.id || user.dept);
    }
    else if (user.deptId) {
      departmentId = typeof user.deptId === 'string' ? user.deptId : String(user.deptId._id || user.deptId.id || user.deptId);
    }
    
    return departmentId;
  };

  // Filter managers based on selected department and role hierarchy (robust to different user shapes)
  const availableManagers = selectedDepartmentId && selectedDepartmentId !== 'none'
    ? fetchedUsers.filter((user: any) => {
        try {
          if (!user || !user.isActive) return false;
          // Only show users whose role is 'manager' for manager assignment
          if (user.role !== 'manager') return false;
          
          const uDeptId = extractUserDepartmentId(user);
          
          // Multiple matching strategies for department ID
          const directMatch = String(uDeptId) === String(selectedDepartmentId);
          const stringMatch = String(user.departmentId) === String(selectedDepartmentId);
          const objectMatch = user.department && (
            String(user.department._id) === String(selectedDepartmentId) || 
            String(user.department.id) === String(selectedDepartmentId)
          );
          
          const isMatch = directMatch || stringMatch || objectMatch;
          
          // Debug logging
          if (isMatch) {
            console.log(`AddUserDialog: Found manager ${user.name} (${user.id}) in department ${selectedDepartmentId}`, {
              uDeptId,
              userDepartmentId: user.departmentId,
              userDepartment: user.department,
              selectedDepartmentId,
              directMatch,
              stringMatch,
              objectMatch
            });
          }
          
          return isMatch;
        } catch (e) {
          console.warn('AddUserDialog: Error filtering manager:', e, user);
          return false;
        }
      })
    : [];

  // Debug logging for available managers
  console.log(`AddUserDialog: Selected department: ${selectedDepartmentId}`);
  console.log(`AddUserDialog: Available managers:`, availableManagers.map(m => ({ name: m.name, id: m.id, departmentId: extractUserDepartmentId(m) })));
  console.log(`AddUserDialog: All fetched users:`, fetchedUsers.map(u => ({ 
    name: u.name, 
    role: u.role, 
    departmentId: extractUserDepartmentId(u),
    rawDepartmentId: u.departmentId,
    rawDepartment: u.department,
    isActive: u.isActive
  })));
  
  // Additional debug: Show all managers regardless of department
  const allManagers = fetchedUsers.filter(u => u.role === 'manager' && u.isActive);
  console.log(`AddUserDialog: All managers in system:`, allManagers.map(m => ({
    name: m.name,
    id: m.id,
    departmentId: extractUserDepartmentId(m),
    rawDepartmentId: m.departmentId,
    rawDepartment: m.department
  })));

  // Fallback: If no managers found with the main logic, try a more lenient approach
  let finalAvailableManagers = availableManagers;
  
  if (finalAvailableManagers.length === 0 && selectedDepartmentId && selectedDepartmentId !== 'none') {
    console.log('AddUserDialog: No managers found with main logic, trying fallback approach...');
    
    // Try to find managers by checking if their department name matches
    const selectedDept = fetchedDepts.find((d: any) => String(d.id) === String(selectedDepartmentId));
    if (selectedDept) {
      const fallbackManagers = fetchedUsers.filter((user: any) => {
        if (!user || !user.isActive || user.role !== 'manager') return false;
        
        // Check if user's department name matches selected department name
        if (user.department && user.department.name === selectedDept.name) {
          console.log(`AddUserDialog: Fallback found manager ${user.name} by department name match`);
          return true;
        }
        
          return false;
      });
      
      if (fallbackManagers.length > 0) {
        finalAvailableManagers = fallbackManagers;
        console.log('AddUserDialog: Using fallback managers:', fallbackManagers.map(m => m.name));
      }
    }
  }
  
  console.log("manager", finalAvailableManagers)
  console.log(`AddUserDialog: Final available managers:`, finalAvailableManagers.map(m => ({ name: m.name, id: m.id, departmentId: extractUserDepartmentId(m) })));

  // Reset dependent fields when role changes
  const handleRoleChange = (newRole: string) => {
    form.setValue('role', newRole as any);
    
    // Reset department and manager when role changes
    form.setValue('departmentId', '');
    form.setValue('managerId', '');
    
    // Special handling: Managers don't have managers, they report directly to HOD
    if (newRole === 'manager') {
      form.setValue('managerId', '');
    }
  };

  // Handle department selection for hierarchy
  const handleDepartmentChange = (departmentId: string) => {
    form.setValue('departmentId', departmentId);
    
    // Reset manager when department changes
    if (selectedRole === 'member') {
      form.setValue('managerId', '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-slate-200 dark:border-slate-700">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add New User</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Create a new user account with proper hierarchy and permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter first name" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter last name" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Mobile Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="Enter mobile number" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter password" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Role & Department Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Role & Department</h3>
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      User Role
                    </FormLabel>
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); handleRoleChange(v); }}>
                      <FormControl>
                        <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="department_head">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Department Head (HOD)
                          </div>
                        </SelectItem>
                        <SelectItem value="hr">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            HR
                          </div>
                        </SelectItem>
                        <SelectItem value="hr_manager">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            HR Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="person">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Person
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department Selection - Show different labels based on role */}
              {(selectedRole === 'manager' || selectedRole === 'member') && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {selectedRole === 'manager' 
                          ? 'Select HOD (Head of Department)' 
                          : selectedRole === 'member' 
                          ? 'Step 1: Select HOD (Head of Department)' 
                          : selectedRole === 'hr' || selectedRole === 'hr_manager'
                          ? 'Select Department'
                          : 'Department'}
                      </FormLabel>
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); handleDepartmentChange(v); }}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                            <SelectValue placeholder={
                              selectedRole === 'manager' 
                                ? 'Choose your HOD first' 
                                : selectedRole === 'member'
                                ? 'Choose HOD first'
                                : selectedRole === 'hr' || selectedRole === 'hr_manager'
                                ? 'Select department'
                                : 'Select department'
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedRole === 'manager' || selectedRole === 'member' ? (
                            departmentsWithHODs.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  {dept.name} - HOD: {dept.hod?.name}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="none">No Department</SelectItem>
                              {fetchedDepts.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {dept.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Regular Department Selection for other roles */}
              {selectedRole !== 'manager' && selectedRole !== 'member' && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Department
                      </FormLabel>
                      <Select value={field.value} onValueChange={(v) => { field.onChange(v); handleDepartmentChange(v); }}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {fetchedDepts.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {dept.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Manager Selection - ONLY for Members (not for Managers or Person) and only after department is selected */}
            {selectedRole === 'member' && selectedDepartmentId && selectedDepartmentId !== 'none' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Manager Assignment</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Step 2: Select Manager
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                            <SelectValue placeholder={
                              finalAvailableManagers.length > 0 
                                ? "Choose your manager" 
                                : "No managers available in this department"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {finalAvailableManagers.length > 0 ? (
                            <>
                              <SelectItem value="none">No Manager (Report directly to HOD)</SelectItem>
                              {finalAvailableManagers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {manager.name} (Manager)
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem value="none" disabled>
                              No managers in this department
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Select a manager from the chosen department, or report directly to the HOD.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Account Status Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Status</h3>
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Active Status
                      </FormLabel>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Enable user account and permissions
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding User...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Add User
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}