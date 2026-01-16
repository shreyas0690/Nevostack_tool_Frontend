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
import { Skeleton } from '@/components/ui/skeleton';
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
  Settings,
  ClipboardList,
  ChevronDown,
  ChevronUp,
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
import { useHODManagement } from '@/hooks/useHODManagement';
import type { User, Task } from '@/types/company';
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
  const { toast } = useToast();

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

  // State for hierarchy expansion
  const [expandedManagers, setExpandedManagers] = useState<Record<string, boolean>>({});

  const toggleManagerExpansion = (managerId: string) => {
    setExpandedManagers(prev => ({
      ...prev,
      [managerId]: !prev[managerId]
    }));
  };

  // Initialize all managers as expanded when data loads
  useEffect(() => {
    if (teamOverview?.hierarchy?.managers) {
      const initialState: Record<string, boolean> = {};
      teamOverview.hierarchy.managers.forEach((m: any) => {
        initialState[m.id] = true;
      });
      setExpandedManagers(prev => ({ ...initialState, ...prev }));
    }
  }, [teamOverview]);

  // State for user tasks
  const [isLoadingUserTasks, setIsLoadingUserTasks] = useState(false);

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

  // FIXED: Only use real API data from useHODManagement hook, no fallback to dummy data
  const effectiveDepartmentUsers = departmentUsers || []; // No dummy fallback
  const effectiveDepartment = department; // No dummy fallback
  const effectiveTaskAnalytics = taskAnalytics; // No dummy fallback

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const OverviewTabSkeleton = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
                <Skeleton className="mt-3 h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border border-slate-200/70 dark:border-slate-800/70">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((__, statIndex) => (
                    <div key={statIndex} className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 p-2">
                      <Skeleton className="h-5 w-10 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Filter and paginate users
  const allFilteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return (teamMembersWithTasks?.userTaskMapping || taskAnalytics?.userTaskMapping || [])
      .filter(userTask => {
        const member = userTask?.member;
        if (!member) return false;
        if (member.role === 'department_head') return false;

        const memberName = member.name || member.email || '';
        const memberEmail = member.email || '';
        const matchesSearch = memberName.toLowerCase().includes(normalizedSearch) ||
          memberEmail.toLowerCase().includes(normalizedSearch);
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;

        const hasStatus = typeof member.isActive === 'boolean' || typeof (member as any)?.status === 'string';
        const memberIsActive = typeof member.isActive === 'boolean'
          ? member.isActive
          : (member as any)?.status === 'active';
        const matchesStatus = statusFilter === 'all' ||
          (statusFilter === 'active' && memberIsActive) ||
          (statusFilter === 'inactive' && hasStatus && !memberIsActive);

        return matchesSearch && matchesRole && matchesStatus;
      });
  }, [teamMembersWithTasks, taskAnalytics, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(allFilteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = allFilteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 if search/filter changes results
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

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

      if (member.id !== currentUser?.id) {
        toast({
          title: 'Access denied',
          description: 'You can only update your own profile.',
        });
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

      if (selectedMember.id !== currentUser?.id) {
        toast({
          title: 'Access denied',
          description: 'You can only update your own profile.',
        });
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

  // Exclude department head from summary stats calculations.
  const nonHeadUsers = effectiveDepartmentUsers.filter(u => u.role !== 'department_head');
  const nonHeadTaskMapping = (teamMembersWithTasks?.userTaskMapping || taskAnalytics?.userTaskMapping || [])
    .filter((userTask: any) => userTask?.member?.role !== 'department_head');

  const nonHeadTaskTotals = nonHeadTaskMapping.reduce((acc: any, userTask: any) => {
    const tasks = userTask?.tasks || {};
    const totalTasks = Number(tasks.total ?? userTask.totalTasks ?? 0) || 0;
    const completedRaw = tasks.completed ?? (Array.isArray(userTask.completedTasks)
      ? userTask.completedTasks.length
      : userTask.completedTasks ?? 0);
    const completedTasks = Number(completedRaw) || 0;
    const inProgressTasks = Number(tasks.inProgress ?? 0) || 0;
    const assignedTasks = Number(tasks.assigned ?? 0) || 0;
    const overdueTasks = Number(tasks.overdue ?? tasks.overdueTasks ?? userTask.overdueTasks ?? 0) || 0;
    const completionRate = Number(tasks.completionRate ?? userTask.completionRate ?? 0) || 0;
    const productivityScore = Number(
      userTask.productivityScore ?? userTask.performanceScore ?? userTask.score ?? completionRate ?? 0
    ) || 0;

    acc.totalTasks += totalTasks;
    acc.completedTasks += completedTasks;
    acc.inProgressTasks += inProgressTasks;
    acc.assignedTasks += assignedTasks;
    acc.overdueTasks += overdueTasks;
    acc.completionRateSum += completionRate;
    acc.productivitySum += productivityScore;
    if (completionRate >= 80) {
      acc.highPerformers += 1;
    }
    return acc;
  }, {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    assignedTasks: 0,
    overdueTasks: 0,
    completionRateSum: 0,
    productivitySum: 0,
    highPerformers: 0
  });

  const nonHeadMembersCount = nonHeadTaskMapping.length || nonHeadUsers.length;
  const nonHeadActiveMembers = nonHeadUsers.filter((m) => {
    if (typeof (m as any).isActive === 'boolean') {
      return (m as any).isActive;
    }
    if (typeof (m as any).status === 'string') {
      return (m as any).status === 'active';
    }
    return false;
  }).length;
  const nonHeadCompletionRate = nonHeadTaskTotals.totalTasks > 0
    ? Math.round((nonHeadTaskTotals.completedTasks / nonHeadTaskTotals.totalTasks) * 100)
    : 0;
  const nonHeadAvgTasksPerMember = nonHeadMembersCount > 0
    ? Math.round((nonHeadTaskTotals.totalTasks / nonHeadMembersCount) * 10) / 10
    : 0;
  const nonHeadAvgProductivity = nonHeadMembersCount > 0
    ? Math.round(((nonHeadTaskTotals.productivitySum || nonHeadTaskTotals.completionRateSum) / nonHeadMembersCount) * 10) / 10
    : 0;

  const totalMembers = nonHeadMembersCount;
  const activeMembers = nonHeadActiveMembers;
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
      value: totalMembers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      change: `${activeMembers} active`
    },
    {
      title: 'Department Tasks',
      value: nonHeadTaskTotals.totalTasks,
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
      change: `${nonHeadTaskTotals.completedTasks} completed`
    },
    {
      title: 'Completion Rate',
      value: `${nonHeadCompletionRate}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      change: `${nonHeadAvgProductivity} avg productivity`
    },
    {
      title: 'Overdue Tasks',
      value: nonHeadTaskTotals.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      change: nonHeadTaskTotals.overdueTasks === 0 ? 'On track' : 'Needs attention'
    },
    {
      title: 'Avg Tasks/Member',
      value: nonHeadAvgTasksPerMember,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      change: 'Distribution'
    },
    {
      title: 'High Performers',
      value: nonHeadTaskTotals.highPerformers,
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
            {userDepartment?.name || 'Department'} Department
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
      <Card className="border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-slate-950 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              Department Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Department</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {userDepartment?.name}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {userDepartment?.description}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Created</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="group relative overflow-hidden border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm transition-all hover:shadow-md">
              <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${stat.bgColor} opacity-30`} />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                    <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</div>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team & Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team & Task Management
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hierarchy">Team Hierarchy</TabsTrigger>
              <TabsTrigger value="management">Team Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isLoadingAnalytics ? (
                <OverviewTabSkeleton />
              ) : (
                <>
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
                    </div>
                  )}

                  {/* Team Members with Task Overview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members with Task Analytics ({allFilteredUsers.length})
                      {isLoadingAnalytics && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </h3>

                    {paginatedUsers.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {paginatedUsers.map((userTask) => {
                          const member = userTask.member;
                          const memberName = member?.name || member?.email || 'Unknown';
                          const memberEmail = member?.email || 'N/A';
                          const memberIsActive = typeof member?.isActive === 'boolean'
                            ? member.isActive
                            : (member as any)?.status === 'active';
                          const memberInitials = memberName.split(' ').map((n: string) => n[0]).join('') || 'U';
                          const completionRate = userTask.tasks?.completionRate || userTask.completionRate || 0;
                          const totalTasks = userTask.tasks?.total || userTask.totalTasks || 0;
                          const completedTasks = userTask.tasks?.completed || userTask.completedTasks?.length || 0;
                          const pendingTasks = (userTask.tasks?.inProgress || userTask.workload || 0) +
                            (userTask.tasks?.assigned || 0);

                          return (
                            <Card key={member?.id || memberEmail} className="transition-all duration-200 hover:shadow-lg border-2">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                                      {memberInitials}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="text-lg font-semibold">{memberName}</h3>
                                      <Badge
                                        variant={memberIsActive ? "default" : "secondary"}
                                        className={memberIsActive
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }
                                      >
                                        {memberIsActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                      {completionRate >= 80 && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                          <Trophy className="w-3 h-3 mr-1" />
                                          Top Performer
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {memberEmail}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Role: {formatRole(member?.role || '')}
                                      </div>
                                      {member?.createdAt && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          Joined: {new Date(member.createdAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Task Statistics */}
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">{totalTasks}</div>
                                        <div className="text-xs text-blue-700 dark:text-blue-300">Total Tasks</div>
                                      </div>
                                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                                        <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
                                      </div>
                                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                        <div className="text-lg font-bold text-orange-600">{pendingTasks}</div>
                                        <div className="text-xs text-orange-700 dark:text-orange-300">Pending</div>
                                      </div>
                                      <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">{completionRate}%</div>
                                        <div className="text-xs text-purple-700 dark:text-purple-300">Success Rate</div>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {totalTasks > 0 && (
                                      <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                          <span>Task Completion Progress</span>
                                          <span>{completionRate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full transition-all duration-500 ${completionRate >= 80 ? 'bg-green-500' :
                                              completionRate >= 60 ? 'bg-blue-500' :
                                                completionRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                              }`}
                                            style={{ width: `${completionRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-6 pt-4 border-t">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenTaskDialog(userTask.member)}
                                  >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    View Tasks
                                  </Button>
                                  {canManageDepartmentMember(currentUser, userTask.member, userDepartment?.id || '') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditMember(userTask.member)}
                                      disabled={isSubmitting}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, allFilteredUsers.length)} of {allFilteredUsers.length} members
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="hierarchy" className="space-y-6">
              {/* Team Hierarchy from Backend */}
              {(() => {
                // Normalize hierarchy data
                const rawHierarchy = teamOverview?.hierarchy || teamOverview?.teamHierarchy;

                if (!rawHierarchy) {
                  if (isLoadingOverview) {
                    return (
                      <Card>
                        <CardContent className="p-8 flex justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading hierarchy...</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return (
                    <div className="text-center p-8 text-muted-foreground">
                      No hierarchy data available.
                    </div>
                  );
                }

                // Ensure we have a members array, flattening from managers if needed
                // We keep the original structure for the new visualization, but also calculate total members for stats if needed

                const hierarchy = {
                  ...rawHierarchy
                };

                return (
                  <Card className="overflow-hidden border-none shadow-md bg-slate-50/50 dark:bg-slate-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5 text-primary" />
                        Team Structure & Hierarchy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 pb-8">
                      <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8">

                        {/* Level 1: Department Head */}
                        {hierarchy.departmentHead && (
                          <div className="relative flex flex-col items-center z-20">
                            <div className="bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/30 border-2 border-amber-200 dark:border-amber-700/50 rounded-xl p-4 w-80 shadow-xl flex items-center gap-4 transform hover:scale-105 transition-transform duration-300">
                              <div className="relative">
                                <Avatar className="w-16 h-16 border-4 border-white dark:border-amber-900 shadow-md">
                                  <AvatarFallback className="bg-amber-600 text-white text-xl font-bold">
                                    {hierarchy.departmentHead.name?.split(' ').map((n: string) => n[0]).join('') || 'DH'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-sm">
                                  <Crown className="h-3 w-3" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{hierarchy.departmentHead.name}</h4>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Department Head</p>
                                <p className="text-xs text-muted-foreground truncate">{hierarchy.departmentHead.email}</p>
                              </div>
                            </div>

                            {/* Main Vertical Connector Line */}
                            {(hierarchy.managers?.length > 0) && (
                              <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-700 absolute -bottom-8 left-1/2 transform -translate-x-1/2"></div>
                            )}
                          </div>
                        )}

                        {/* Level 2: Managers & Their Teams (Vertical Tree) */}
                        {hierarchy.managers && hierarchy.managers.length > 0 && (
                          <div className="relative w-full max-w-3xl">
                            {/* Central Vertical Line connecting HOD to Managers */}
                            <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

                            <div className="flex flex-col gap-6">
                              {hierarchy.managers.map((manager: any, index: number) => (
                                <div key={manager.id} className="relative pl-0 md:pl-20">
                                  {/* Horizontal Connector from Main Line to Manager Card */}
                                  <div className="absolute top-8 left-8 w-12 h-0.5 bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

                                  {/* Manager Card */}
                                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                                    <div
                                      className="p-4 flex items-center justify-between cursor-pointer bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      onClick={() => toggleManagerExpansion(manager.id)}
                                    >
                                      <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12 border-2 border-blue-100 dark:border-blue-900">
                                          <AvatarFallback className="bg-blue-600 text-white font-medium">
                                            {manager.name?.split(' ').map((n: string) => n[0]).join('') || 'M'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h6 className="font-bold text-base text-gray-900 dark:text-gray-100">{manager.name}</h6>
                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                              MANAGER
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground">{manager.email}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="text-xs font-medium text-muted-foreground bg-white dark:bg-slate-900 px-2 py-1 rounded border">
                                          {manager.teamMembers?.length || 0} Reports
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          {expandedManagers[manager.id] ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Collapsible Team Section */}
                                    {expandedManagers[manager.id] && manager.teamMembers && manager.teamMembers.length > 0 && (
                                      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {manager.teamMembers.map((member: any) => (
                                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-md bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                              <div className="relative">
                                                <Avatar className="w-8 h-8 border border-gray-100 dark:border-gray-700">
                                                  <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                                                    {member.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-800 ${member.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate" title={member.name}>{member.name}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
                                                <div className="text-[10px] text-muted-foreground truncate opacity-80">{member.email}</div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Orphaned Members (if any, not under a manager) */}
                        {hierarchy.members && hierarchy.members.length > 0 && !hierarchy.managers?.some((m: any) => m.teamMembers?.length > 0) && (
                          <div className="relative w-full pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
                            <h4 className="text-center mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Direct Reports</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {hierarchy.members.map((member: any) => (
                                <div key={member.id} className="relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 flex flex-col items-center text-center hover:border-primary/50 transition-colors group">
                                  <div className="relative">
                                    <Avatar className="w-10 h-10 border border-gray-100 dark:border-gray-700 mb-2 group-hover:scale-110 transition-transform">
                                      <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                                        {member.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${member.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  </div>
                                  <div className="font-medium text-xs truncate w-full" title={member.name}>{member.name}</div>
                                  <div className="text-[10px] text-muted-foreground truncate w-full">{member.role}</div>
                                  <div className="text-[10px] text-muted-foreground truncate w-full opacity-80">{member.email}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>
            <TabsContent value="management" className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950/80 p-6 shadow-sm">
                <div className="pointer-events-none absolute -top-20 -right-24 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="relative space-y-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Management</h3>
                      <p className="text-xs text-muted-foreground">Managers and their team members</p>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      Managers: {departmentManagers.length}
                    </Badge>
                  </div>

                  {departmentManagers.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Managers & Teams
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {departmentManagers.map((manager) => {
                          const managerTeam = getManagerTeam(manager.id);
                          const activeTeamCount = managerTeam.filter((member: any) => {
                            if (typeof member.isActive === 'boolean') return member.isActive;
                            if (typeof (member as any).status === 'string') return (member as any).status === 'active';
                            return false;
                          }).length;

                          return (
                            <Card className="group relative overflow-hidden border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 shadow-sm transition-all hover:shadow-lg" key={manager.id}>
                              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400" />
                              <div className="p-4 pt-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-11 h-11 ring-2 ring-blue-100 dark:ring-blue-900/40">
                                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                        {manager.name?.split(' ').map(n => n[0]).join('') || 'M'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{manager.name}</h4>
                                        <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                                          <Shield className="h-3 w-3" />
                                          Manager
                                        </Badge>
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <span className={`h-1.5 w-1.5 rounded-full ${manager.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                          {manager.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{manager.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 text-[10px] text-muted-foreground">
                                      <span className="font-semibold text-slate-700 dark:text-slate-200">{activeTeamCount}</span> Active
                                      <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                                      <span className="font-semibold text-slate-700 dark:text-slate-200">{managerTeam.length}</span> Total
                                    </div>
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
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <CardContent className="p-4 pt-0">
                                {managerTeam.length > 0 ? (
                                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Members</h5>
                                      <Badge variant="outline" className="text-[10px]">{managerTeam.length} members</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {managerTeam.map((teamMember) => {
                                        const isMemberActive = typeof teamMember.isActive === 'boolean'
                                          ? teamMember.isActive
                                          : (teamMember as any).status === 'active';

                                        return (
                                          <div key={teamMember.id} className="group flex items-center gap-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/40 p-2.5 shadow-sm transition-all hover:shadow">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                {teamMember.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium truncate">{teamMember.name}</p>
                                              <p className="text-[10px] text-muted-foreground truncate">{formatRole(teamMember.role)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className={`h-2 w-2 rounded-full ${isMemberActive ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                                                className="h-6 w-6 p-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                              >
                                                <Edit className="h-2 w-2" />
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-slate-200/70 dark:border-slate-800/70 p-3 text-xs text-muted-foreground">
                                    No team members assigned.
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 p-6 text-center text-sm text-muted-foreground">
                    No managers found in this department.
                  </div>
                )}

                </div>
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

                  <TabsContent value="active" className="space-y-3">
                    {userTasksData.tasks.active.map((task) => (
                      <Card key={task.id} className="group hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{task.title}</h4>
                                  {task.priority === 'urgent' && (
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Urgent Priority" />
                                  )}
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-gray-200 text-gray-500 font-normal">
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                              </div>
                              <Badge className={`shrink-0 ${getTaskStatusColor(task.status)} border-0 px-2.5 py-0.5 text-xs font-medium capitalize shadow-sm`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>

                          <div className="bg-gray-50/50 dark:bg-gray-900/50 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5" title="Due Date">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              {task.assignedBy && (
                                <div className="flex items-center gap-1.5" title={`Assigned by ${task.assignedBy.name}`}>
                                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{task.assignedBy.name}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {formatTimeRemaining(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {userTasksData.tasks.active.length === 0 && (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <div className="bg-green-100 dark:bg-green-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">All Caught Up!</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">This member has no active tasks at the moment. Great job!</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-3">
                    {userTasksData.tasks.completed.map((task) => (
                      <Card key={task.id} className="group opacity-75 hover:opacity-100 transition-all bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-medium text-gray-500 dark:text-gray-400 text-base line-through decoration-gray-400">{task.title}</h4>
                                  <Badge variant="outline" className="h-4 text-[10px] px-1.5 border-green-200 text-green-700 bg-green-50">Completed</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                              </div>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 shadow-sm">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-100/50 dark:bg-gray-800/50 px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Completed: {new Date(task.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 text-[10px] uppercase tracking-wide">
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {userTasksData.tasks.completed.length === 0 && (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">No Completed Tasks</h3>
                        <p className="text-sm text-muted-foreground">This member hasn't completed any tasks yet.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="space-y-3">
                    {userTasksData.tasks.all.map((task) => (
                      <Card key={task.id} className={`group hover:shadow-md transition-all ${task.status === 'completed' ? 'opacity-75 bg-gray-50/50 dark:bg-gray-900/20' : 'border border-gray-100 dark:border-gray-800'} overflow-hidden`}>
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className={`font-semibold text-base ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</h4>
                                  {task.priority === 'urgent' && task.status !== 'completed' && (
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Urgent Priority" />
                                  )}
                                  {task.status !== 'completed' && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-gray-200 text-gray-500 font-normal">
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                              </div>
                              <Badge className={`shrink-0 ${getTaskStatusColor(task.status)} border-0 px-2.5 py-0.5 text-xs font-medium capitalize shadow-sm`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>

                          <div className={`px-4 py-2.5 border-t flex items-center justify-between text-xs text-muted-foreground ${task.status === 'completed' ? 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'}`}>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{task.status === 'completed' ? 'Done: ' : 'Due: '}{new Date(task.status === 'completed' ? task.updatedAt : task.dueDate).toLocaleDateString()}</span>
                              </div>
                              {task.status !== 'completed' && task.assignedBy && (
                                <div className="flex items-center gap-1.5" title={`Assigned by ${task.assignedBy.name}`}>
                                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{task.assignedBy.name}</span>
                                </div>
                              )}
                            </div>

                            {task.status !== 'completed' && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className={new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                  {formatTimeRemaining(task.dueDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {userTasksData.tasks.all.length === 0 && (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">No tasks assigned</h3>
                        <p className="text-sm text-muted-foreground">This member has no tasks assigned yet.</p>
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
                </Tabs >
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <p>No task data available</p>
                  </div>
                </div>
              )
              }
            </div >
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTaskDetailsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent >
      </Dialog >

      {/* Add Member Dialog */}
      < Dialog open={showAddMemberDialog} onOpenChange={(open) => {
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
                <Select
                  value={memberForm.managerId || 'none'}
                  onValueChange={(value) => setMemberForm({ ...memberForm, managerId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
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
      </Dialog >

      {/* Edit Member Dialog */}
      < Dialog open={showEditMemberDialog} onOpenChange={(open) => {
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
      </Dialog >
    </div >
  );
}
