import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  MoreVertical,
  UserCheck
} from 'lucide-react';
import { mockDepartments, mockUsers } from '@/data/mockData';
import { Department, User } from '@/types/company';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';
import EnhancedManageMembersDialog from './EnhancedManageMembersDialog';
import DepartmentHierarchy from './DepartmentHierarchy';
import DepartmentTaskDetails from './DepartmentTaskDetails';

export default function DepartmentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentHead = (headId?: string): User | undefined => {
    return users.find(user => user.id === headId);
  };

  const getDepartmentMembers = (deptId: string): User[] => {
    const department = departments.find(d => d.id === deptId);
    if (!department) return [];
    return users.filter(user => department.memberIds.includes(user.id));
  };

  const getDepartmentManagers = (deptId: string): User[] => {
    const department = departments.find(d => d.id === deptId);
    if (!department) return [];
    return users.filter(user => department.managerIds.includes(user.id));
  };

  const addDepartment = (departmentData: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => {
    const newDepartment: Department = {
      ...departmentData,
      id: Date.now().toString(),
      createdAt: new Date(),
      memberCount: 0,
      managerIds: departmentData.managerIds || [],
      memberIds: departmentData.memberIds || []
    };
    setDepartments([...departments, newDepartment]);
    toast({
      title: "Department Added",
      description: `${departmentData.name} has been created successfully.`,
    });
  };

  const editDepartment = (id: string, departmentData: Omit<Department, 'id' | 'createdAt' | 'memberCount'>) => {
    setDepartments(departments.map(dept => 
      dept.id === id 
        ? { 
            ...dept, 
            ...departmentData,
            memberCount: getDepartmentMembers(id).length
          }
        : dept
    ));
    toast({
      title: "Department Updated",
      description: `${departmentData.name} has been updated successfully.`,
    });
  };

  const deleteDepartment = (id: string) => {
    const department = departments.find(d => d.id === id);
    setDepartments(departments.filter(dept => dept.id !== id));
    // Remove department from all users
    setUsers(users.map(user => 
      user.departmentId === id 
        ? { ...user, departmentId: undefined, managerId: undefined }
        : user
    ));
    toast({
      title: "Department Deleted",
      description: `${department?.name} has been deleted successfully.`,
      variant: "destructive",
    });
  };

  const updateDepartmentMembers = (departmentId: string, memberIds: string[], managerIds: string[], headId?: string) => {
    // Remove department from all current members
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.departmentId === departmentId 
          ? { ...user, departmentId: undefined, managerId: undefined }
          : user
      )
    );
    
    // Add department to new members and update their roles
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (memberIds.includes(user.id)) {
          let managerId = undefined;
          if (managerIds.includes(user.id) && headId) {
            managerId = headId; // Managers report to head
          } else if (!managerIds.includes(user.id) && user.id !== headId) {
            // Regular members report to first available manager or head
            const availableManagerId = managerIds[0] || headId;
            if (availableManagerId && availableManagerId !== user.id) {
              managerId = availableManagerId;
            }
          }
          
          return { ...user, departmentId, managerId };
        }
        return user;
      })
    );

    // Update department with new structure
    setDepartments(prevDepts => 
      prevDepts.map(dept => 
        dept.id === departmentId 
          ? { 
              ...dept, 
              memberIds,
              managerIds,
              headId,
              memberCount: memberIds.length 
            }
          : dept
      )
    );

    toast({
      title: "Department Updated",
      description: "Department hierarchy has been updated successfully.",
    });
  };

  const stats = [
    {
      title: 'Total Departments',
      value: departments.length,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Total Employees',
      value: users.filter(u => u.isActive).length,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Departments with Heads',
      value: departments.filter(d => d.headId).length,
      icon: UserCheck,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground">Manage company departments and their structure</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => {
          const head = getDepartmentHead(department.headId);
          const members = getDepartmentMembers(department.id);
          const managers = getDepartmentManagers(department.id);
          
            return (
              <Card key={department.id} className="relative hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-background to-muted/30 rounded-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-background" 
                        style={{ backgroundColor: department.color }}
                      />
                      <div>
                        <CardTitle className="text-lg font-semibold tracking-tight">{department.name}</CardTitle>
                      </div>
                    </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border shadow-md">
                      <DropdownMenuItem onClick={() => {
                        setSelectedDepartment(department);
                        setShowEditDialog(true);
                      }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Department
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedDepartment(department);
                        setShowDeleteDialog(true);
                      }} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {department.description}
                </p>
                
                {/* Department Head */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  {head ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-medium">
                        Department Head
                      </Badge>
                      <span className="text-sm font-semibold">{head.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Badge variant="outline" className="text-xs">
                        No Head Assigned
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Member Count */}
                <div className="flex items-center justify-between py-3 px-4 bg-muted/20 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Total Members</span>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {members.length}
                  </Badge>
                </div>

                {/* Department Statistics */}
                <div className="grid grid-cols-3 gap-3 text-center py-4 px-2 bg-gradient-to-r from-muted/20 to-muted/30 rounded-lg border border-border/50">
                  <div className="p-2 rounded-md bg-background/50">
                    <p className="text-xl font-bold text-yellow-600">{head ? 1 : 0}</p>
                    <p className="text-xs font-medium text-muted-foreground">Head</p>
                  </div>
                  <div className="p-2 rounded-md bg-background/50">
                    <p className="text-xl font-bold text-blue-600">{managers.length}</p>
                    <p className="text-xs font-medium text-muted-foreground">Managers</p>
                  </div>
                  <div className="p-2 rounded-md bg-background/50">
                    <p className="text-xl font-bold text-gray-600">{members.length - managers.length - (head ? 1 : 0)}</p>
                    <p className="text-xs font-medium text-muted-foreground">Members</p>
                  </div>
                </div>

                {/* Recent Members */}
                {members.length > 0 && (
                  <div className="space-y-3 bg-muted/20 rounded-lg p-4 border border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key People</p>
                    <div className="space-y-2">
                      {head && (
                        <div className="flex items-center gap-3 p-2 bg-background/60 rounded-md border border-border/40">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-semibold text-yellow-700">
                              {head.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium flex-1">{head.name}</span>
                          <Badge variant="default" className="text-xs font-medium">
                            Head
                          </Badge>
                        </div>
                      )}
                      {managers.slice(0, 2).map((manager) => (
                        <div key={manager.id} className="flex items-center gap-3 p-2 bg-background/60 rounded-md border border-border/40">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-semibold text-blue-700">
                              {manager.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium flex-1">{manager.name}</span>
                          <Badge variant="secondary" className="text-xs font-medium">
                            Manager
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full font-medium shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setShowTaskDetailsDialog(true);
                    }}
                  >
                    View Department Tasks
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 font-medium border-border/60 hover:border-border transition-all duration-200"
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowHierarchyDialog(true);
                      }}
                    >
                      View Hierarchy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 font-medium border-border/60 hover:border-border transition-all duration-200"
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowMembersDialog(true);
                      }}
                    >
                      Manage Members
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDepartments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No departments found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first department'}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddDepartmentDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addDepartment}
      />

      <EditDepartmentDialog
        open={showEditDialog}
        department={selectedDepartment}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedDepartment(null);
        }}
        onSave={editDepartment}
      />

      <EnhancedManageMembersDialog
        open={showMembersDialog}
        department={selectedDepartment}
        onClose={() => {
          setShowMembersDialog(false);
          setSelectedDepartment(null);
        }}
        onUpdateMembers={updateDepartmentMembers}
      />

      {/* Task Details Dialog */}
      {selectedDepartment && (
        <Dialog open={showTaskDetailsDialog} onOpenChange={setShowTaskDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Department Task Details</DialogTitle>
            </DialogHeader>
            <DepartmentTaskDetails 
              department={selectedDepartment} 
              users={users}
            />
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowTaskDetailsDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hierarchy Dialog */}
      {selectedDepartment && (
        <Dialog open={showHierarchyDialog} onOpenChange={setShowHierarchyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Department Hierarchy</DialogTitle>
            </DialogHeader>
            <DepartmentHierarchy 
              department={selectedDepartment} 
              users={users}
            />
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowHierarchyDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the department
              "{selectedDepartment?.name}" and remove all members from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedDepartment(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDepartment) {
                  deleteDepartment(selectedDepartment.id);
                }
                setShowDeleteDialog(false);
                setSelectedDepartment(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}