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
import { mockUsers } from '@/data/mockData';

interface AddDepartmentDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (department: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => void;
}

const colors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function AddDepartmentDialog({ open, onClose, onAdd }: AddDepartmentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headId: 'none',
    color: colors[0]
  });

  const availableHeads = mockUsers.filter(user => 
    user.role === 'department_head' || user.role === 'manager' || user.role === 'admin'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      description: formData.description,
      headId: formData.headId === 'none' ? undefined : formData.headId,
      color: formData.color,
      managerIds: [],
      memberIds: formData.headId === 'none' ? [] : [formData.headId]
    });
    setFormData({ name: '', description: '', headId: 'none', color: colors[0] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>
            Create a new department and assign a department head.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter department name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter department description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="head">Department Head (Optional)</Label>
            <Select value={formData.headId} onValueChange={(value) => setFormData({ ...formData, headId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No head assigned</SelectItem>
                {availableHeads.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Department Color</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-primary' : 'border-muted'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Department</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}