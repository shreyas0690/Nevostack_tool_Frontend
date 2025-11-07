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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Department, User } from '@/types/company';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Palette, User as UserIcon, Save, X, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditDepartmentDialogProps {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onSave: (id: string, department: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => void;
}

const colors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function EditDepartmentDialog({ open, department, onClose, onSave }: EditDepartmentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headId: 'none',
    color: colors[0]
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch actual company users to show as potential heads
  const { data: companyUsers = [] } = useQuery({
    queryKey: ['companyUsers', department?.companyId],
    queryFn: async () => {
      if (!department?.companyId) return [];
      const resp = await userService.getUsers({ limit: 1000, companyId: department.companyId });
      return (resp as any).data || (resp as any).users || [];
    },
    enabled: !!department?.companyId,
    staleTime: 1000 * 60 * 5
  });

  // Show all users in the company, but sort by role priority so potential heads appear first
  const rolePriority = ['department_head', 'manager', 'admin', 'super_admin', 'hr_manager', 'hr', 'member', 'person'];
  // Exclude users with role 'admin' from selection
  const availableHeads = (companyUsers || []).filter((u: User) => (u.role || '').toLowerCase() !== 'admin').slice().sort((a: User, b: User) => {
    const aRole = (a.role || '').toLowerCase();
    const bRole = (b.role || '').toLowerCase();
    const aIdx = rolePriority.indexOf(aRole) === -1 ? rolePriority.length : rolePriority.indexOf(aRole);
    const bIdx = rolePriority.indexOf(bRole) === -1 ? rolePriority.length : rolePriority.indexOf(bRole);
    if (aIdx !== bIdx) return aIdx - bIdx;
    // fallback to name
    const aName = (a.firstName || '') + ' ' + (a.lastName || '');
    const bName = (b.firstName || '') + ' ' + (b.lastName || '');
    return aName.localeCompare(bName);
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        headId: department.headId || 'none',
        color: department.color
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    
    setIsLoading(true);
    
    try {
      await onSave(department.id, {
        name: formData.name,
        description: formData.description,
        headId: formData.headId === 'none' ? undefined : formData.headId,
        color: formData.color,
        managerIds: department.managerIds || [],
        memberIds: department.memberIds || []
      });
      
      toast.success(`${formData.name} has been updated successfully!`);
      
      onClose();
    } catch (error: any) {
      toast.error(`Failed to update department: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Edit Department
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Update department information, team structure, and visual identity
          </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Department Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department Name
              </Label>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Engineering, Marketing, Sales"
              required
              className="h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800"
            />
          </div>
          
          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department Description
              </Label>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the department's role, responsibilities, and objectives..."
              required
              rows={3}
              className="rounded-xl border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800 resize-none"
            />
          </div>

          {/* Department Head Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="head" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department Head
              </Label>
              <span className="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
            </div>
            <Select value={formData.headId} onValueChange={(value) => setFormData({ ...formData, headId: value })}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800">
                <SelectValue placeholder="Select a department head" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-600">
                <SelectItem value="none" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-slate-500" />
                    </div>
                    <span>No head assigned</span>
                  </div>
                </SelectItem>
                {availableHeads.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <UserIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Color Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department Color
              </Label>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-105 shadow-md ${
                    formData.color === color 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/25' 
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                >
                  {formData.color === color && (
                    <div className="w-full h-full rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose a color to represent this department in charts and visualizations
            </p>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Preview
            </Label>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: formData.color }}
                />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {formData.name || 'Department Name'}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formData.description || 'Department description will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}