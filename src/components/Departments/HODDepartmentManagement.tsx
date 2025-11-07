import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Crown,
  Shield,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
  Trash2,
  Settings,
  ClipboardList,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Eye,
  MessageSquare,
  Activity,
  Trophy,
  Upload,
  Image as ImageIcon,
  Lock,
  Save,
  Undo2,
  Loader2,
  Briefcase
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useTenant } from '@/components/SaaS/TenantProvider';
import { useHODManagement } from '@/hooks/useHODManagement';
import { User, Task } from '@/types/company';
import hodService from '@/services/api/hodService';
import { userService } from '@/services/userService';
import authService from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { mockDepartments } from '@/data/mockData';
import { 
  hasHODPermission, 
  canManageDepartmentMember, 
  validateDepartmentAccess, 
  HOD_PERMISSIONS 
} from '@/utils/permissions';

export default function HODDepartmentManagement() {
  const { currentUser } = useAuth();
  const { getSystemBranding } = useTenant();
  
  const branding = getSystemBranding();
  
  // Get user's department ID
  const userDepartmentId = currentUser?.departmentId || '';
  
  // HOD Management Hook - using departmentId directly from user
  const {
    departmentUsers,
    department,
    departmentTasks,
    taskAnalytics,
    teamOverview,
    teamMembersWithTasks,
    isLoading,
    isLoadingUsers,
    isLoadingTasks,
    isLoadingOverview,
    isLoadingMembersWithTasks,
    isSubmitting,
    error,
    userError,
    taskError,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refreshData,
    clearErrors,
    fetchTeamOverview,
    fetchTeamMembersWithTasks,
    departmentHead: hodDepartmentHead,
    departmentManagers: hodDepartmentManagers,
    regularMembers: hodRegularMembers,
  } = useHODManagement(userDepartmentId);

  // Enhanced Dummy Data for Team Management
  const dummyDepartment = {
    id: 'dept-engineering',
    name: 'Engineering Department',
    description: 'Software Development and Technical Operations',
    memberCount: 28,
    projectCount: 12,
    completionRate: 87,
    budget: 450000,
    headId: currentUser?.id,
    color: '#3B82F6'
  };

  const dummyTeamMembers = [
    // HOD (Current User)
    {
      id: currentUser?.id || 'hod-1',
      firstName: currentUser?.firstName || 'Rajesh',
      lastName: currentUser?.lastName || 'Kumar',
      name: currentUser?.name || 'Rajesh Kumar',
      email: currentUser?.email || 'rajesh.kumar@company.com',
      role: 'department_head',
      phone: '+91-9876543210',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2020-01-15',
      status: 'active',
      avatar: '',
      experience: '8 years',
      skills: ['Team Leadership', 'Project Management', 'Architecture'],
      performance: { score: 95, rating: 'Excellent' },
      tasksCompleted: 142,
      tasksAssigned: 89,
      teamSize: 27
    },

    // Managers
    {
      id: 'mgr-1',
      firstName: 'Priya',
      lastName: 'Sharma',
      name: 'Priya Sharma',
      email: 'priya.sharma@company.com',
      role: 'manager',
      phone: '+91-9876543211',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-03-20',
      status: 'active',
      managerId: currentUser?.id,
      teamMembers: ['dev-1', 'dev-2', 'dev-3', 'dev-4', 'dev-5'],
      experience: '6 years',
      skills: ['Frontend Development', 'Team Management', 'React.js'],
      performance: { score: 92, rating: 'Excellent' },
      tasksCompleted: 87,
      tasksAssigned: 45,
      teamSize: 5
    },
    {
      id: 'mgr-2',
      firstName: 'Amit',
      lastName: 'Patel',
      name: 'Amit Patel',
      email: 'amit.patel@company.com',
      role: 'manager',
      phone: '+91-9876543212',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2020-11-10',
      status: 'active',
      managerId: currentUser?.id,
      teamMembers: ['dev-6', 'dev-7', 'dev-8', 'dev-9'],
      experience: '7 years',
      skills: ['Backend Development', 'DevOps', 'System Architecture'],
      performance: { score: 89, rating: 'Very Good' },
      tasksCompleted: 76,
      tasksAssigned: 38,
      teamSize: 4
    },
    {
      id: 'mgr-3',
      firstName: 'Sneha',
      lastName: 'Reddy',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@company.com',
      role: 'manager',
      phone: '+91-9876543213',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-07-05',
      status: 'active',
      managerId: currentUser?.id,
      teamMembers: ['dev-10', 'dev-11', 'dev-12', 'qa-1', 'qa-2'],
      experience: '5 years',
      skills: ['QA Management', 'Test Automation', 'Process Improvement'],
      performance: { score: 94, rating: 'Excellent' },
      tasksCompleted: 92,
      tasksAssigned: 52,
      teamSize: 5
    },

    // Frontend Team Members (Under Priya Sharma)
    {
      id: 'dev-1',
      firstName: 'Rahul',
      lastName: 'Agarwal',
      name: 'Rahul Agarwal',
      email: 'rahul.agarwal@company.com',
      role: 'member',
      phone: '+91-9876543214',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-01-15',
      status: 'active',
      managerId: 'mgr-1',
      experience: '3 years',
      skills: ['React.js', 'TypeScript', 'CSS3'],
      performance: { score: 88, rating: 'Very Good' },
      tasksCompleted: 45,
      tasksInProgress: 3
    },
    {
      id: 'dev-2',
      firstName: 'Anjali',
      lastName: 'Singh',
      name: 'Anjali Singh',
      email: 'anjali.singh@company.com',
      role: 'member',
      phone: '+91-9876543215',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-03-20',
      status: 'active',
      managerId: 'mgr-1',
      experience: '2.5 years',
      skills: ['Vue.js', 'JavaScript', 'UI/UX'],
      performance: { score: 85, rating: 'Good' },
      tasksCompleted: 38,
      tasksInProgress: 2
    },
    {
      id: 'dev-3',
      firstName: 'Vikash',
      lastName: 'Gupta',
      name: 'Vikash Gupta',
      email: 'vikash.gupta@company.com',
      role: 'member',
      phone: '+91-9876543216',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-11-10',
      status: 'active',
      managerId: 'mgr-1',
      experience: '4 years',
      skills: ['Angular', 'Node.js', 'MongoDB'],
      performance: { score: 91, rating: 'Excellent' },
      tasksCompleted: 67,
      tasksInProgress: 4
    },
    {
      id: 'dev-4',
      firstName: 'Pooja',
      lastName: 'Verma',
      name: 'Pooja Verma',
      email: 'pooja.verma@company.com',
      role: 'member',
      phone: '+91-9876543217',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-06-01',
      status: 'active',
      managerId: 'mgr-1',
      experience: '2 years',
      skills: ['React Native', 'JavaScript', 'Firebase'],
      performance: { score: 82, rating: 'Good' },
      tasksCompleted: 29,
      tasksInProgress: 2
    },
    {
      id: 'dev-5',
      firstName: 'Rohit',
      lastName: 'Mishra',
      name: 'Rohit Mishra',
      email: 'rohit.mishra@company.com',
      role: 'member',
      phone: '+91-9876543218',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2023-01-20',
      status: 'active',
      managerId: 'mgr-1',
      experience: '1.5 years',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'React.js'],
      performance: { score: 79, rating: 'Good' },
      tasksCompleted: 23,
      tasksInProgress: 3
    },

    // Backend Team Members (Under Amit Patel)
    {
      id: 'dev-6',
      firstName: 'Deepak',
      lastName: 'Joshi',
      name: 'Deepak Joshi',
      email: 'deepak.joshi@company.com',
      role: 'member',
      phone: '+91-9876543219',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-05-15',
      status: 'active',
      managerId: 'mgr-2',
      experience: '5 years',
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      performance: { score: 93, rating: 'Excellent' },
      tasksCompleted: 78,
      tasksInProgress: 2
    },
    {
      id: 'dev-7',
      firstName: 'Kavita',
      lastName: 'Nair',
      name: 'Kavita Nair',
      email: 'kavita.nair@company.com',
      role: 'member',
      phone: '+91-9876543220',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-09-10',
      status: 'active',
      managerId: 'mgr-2',
      experience: '4 years',
      skills: ['Node.js', 'Express.js', 'MongoDB', 'Docker'],
      performance: { score: 87, rating: 'Very Good' },
      tasksCompleted: 63,
      tasksInProgress: 3
    },
    {
      id: 'dev-8',
      firstName: 'Suresh',
      lastName: 'Kumar',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@company.com',
      role: 'member',
      phone: '+91-9876543221',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-02-14',
      status: 'active',
      managerId: 'mgr-2',
      experience: '3 years',
      skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes'],
      performance: { score: 90, rating: 'Excellent' },
      tasksCompleted: 55,
      tasksInProgress: 4
    },
    {
      id: 'dev-9',
      firstName: 'Meera',
      lastName: 'Shah',
      name: 'Meera Shah',
      email: 'meera.shah@company.com',
      role: 'member',
      phone: '+91-9876543222',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-08-20',
      status: 'active',
      managerId: 'mgr-2',
      experience: '2 years',
      skills: ['PHP', 'Laravel', 'MySQL', 'Redis'],
      performance: { score: 84, rating: 'Good' },
      tasksCompleted: 41,
      tasksInProgress: 2
    },

    // QA Team Members (Under Sneha Reddy)
    {
      id: 'qa-1',
      firstName: 'Ashwin',
      lastName: 'Rao',
      name: 'Ashwin Rao',
      email: 'ashwin.rao@company.com',
      role: 'member',
      phone: '+91-9876543223',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-12-01',
      status: 'active',
      managerId: 'mgr-3',
      experience: '4 years',
      skills: ['Selenium', 'Test Automation', 'API Testing', 'Performance Testing'],
      performance: { score: 89, rating: 'Very Good' },
      tasksCompleted: 72,
      tasksInProgress: 3
    },
    {
      id: 'qa-2',
      firstName: 'Divya',
      lastName: 'Iyer',
      name: 'Divya Iyer',
      email: 'divya.iyer@company.com',
      role: 'member',
      phone: '+91-9876543224',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-04-10',
      status: 'active',
      managerId: 'mgr-3',
      experience: '3 years',
      skills: ['Manual Testing', 'Bug Tracking', 'Test Case Design', 'Regression Testing'],
      performance: { score: 86, rating: 'Very Good' },
      tasksCompleted: 58,
      tasksInProgress: 2
    },

    // Additional developers under QA manager
    {
      id: 'dev-10',
      firstName: 'Karan',
      lastName: 'Jain',
      name: 'Karan Jain',
      email: 'karan.jain@company.com',
      role: 'member',
      phone: '+91-9876543225',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2021-08-15',
      status: 'active',
      managerId: 'mgr-3',
      experience: '3.5 years',
      skills: ['Full Stack Development', 'React.js', 'Node.js', 'Testing'],
      performance: { score: 88, rating: 'Very Good' },
      tasksCompleted: 61,
      tasksInProgress: 3
    },
    {
      id: 'dev-11',
      firstName: 'Nisha',
      lastName: 'Bansal',
      name: 'Nisha Bansal',
      email: 'nisha.bansal@company.com',
      role: 'member',
      phone: '+91-9876543226',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2022-09-05',
      status: 'active',
      managerId: 'mgr-3',
      experience: '2 years',
      skills: ['Frontend Development', 'Testing', 'Documentation'],
      performance: { score: 83, rating: 'Good' },
      tasksCompleted: 37,
      tasksInProgress: 2
    },
    {
      id: 'dev-12',
      firstName: 'Arjun',
      lastName: 'Menon',
      name: 'Arjun Menon',
      email: 'arjun.menon@company.com',
      role: 'member',
      phone: '+91-9876543227',
      department: dummyDepartment.name,
      departmentId: 'dept-engineering',
      joiningDate: '2023-02-10',
      status: 'active',
      managerId: 'mgr-3',
      experience: '1 year',
      skills: ['JavaScript', 'HTML/CSS', 'Basic Testing'],
      performance: { score: 76, rating: 'Satisfactory' },
      tasksCompleted: 19,
      tasksInProgress: 4
    }
  ];

  // Enhanced Performance Analytics
  const dummyTaskAnalytics = {
    totalTasks: 287,
    completedTasks: 249,
    inProgressTasks: 28,
    pendingTasks: 10,
    overdueTasks: 5,
    completionRate: 87,
    averageTasksPerMember: 10.2,
    
    // Department Performance
    departmentPerformance: {
      thisMonth: {
        tasksCompleted: 89,
        tasksAssigned: 103,
        completionRate: 86,
        averageCompletionTime: 4.2 // days
      },
      lastMonth: {
        tasksCompleted: 95,
        tasksAssigned: 98,
        completionRate: 97,
        averageCompletionTime: 3.8
      },
      improvement: -11 // percentage change
    },

    // Team Performance by Manager
    teamPerformance: [
      {
        managerId: 'mgr-1',
        managerName: 'Priya Sharma',
        teamName: 'Frontend Team',
        teamSize: 5,
        tasksCompleted: 202,
        tasksInProgress: 14,
        completionRate: 93,
        averageRating: 85.0,
        members: dummyTeamMembers.filter(m => m.managerId === 'mgr-1')
      },
      {
        managerId: 'mgr-2',
        managerName: 'Amit Patel',
        teamName: 'Backend Team',
        teamSize: 4,
        tasksCompleted: 237,
        tasksInProgress: 11,
        completionRate: 96,
        averageRating: 88.5,
        members: dummyTeamMembers.filter(m => m.managerId === 'mgr-2')
      },
      {
        managerId: 'mgr-3',
        managerName: 'Sneha Reddy',
        teamName: 'QA & Development Team',
        teamSize: 5,
        tasksCompleted: 247,
        tasksInProgress: 14,
        completionRate: 95,
        averageRating: 86.4,
        members: dummyTeamMembers.filter(m => m.managerId === 'mgr-3')
      }
    ],

    // Top Performers
    topPerformers: [
      { id: 'dev-6', name: 'Deepak Joshi', score: 93, tasksCompleted: 78 },
      { id: 'mgr-3', name: 'Sneha Reddy', score: 94, tasksCompleted: 92 },
      { id: 'mgr-1', name: 'Priya Sharma', score: 92, tasksCompleted: 87 },
      { id: 'dev-3', name: 'Vikash Gupta', score: 91, tasksCompleted: 67 },
      { id: 'dev-8', name: 'Suresh Kumar', score: 90, tasksCompleted: 55 }
    ],

    // Task Distribution by Priority
    tasksByPriority: {
      urgent: 12,
      high: 45,
      medium: 156,
      low: 74
    },

    // Task Distribution by Category
    tasksByCategory: {
      development: 145,
      bug_fix: 67,
      feature: 89,
      testing: 43,
      documentation: 28,
      meeting: 15
    },

    // Weekly Progress
    weeklyProgress: [
      { week: 'Week 1', completed: 23, assigned: 25 },
      { week: 'Week 2', completed: 28, assigned: 30 },
      { week: 'Week 3', completed: 32, assigned: 28 },
      { week: 'Week 4', completed: 27, assigned: 35 }
    ]
  };

  // Use dummy data if API data is not available
  const effectiveDepartmentUsers = departmentUsers?.length > 0 ? departmentUsers : dummyTeamMembers;
  const effectiveDepartment = department || dummyDepartment;
  const effectiveTaskAnalytics = taskAnalytics || dummyTaskAnalytics;
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMemberForTasks, setSelectedMemberForTasks] = useState<User | null>(null);
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [userTasksData, setUserTasksData] = useState<any>(null);
  const [isLoadingUserTasks, setIsLoadingUserTasks] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState(currentUser?.firstName || currentUser?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || currentUser?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Helpers
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  // Form state for adding/editing members
  const [memberForm, setMemberForm] = useState<{
    name: string;
    email: string;
    role: 'member' | 'manager';
    managerId: string;
    isActive: boolean;
  }>({
    name: '',
    email: '',
    role: 'member',
    managerId: '',
    isActive: true
  });

  // For backward compatibility with existing component logic
  const userDepartment = department;
  const departmentMembers = departmentUsers;
  const departmentHead = hodDepartmentHead;
  const departmentManagers = hodDepartmentManagers;
  const regularMembers = hodRegularMembers;

  // Task analytics is now provided by the hook

  // Helper functions for task management
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeRemaining = (dueDate: Date) => {
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  // Fetch user tasks when modal opens
  const fetchUserTasks = useCallback(async (userId: string) => {
    setIsLoadingUserTasks(true);
    try {
      const response = await hodService.getUserTasks(userId);
      if (response.success && response.data) {
        setUserTasksData(response.data);
      } else {
        console.warn('Failed to fetch user tasks:', response.error);
        setUserTasksData(null);
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setUserTasksData(null);
    } finally {
      setIsLoadingUserTasks(false);
    }
  }, []);

  // Handle opening task details dialog
  const handleOpenTaskDialog = useCallback((member: User) => {
    setSelectedMemberForTasks(member);
    setShowTaskDetailsDialog(true);
    fetchUserTasks(member.id);
  }, [fetchUserTasks]);
    
  // CRUD Functions for team management
  const handleAddMember = async () => {
    try {
      console.log('handleAddMember called', { memberForm, userDepartment });
      
      if (!userDepartment) {
        console.error('No department found');
        return;
      }
      
      if (!memberForm.name || !memberForm.email) {
        console.error('Missing required fields');
        return;
      }
      
      // Check if email already exists
      if (departmentUsers.some(u => u.email.toLowerCase() === memberForm.email.toLowerCase())) {
        console.error('Email already exists');
        return;
      }
      
      await addTeamMember({
        name: memberForm.name,
        email: memberForm.email,
        role: memberForm.role,
        managerId: memberForm.role === 'member' ? memberForm.managerId || undefined : undefined,
        isActive: memberForm.isActive,
      });
      
      // Reset form and close dialog
      setMemberForm({
        name: '',
        email: '',
        role: 'member',
        managerId: '',
        isActive: true
      });
      setShowAddMemberDialog(false);
      
      console.log('Member added successfully');
      
    } catch (error) {
      console.error('Error in handleAddMember:', error);
    }
  };
  
  const handleEditMember = (member: User) => {
    try {
      console.log('handleEditMember called', { member });
      
      // Don't allow editing department heads to maintain hierarchy
      if (member.role === 'department_head') {
        console.log('Cannot edit department head');
        return;
      }
      
      if (!member) {
        console.error('No member provided');
        return;
      }
      
      console.log('Setting up edit form for member:', member.name);
      
      setSelectedMember(member);
      setMemberForm({
        name: member.name || '',
        email: member.email || '',
        role: (member.role === 'manager' || member.role === 'member') ? member.role : 'member',
        managerId: member.managerId || '',
        isActive: member.isActive !== undefined ? member.isActive : true
      });
      setShowEditMemberDialog(true);
      
      console.log('Edit dialog should now be open');
      
    } catch (error) {
      console.error('Error in handleEditMember:', error);
    }
  };
  
  const handleUpdateMember = async () => {
    try {
      console.log('handleUpdateMember called', { selectedMember, memberForm });
      
      if (!selectedMember || !userDepartment) {
        console.error('Missing selected member or department');
        return;
      }
      
      if (!memberForm.name || !memberForm.email) {
        console.error('Missing required fields');
        return;
      }
      
      // Check if email already exists (excluding current member)
      if (departmentUsers.some(u => u.id !== selectedMember.id && u.email.toLowerCase() === memberForm.email.toLowerCase())) {
        console.error('Email already exists');
        return;
      }
      
      await updateTeamMember(selectedMember.id, {
              name: memberForm.name,
              email: memberForm.email,
              role: memberForm.role,
        managerId: memberForm.role === 'member' ? memberForm.managerId || undefined : undefined,
              isActive: memberForm.isActive
      });
      
      setSelectedMember(null);
      setShowEditMemberDialog(false);
      setMemberForm({
        name: '',
        email: '',
        role: 'member',
        managerId: '',
        isActive: true
      });
      
      console.log('Member updated successfully');
      
    } catch (error) {
      console.error('Error in handleUpdateMember:', error);
    }
  };
  
  const handleDeleteMember = async (memberId: string) => {
    try {
      console.log('handleDeleteMember called', { memberId });
      
      if (!memberId) {
        console.error('No member ID provided');
        return;
      }
      
      if (!userDepartment) {
        console.error('No department found');
        return;
      }
      
      const memberToDelete = departmentUsers.find(u => u.id === memberId);
      if (!memberToDelete) {
        console.error('Member not found');
        return;
      }
      
      // Prevent deletion of department head
      if (memberToDelete.role === 'department_head') {
        console.error('Cannot delete department head');
        return;
      }
      
      // Prevent HOD from deleting themselves
      if (memberId === currentUser?.id) {
        console.error('Cannot delete yourself');
        return;
      }
      
      console.log(`Deleting member: ${memberToDelete.name}`);
      
      await deleteTeamMember(memberId);
      
      console.log(`${memberToDelete.name} has been removed from the department successfully!`);
      
    } catch (error) {
      console.error('Error in handleDeleteMember:', error);
    }
  };

  // Department roles are now provided by the hook - cleaned up duplicate calculations

  // Filter members based on search and filters
  const filteredMembers = departmentMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.isActive) ||
                         (statusFilter === 'inactive' && !member.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'department_head':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'department_head':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get team members under each manager
  const getManagerTeam = (managerId: string) => {
    return effectiveDepartmentUsers.filter(u => u.managerId === managerId);
  };

  // Enhanced data calculations with team overview integration
  const departmentMembersList = effectiveDepartmentUsers.filter(u => u.role === 'member');
  const departmentManagersList = effectiveDepartmentUsers.filter(u => u.role === 'manager');
  const departmentHeadUser = effectiveDepartmentUsers.find(u => u.role === 'department_head');
  
  const totalMembers = departmentMembersList.length;
  const activeMembers = departmentMembersList.filter(m => (m as any).status === 'active').length;
  const managers = departmentManagersList.length;
  const members = departmentMembersList.length;

  // Use enhanced team overview data when available, fall back to local analytics
  const effectiveTeamAnalytics = teamOverview || taskAnalytics;
  const isLoadingAnalytics = isLoadingOverview || isLoadingTasks || isLoadingMembersWithTasks;
  
  // Function to refresh team members with tasks when filters change
  const refreshTeamMembersWithTasks = useCallback(() => {
    fetchTeamMembersWithTasks(searchTerm, roleFilter, statusFilter, timeRange);
  }, [fetchTeamMembersWithTasks, searchTerm, roleFilter, statusFilter, timeRange]);

  // Effect to refresh data when filters change
  useEffect(() => {
    refreshTeamMembersWithTasks();
  }, [refreshTeamMembersWithTasks]);

  // Enhanced Statistics with comprehensive team overview data
  const stats = [
    {
      title: 'Total Members',
      value: teamMembersWithTasks?.summary?.totalMembers || teamOverview?.teamStats?.totalMembers || totalMembers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      change: `${teamMembersWithTasks?.summary?.activeMembers || teamOverview?.teamStats?.activeMembers || activeMembers} active`
    },
    {
      title: 'Department Tasks',
      value: teamMembersWithTasks?.summary?.totalTasks || teamOverview?.taskStats?.totalTasks || taskAnalytics?.departmentSummary?.totalTasks || 0,
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      change: `${teamMembersWithTasks?.summary?.completedTasks || teamOverview?.taskStats?.inProgress || taskAnalytics?.departmentSummary?.activeTasks || 0} completed`
    },
    {
      title: 'Completion Rate',
      value: `${teamMembersWithTasks?.summary?.avgCompletionRate || teamOverview?.taskStats?.completionRate || taskAnalytics?.departmentSummary?.departmentCompletionRate || 0}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      change: `${teamMembersWithTasks?.summary?.avgProductivityScore || teamOverview?.taskStats?.completed || taskAnalytics?.departmentSummary?.completedTasks || 0} avg productivity`
    },
    {
      title: 'Overdue Tasks',
      value: teamOverview?.taskStats?.overdue || taskAnalytics?.departmentSummary?.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      change: (teamOverview?.taskStats?.overdue || taskAnalytics?.departmentSummary?.overdueTasks || 0) === 0 ? 'On track' : 'Needs attention'
    },
    {
      title: 'Avg Tasks/Member',
      value: teamOverview?.taskStats?.averageTasksPerMember || taskAnalytics?.departmentSummary?.avgTasksPerMember || 0,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      change: 'Distribution'
    },
    {
      title: 'High Performers',
      value: teamMembersWithTasks?.topPerformers?.length || teamOverview?.memberPerformance?.filter((m: any) => m.performanceScore >= 80).length || taskAnalytics?.topPerformers?.length || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      change: '80%+ performance'
    }
  ];

  // Add safety check to prevent render errors
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  // Check department access permissions
  // Debug logging for troubleshooting
  console.log('Current User:', currentUser);
  console.log('Department ID:', userDepartmentId);
  console.log('User Role:', currentUser.role);
  
  const departmentAccess = validateDepartmentAccess(currentUser, userDepartmentId);
  if (!departmentAccess.hasAccess && userDepartmentId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">🚫 Access Denied</div>
          <p className="text-muted-foreground">{departmentAccess.reason}</p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Debug Info:</p>
            <p>User ID: {currentUser.id}</p>
            <p>User Role: {currentUser.role}</p>
            <p>Department ID: {userDepartmentId || 'NOT SET'}</p>
            <p>User Name: {currentUser.name}</p>
            <p>User Email: {currentUser.email}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={refreshData} variant="outline">
              Retry Loading
            </Button>
            <Button 
              onClick={() => {
                // Clear localStorage and reload
                localStorage.clear();
                window.location.reload();
              }} 
              variant="secondary"
            >
              Reset Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading || (!department && !error)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading department information...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error && !department) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">⚠️ Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={refreshData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {(error || userError || taskError) && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-red-600">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || userError || taskError}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearErrors}
              className="text-red-600 hover:text-red-700"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Loading Overlay for Operations */}
      {isSubmitting && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {branding.shortName} - {userDepartment?.name} Department
          </h1>
          <p className="text-muted-foreground">
            Manage your department team and structure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: userDepartment?.color || '#3B82F6' }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Department Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Building2 className="h-5 w-5" />
            Department Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Department</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {userDepartment?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Description</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {userDepartment?.description}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Created</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {(() => {
                  try {
                    const d = typeof userDepartment?.createdAt === 'string' ? new Date(userDepartment.createdAt) : userDepartment?.createdAt;
                    return d ? d.toLocaleDateString() : 'Unknown';
                  } catch (e) {
                    return 'Unknown';
                  }
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className={`absolute inset-0 ${stat.bgColor} opacity-30`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Team & Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Advanced Team & Task Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {taskAnalytics?.userTaskMapping.length || 0} members tracked
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="department_head">Department Head</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hierarchy">Team Hierarchy</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              
              {/* Enhanced Team Overview Analytics */}
              {teamOverview && (
                <div className="space-y-6">

                  {/* Top Performers from Backend */}
                  {teamOverview.memberPerformance && teamOverview.memberPerformance.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Top Team Performers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teamOverview.memberPerformance
                            .sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0))
                            .slice(0, 6)
                            .map((performer: any, index: number) => (
                            <div key={performer.userId} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                  <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{performer.name || performer.email}</h4>
                                  <p className="text-sm text-muted-foreground">{performer.role}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{performer.performanceScore || 0}%</div>
                                  <div className="text-xs text-muted-foreground">
                                    {performer.tasksCompleted || 0} completed
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <Progress value={performer.performanceScore || 0} className="h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Team Hierarchy from Backend */}
                  {teamOverview.hierarchy && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Team Structure & Hierarchy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Department Head */}
                          {teamOverview.hierarchy.departmentHead && (
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-yellow-200 border">
                              <div className="flex items-center gap-3">
                                <Crown className="h-6 w-6 text-yellow-600" />
                                <div>
                                  <h4 className="font-semibold text-lg">{teamOverview.hierarchy.departmentHead.name}</h4>
                                  <p className="text-sm text-muted-foreground">Department Head</p>
                                  <p className="text-xs text-muted-foreground">{teamOverview.hierarchy.departmentHead.email}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Managers */}
                          {teamOverview.hierarchy.managers && teamOverview.hierarchy.managers.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Managers ({teamOverview.hierarchy.managers.length}):</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {teamOverview.hierarchy.managers.map((manager: any) => (
                                  <div key={manager.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-blue-600" />
                                      <div>
                                        <h6 className="font-medium">{manager.name}</h6>
                                        <p className="text-xs text-muted-foreground">{manager.email}</p>
                                        <p className="text-xs text-blue-600">Team: {manager.teamSize || 0} members</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Members */}
                          {teamOverview.hierarchy.members && teamOverview.hierarchy.members.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Team Members ({teamOverview.hierarchy.members.length}):</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {teamOverview.hierarchy.members.slice(0, 12).map((member: any) => (
                                  <div key={member.id} className="p-2 bg-gray-50 rounded text-center">
                                    <div className="text-sm font-medium">{member.name}</div>
                                    <div className="text-xs text-muted-foreground">{member.role}</div>
                                  </div>
                                ))}
                                {teamOverview.hierarchy.members.length > 12 && (
                                  <div className="p-2 bg-gray-100 rounded text-center">
                                    <div className="text-sm font-medium">+{teamOverview.hierarchy.members.length - 12} more</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Loading state for team overview */}
              {isLoadingOverview && (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground">Loading comprehensive team analytics...</p>
                    </div>
                  </CardContent>
                </Card>
              )}




              {/* Team Members with Task Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members with Task Analytics
                  {isLoadingAnalytics && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </h3>
                
                
                {(teamMembersWithTasks?.userTaskMapping || effectiveTeamAnalytics?.userTaskMapping || taskAnalytics?.userTaskMapping || [])
                  .filter(userTask => {
                    const member = userTask.member;
                    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
                    const matchesStatus = statusFilter === 'all' || 
                                         (statusFilter === 'active' && member.isActive) ||
                                         (statusFilter === 'inactive' && !member.isActive);
                    return matchesSearch && matchesRole && matchesStatus;
                  })
                  .map((userTask) => (
                    <Card key={userTask.member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {userTask.member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{userTask.member.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getRoleBadgeVariant(userTask.member.role)} className="text-xs">
                                  {getRoleIcon(userTask.member.role)}
                                  <span className="ml-1">{formatRole(userTask.member.role)}</span>
                                </Badge>
                                <Badge variant={userTask.member.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {userTask.member.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{userTask.member.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenTaskDialog(userTask.member)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Tasks
                            </Button>
                            {canManageDepartmentMember(currentUser, userTask.member, userDepartment?.id || '') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMember(userTask.member)}
                                disabled={isSubmitting}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            )}
                          </div>
                        </div>

                        {/* Task Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {userTask.tasks?.total || userTask.totalTasks || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {userTask.tasks?.inProgress || userTask.workload || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {userTask.tasks?.completed || userTask.completedTasks?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {userTask.tasks?.overdue || userTask.overdueTasks?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Overdue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {userTask.tasks?.urgent || userTask.urgentTasks?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Urgent</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Completion Rate</span>
                            <span className="font-medium">{userTask.tasks?.completionRate || userTask.completionRate || 0}%</span>
                          </div>
                          <Progress value={userTask.tasks?.completionRate || userTask.completionRate || 0} className="h-2" />
                        </div>

                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>



            <TabsContent value="performance" className="space-y-4">

              {/* Team Performance by Manager */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Team Performance by Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(effectiveTaskAnalytics as any).teamPerformance?.map((team: any) => (
                      <div key={team.managerId} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{team.teamName}</h4>
                            <p className="text-sm text-gray-600">Manager: {team.managerName}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={team.completionRate >= 95 ? "default" : team.completionRate >= 90 ? "secondary" : "outline"}>
                              {team.completionRate}% Complete
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Team Size</p>
                            <p className="text-lg font-semibold">{team.teamSize}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-lg font-semibold text-green-600">{team.tasksCompleted}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">In Progress</p>
                            <p className="text-lg font-semibold text-blue-600">{team.tasksInProgress}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Avg Rating</p>
                            <p className="text-lg font-semibold text-purple-600">{team.averageRating}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Progress value={team.completionRate} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(effectiveTaskAnalytics as any).topPerformers?.map((performer: any, index: number) => (
                      <div key={performer.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {performer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{performer.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {effectiveDepartmentUsers.find(u => u.id === performer.id)?.role ? 
                              formatRole(effectiveDepartmentUsers.find(u => u.id === performer.id)?.role || '') : 
                              'Team Member'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{performer.score}%</div>
                          <div className="text-xs text-muted-foreground">
                            {performer.tasksCompleted} tasks completed
                          </div>
                        </div>
                        <div className="w-24">
                          <Progress value={performer.score} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hierarchy" className="space-y-4">
              {/* Department Hierarchy */}
              <div className="space-y-6">
                {/* Department Head */}
                {departmentHead && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Department Head
                </h3>
                <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {departmentHead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{departmentHead.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" className="text-xs flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              {formatRole(departmentHead.role)}
                            </Badge>
                            <Badge variant={(departmentHead as any).status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {(departmentHead as any).status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{departmentHead.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Managers and Their Teams */}
            {departmentManagers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Managers & Their Teams ({departmentManagers.length})
                </h3>
                <div className="space-y-4">
                  {departmentManagers.map((manager) => {
                    const managerTeam = getManagerTeam(manager.id);
                    return (
                      <Card key={manager.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                          {/* Manager Info */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>
                                  {manager.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{manager.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Manager
                                  </Badge>
                                  <Badge variant={manager.isActive ? 'default' : 'secondary'} className="text-xs">
                                    {manager.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{manager.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {managerTeam.length} team members
                              </Badge>
                              <div className="flex items-center gap-1">
                                                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    console.log('Edit manager button clicked for:', manager.name);
                                    handleEditMember(manager as User);
                                  } catch (error) {
                                    console.error('Error in edit manager button:', error);
                                  }
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {manager.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      console.log('Delete manager button clicked for:', manager.name);
                                      if (window.confirm(`Are you sure you want to remove ${manager.name} from the department?`)) {
                                        handleDeleteMember(manager.id);
                                      }
                                    } catch (error) {
                                      console.error('Error in delete manager button:', error);
                                    }
                                  }}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              </div>
                            </div>
                          </div>

                          {/* Manager's Team Members */}
                          {managerTeam.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Team Members:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {managerTeam.map((teamMember) => (
                                  <div key={teamMember.id} className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {teamMember.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{teamMember.name}</p>
                                      <p className="text-xs text-muted-foreground">{formatRole(teamMember.role)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {(teamMember as any).isActive ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          try {
                                            console.log('Edit team member button clicked for:', teamMember.name);
                                            handleEditMember(teamMember as User);
                                          } catch (error) {
                                            console.error('Error in edit team member button:', error);
                                          }
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-2 w-2" />
                                      </Button>
                                      {teamMember.id !== currentUser?.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            try {
                                              console.log('Delete team member button clicked for:', teamMember.name);
                                              if (window.confirm(`Are you sure you want to remove ${teamMember.name} from the department?`)) {
                                                handleDeleteMember(teamMember.id);
                                              }
                                            } catch (error) {
                                              console.error('Error in delete team member button:', error);
                                            }
                                          }}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Department Members */}
            {regularMembers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  Other Members ({regularMembers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{member.name}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs flex items-center gap-1">
                                  {getRoleIcon(member.role)}
                                  {formatRole(member.role)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {member.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {formatDate(member.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs">
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  console.log('Edit member button clicked for:', member.name);
                                  handleEditMember(member);
                                } catch (error) {
                                  console.error('Error in edit member button:', error);
                                }
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {member.id !== currentUser?.id && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    console.log('Delete member button clicked for:', member.name);
                                    if (window.confirm(`Are you sure you want to remove ${member.name} from the department?`)) {
                                      handleDeleteMember(member.id);
                                    }
                                  } catch (error) {
                                    console.error('Error in delete member button:', error);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
              </div>
            </TabsContent>
          </Tabs>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters' 
                  : 'Your department has no members assigned'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetailsDialog} onOpenChange={setShowTaskDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Task Details - {selectedMemberForTasks?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMemberForTasks && taskAnalytics && (
            <div className="space-y-6">
              {/* Member Info Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">
                        {selectedMemberForTasks.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedMemberForTasks.name}</h3>
                      <p className="text-muted-foreground">{selectedMemberForTasks.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getRoleBadgeVariant(selectedMemberForTasks.role)}>
                          {formatRole(selectedMemberForTasks.role)}
                        </Badge>
                        <Badge variant={selectedMemberForTasks.isActive ? 'default' : 'secondary'}>
                          {selectedMemberForTasks.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    {(() => {
                      const memberTaskData = taskAnalytics.userTaskMapping.find(
                        ut => ut.member.id === selectedMemberForTasks.id
                      );
                      return memberTaskData && (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{memberTaskData.totalTasks}</div>
                            <div className="text-xs text-muted-foreground">Total Tasks</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{memberTaskData.completionRate}%</div>
                            <div className="text-xs text-muted-foreground">Completion Rate</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Tasks List */}
              {isLoadingUserTasks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </div>
                </div>
              ) : userTasksData ? (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="active">Active ({userTasksData.tasks.active.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({userTasksData.tasks.completed.length})</TabsTrigger>
                    <TabsTrigger value="blocked">Blocked ({userTasksData.tasks.blocked.length})</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue ({userTasksData.tasks.overdue.length})</TabsTrigger>
                    <TabsTrigger value="all">All Tasks ({userTasksData.tasks.all.length})</TabsTrigger>
                  </TabsList>
                    
                    <TabsContent value="active" className="space-y-4">
                      {userTasksData.tasks.active.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{task.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                                <Badge className={`text-xs ${getTaskStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                    {formatTimeRemaining(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(task.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {userTasksData.tasks.active.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">All tasks completed!</h3>
                          <p className="text-muted-foreground">This member has no active tasks.</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="space-y-4">
                      {userTasksData.tasks.completed.map((task) => (
                        <Card key={task.id} className="opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{task.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getTaskStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={`${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div>Completed: {new Date(task.updatedAt).toLocaleDateString()}</div>
                              <div>Due date: {new Date(task.dueDate).toLocaleDateString()}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {userTasksData.tasks.completed.length === 0 && (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No completed tasks</h3>
                          <p className="text-muted-foreground">This member hasn't completed any tasks yet.</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="all" className="space-y-4">
                      {userTasksData.tasks.all.map((task) => (
                        <Card key={task.id} className={task.status === 'completed' ? 'opacity-75' : 'hover:shadow-md transition-shadow'}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{task.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                                <Badge className={`text-xs ${getTaskStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                                {task.status !== 'completed' && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                      {formatTimeRemaining(task.dueDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {task.status === 'completed' ? 'Completed' : 'Created'}: {new Date(task.status === 'completed' ? task.updatedAt : task.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {userTasksData.tasks.all.length === 0 && (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No tasks assigned</h3>
                          <p className="text-muted-foreground">This member has no tasks assigned yet.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="blocked" className="space-y-4">
                      {userTasksData.tasks.blocked.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow border-red-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <Badge className={`text-xs ${getTaskStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={`${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    Assigned by: {typeof task.assignedBy === 'object' && task.assignedBy ? (task.assignedBy as any).name : (task.assignedBy ?? 'Unknown')}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-muted-foreground mt-2">
                                  Blocked since: {new Date(task.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {userTasksData.tasks.blocked.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No blocked tasks</h3>
                          <p className="text-muted-foreground">This member has no blocked tasks.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="overdue" className="space-y-4">
                      {userTasksData.tasks.overdue.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow border-orange-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <Badge className={`text-xs ${getTaskStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={`${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    Assigned by: {typeof task.assignedBy === 'object' && task.assignedBy ? (task.assignedBy as any).name : (task.assignedBy ?? 'Unknown')}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-red-600 mt-2">
                                  Overdue by: {Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {userTasksData.tasks.overdue.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No overdue tasks</h3>
                          <p className="text-muted-foreground">This member has no overdue tasks.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p>No task data available</p>
                    </div>
                  </div>
                )}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTaskDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={(open) => {
        console.log('Add Member Dialog state changed:', open);
        setShowAddMemberDialog(open);
        if (!open) {
          // Reset form when dialog closes
          setMemberForm({
            name: '',
            email: '',
            role: 'member',
            managerId: '',
            isActive: true
          });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New {memberForm.role === 'manager' ? 'Manager' : 'Team Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={memberForm.role} onValueChange={(value: any) => setMemberForm({ ...memberForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {memberForm.role === 'member' && (
              <div>
                <Label htmlFor="manager">Assign to Manager (Optional)</Label>
                <Select value={memberForm.managerId} onValueChange={(value) => setMemberForm({ ...memberForm, managerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager</SelectItem>
                    {departmentManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={memberForm.isActive}
                onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active Status</Label>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    console.log('Submit button clicked');
                    handleAddMember();
                  } catch (error) {
                    console.error('Error in submit handler:', error);
                  }
                }} 
                disabled={!memberForm.name || !memberForm.email || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add {memberForm.role === 'manager' ? 'Manager' : 'Member'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditMemberDialog} onOpenChange={(open) => {
        console.log('Edit Member Dialog state changed:', open);
        setShowEditMemberDialog(open);
        if (!open) {
          // Reset form and selected member when dialog closes
          setSelectedMember(null);
          setMemberForm({
            name: '',
            email: '',
            role: 'member',
            managerId: '',
            isActive: true
          });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Team Member {selectedMember ? `- ${selectedMember.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={memberForm.role} onValueChange={(value: any) => setMemberForm({ ...memberForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {memberForm.role === 'member' && (
              <div>
                <Label htmlFor="edit-manager">Assign to Manager (Optional)</Label>
                <Select value={memberForm.managerId} onValueChange={(value) => setMemberForm({ ...memberForm, managerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager</SelectItem>
                    {departmentManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={memberForm.isActive}
                onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-isActive">Active Status</Label>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditMemberDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    console.log('Update button clicked');
                    handleUpdateMember();
                  } catch (error) {
                    console.error('Error in update handler:', error);
                  }
                }} 
                disabled={!memberForm.name || !memberForm.email || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                <Settings className="w-4 h-4 mr-2" />
                Update Member
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
