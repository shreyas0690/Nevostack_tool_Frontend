import { useState, useEffect } from 'react';
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
import { User } from '@/types/company';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { Phone, UserIcon, Mail, Shield, Building2, Users, CheckCircle, Loader2, Edit } from 'lucide-react';
import { toUiRole } from '@/utils/roleMap';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  mobileNumber: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'department_head', 'manager', 'member', 'hr', 'hr_manager', 'person']),
  departmentId: z.string().optional(),
  hodId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export default function EditUserDialog({ open, onOpenChange, user, onUserUpdated }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      role: 'member',
      departmentId: '',
        hodId: '',
      managerId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
        lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        email: user.email,
        mobileNumber: user.mobileNumber || '',
        role: (toUiRole(user.role) || user.role) as FormData['role'],
        departmentId: user.departmentId || 'none',
        hodId: (user as any).hodId || 'none',
        managerId: user.managerId || 'none',
        isActive: user.isActive,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('EditUserDialog onSubmit data:', data);
      console.log('EditUserDialog form values before normalize:', form.getValues());
      
      // Normalize values: convert 'none' to undefined so backend receives proper empty values
      const normalizedDept = data.departmentId && data.departmentId !== 'none' ? data.departmentId : undefined;
      const normalizedManager = data.managerId && data.managerId !== 'none' ? data.managerId : undefined;
      const normalizedHod = (data as any).hodId && (data as any).hodId !== 'none' ? (data as any).hodId : undefined;

      // HOD Change Logic - Special handling for HOD changes
      const currentUserRole = toUiRole(user.role);
      const isHodChange = currentUserRole === 'department_head' && data.role !== 'department_head';
      const isNewHodAssignment = data.role === 'department_head' && currentUserRole !== 'department_head';
      const currentUserDeptId = user.departmentId ? String(user.departmentId) : '';
      const isHodToHodChange = currentUserRole === 'department_head' &&
        data.role === 'department_head' &&
        !!normalizedDept &&
        String(normalizedDept) !== currentUserDeptId;

      console.log('HOD Change Detection:', {
        isHodChange,
        isNewHodAssignment,
        isHodToHodChange,
        currentRole: currentUserRole || user.role,
        newRole: data.role
      });

      const updatedUser: User = {
        ...user,
        firstName: data.firstName,
        lastName: data.lastName || '',
        name: `${data.firstName} ${data.lastName || ''}`.trim(),
        email: data.email,
        mobileNumber: data.mobileNumber,
        role: data.role,
        departmentId: normalizedDept,
        managerId: normalizedManager,
        isActive: data.isActive,
      };

      // Special handling for HOD changes
      if (isHodChange) {
        console.log('🔄 HOD Demotion: Clearing all HOD relationships');
        (updatedUser as any).managedManagerIds = [];
        (updatedUser as any).managedMemberIds = [];
      }

      if (isNewHodAssignment) {
        console.log('⬆️ New HOD Assignment: Will transfer relationships from existing HOD');
        // Backend will handle relationship transfer automatically
      }

      if (isHodToHodChange) {
        console.log('🔄 HOD to HOD Change: Will transfer all relationships');
        // Backend will handle relationship transfer automatically
      }

      // Attach hodId to payload when present (some backends expect hodId)
      if (normalizedHod) {
        (updatedUser as any).hodId = normalizedHod;
      }

      // Add HOD change metadata for backend
      (updatedUser as any).hodChangeMetadata = {
        isHodChange,
        isNewHodAssignment,
        isHodToHodChange,
        previousRole: user.role,
        newRole: data.role
      };

      console.log('Final updatedUser payload:', updatedUser);

      onUserUpdated(updatedUser);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = form.watch('role');
  const selectedDepartmentId = form.watch('departmentId');
  const selectedHodId = form.watch('hodId');

  // HOD Change Detection
  const currentUserRoleForUi = toUiRole(user?.role);
  const isCurrentHod = currentUserRoleForUi === 'department_head';
  const isChangingToHod = selectedRole === 'department_head';
  const isHodChange = isCurrentHod && !isChangingToHod;
  const isNewHodAssignment = !isCurrentHod && isChangingToHod;

  // Fetch departments and users from API for real data
  const { data: fetchedDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res: any = await departmentService.getDepartments({ limit: 1000 });
      return (res && (res.data || res.departments)) || [];
    }
  });

  const { data: fetchedUsers = [] } = useQuery({
    queryKey: ['users-all-edit'],
    queryFn: async () => {
      const res: any = await userService.getUsers({ limit: 1000 });
      const list = (res && (res.data || res.users)) || [];
      return list.map((u: any) => ({
        ...u,
        role: toUiRole(u?.role),
        isActive: typeof u?.isActive === 'boolean' ? u.isActive : u?.status === 'active',
      }));
    }
  });

  // Normalize departments with their HODs (only show departments that have an active HOD)
  const departmentsWithHODs = (fetchedDepts || []).map((dept: any) => {
    const hod = (fetchedUsers || []).find((u: any) =>
      u.role === 'department_head' &&
      (String(u.departmentId || (u.department && (u.department._id || u.department.id))) === String(dept.id) || String(u.departmentId) === String(dept.id)) &&
      u.isActive
    );
    return { ...dept, hod };
  }).filter((d: any) => d.hod);

  // Helper to normalize user's department id from different backend shapes
  const extractUserDepartmentId = (u: any) => {
    if (!u) return '';
    if (u.departmentId && typeof u.departmentId === 'string') return u.departmentId;
    if (u.department) {
      if (typeof u.department === 'string') return u.department;
      if (u.department._id) return String(u.department._id);
      if (u.department.id) return String(u.department.id);
    }
    if (u.dept) return typeof u.dept === 'string' ? u.dept : String(u.dept._id || u.dept.id || u.dept);
    if (u.deptId) return typeof u.deptId === 'string' ? u.deptId : String(u.deptId._id || u.deptId.id || u.deptId);
    return '';
  };

  // Filter managers based on selected department and role hierarchy (exclude department_head)
  const availableManagers = selectedDepartmentId && selectedDepartmentId !== 'none'
    ? (fetchedUsers || []).filter((u: any) => {
        try {
          if (!u || !u.isActive) return false;
          if (u.role !== 'manager') return false; // only managers
          const uDeptId = extractUserDepartmentId(u);
          const directMatch = String(uDeptId) === String(selectedDepartmentId);
          const stringMatch = String(u.departmentId) === String(selectedDepartmentId);
          const objectMatch = u.department && (String(u.department._id) === String(selectedDepartmentId) || String(u.department.id) === String(selectedDepartmentId));
          return directMatch || stringMatch || objectMatch;
        } catch (e) {
          return false;
        }
      })
    : [];

  // Fallback: try lenient matching by department name if no managers found
  let finalAvailableManagers = availableManagers;
  if (finalAvailableManagers.length === 0 && selectedDepartmentId && selectedDepartmentId !== 'none') {
    const selDept = (fetchedDepts || []).find((d: any) => String(d.id) === String(selectedDepartmentId));
    if (selDept) {
      const fallback = (fetchedUsers || []).filter((u: any) => u && u.isActive && u.role === 'manager' && u.department && u.department.name === selDept.name);
      if (fallback.length > 0) finalAvailableManagers = fallback;
    }
  }

  // HOD (department_head) options for selected department
  const availableHods = (fetchedUsers || []).filter((u: any) =>
    u.role === 'department_head' &&
    u.isActive &&
    u.id !== user?.id &&
    (!selectedDepartmentId || selectedDepartmentId === 'none' || String(extractUserDepartmentId(u)) === String(selectedDepartmentId))
  );

  // Reset dependent fields when role changes
  const handleRoleChange = (newRole: string) => {
    form.setValue('role', newRole as any);
    // use 'none' sentinel to match selects and onSubmit conversion
    form.setValue('departmentId', 'none');
    form.setValue('hodId', 'none');
    form.setValue('managerId', 'none');
    // managers don't have a manager
    if (newRole === 'manager') form.setValue('managerId', 'none');
  };

  // Handle department selection
  const handleDepartmentChange = (departmentId: string) => {
    form.setValue('departmentId', departmentId);
    form.setValue('hodId', 'none');
    form.setValue('managerId', 'none');
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-slate-200 dark:border-slate-700">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 dark:from-red-400 dark:via-red-500 dark:to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit User Profile</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Update user information, role, and department assignment
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
            </div>

            {/* Contact Information Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
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
                      <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
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
            </div>

            {/* HOD Change Warning */}
            {isHodChange && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">⚠</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">HOD Demotion Warning</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      You are demoting a Department Head. This will:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 ml-4 list-disc">
                      <li>Remove all management relationships</li>
                      <li>Clear department head assignment</li>
                      <li>Require a new HOD to be assigned</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {isNewHodAssignment && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">ℹ</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">New HOD Assignment</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Promoting user to Department Head will:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 list-disc">
                      <li>Transfer all existing HOD relationships</li>
                      <li>Demote current HOD to member</li>
                      <li>Update department head assignment</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Role & Department Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Role & Department</h3>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Shield className="h-4 w-4" />
                        Role
                      </FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); handleRoleChange(v); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">👤 Member</SelectItem>
                          <SelectItem value="manager">👨‍💼 Manager</SelectItem>
                          <SelectItem value="department_head">🏢 Department Head</SelectItem>
                          <SelectItem value="admin">🛡 Admin</SelectItem>
                          <SelectItem value="super_admin">👑 Super Admin</SelectItem>
                          <SelectItem value="hr">👥 HR</SelectItem>
                          <SelectItem value="hr_manager">👨‍💼 HR Manager</SelectItem>
                          <SelectItem value="person">👤 Person</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department field - Hide for person and HR roles */}
                {selectedRole !== 'person' && selectedRole !== 'hr' && selectedRole !== 'hr_manager' && (
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Building2 className="h-4 w-4" />
                          Department
                        </FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); handleDepartmentChange(v); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {fetchedDepts.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                🏢 {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Show HOD select only when role is 'member' and a department is chosen */}
                {(selectedRole === 'member' || selectedRole === 'manager') && selectedDepartmentId && selectedDepartmentId !== 'none' && (
                  <FormField
                    control={form.control}
                    name="hodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Shield className="h-4 w-4" />
                          Department HOD
                        </FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                              <SelectValue placeholder="Select HOD" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No HOD</SelectItem>
                            {availableHods.map((hod: any) => (
                              <SelectItem key={hod.id} value={hod.id}>
                                🧑‍🏫 {hod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedRole !== 'super_admin' &&
                  selectedRole !== 'admin' &&
                  selectedRole !== 'person' &&
                  selectedRole !== 'manager' &&
                  selectedRole !== 'department_head' &&
                  selectedRole !== 'hr' &&
                  selectedRole !== 'hr_manager' && (
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Users className="h-4 w-4" />
                          Manager
                        </FormLabel>
                        {/* If role is member, only show managers after HOD is selected (or show all if not member) */}
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400">
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Manager</SelectItem>
                            { (selectedRole === 'member' ?
                                // when member, use finalAvailableManagers (fallback handled)
                                (selectedHodId && selectedHodId !== 'none'
                                  ? finalAvailableManagers.filter((m) => String(m.departmentId || (m.department && (m.department._id || m.department.id))) === String(selectedDepartmentId))
                                  : finalAvailableManagers
                                )
                                : finalAvailableManagers
                              ).map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                👨‍💼 {manager.name} ({manager.role})
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
            </div>

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
                      <FormLabel className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
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

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-600 rounded-lg font-medium transition-all duration-200"
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating User...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
