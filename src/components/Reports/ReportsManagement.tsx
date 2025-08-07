import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, FileText, Calendar as CalendarIcon, Filter, 
  BarChart3, Users, ClipboardList, CalendarDays, Building2, 
  TrendingUp, FileSpreadsheet, FileImage
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockLeaveRequests } from '@/data/leaveData';
import { toast } from '@/hooks/use-toast';

export default function ReportsManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly');
  const [reportCategory, setReportCategory] = useState<string>('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportCategories = [
    { id: 'overview', label: 'Overview Report', icon: BarChart3, description: 'Complete company overview with all metrics' },
    { id: 'tasks', label: 'Tasks Report', icon: ClipboardList, description: 'Detailed task analysis and performance' },
    { id: 'users', label: 'Users Report', icon: Users, description: 'Employee performance and statistics' },
    { id: 'departments', label: 'Departments Report', icon: Building2, description: 'Department-wise analysis' },
    { id: 'leave', label: 'Leave Report', icon: CalendarDays, description: 'Leave requests and balance analysis' },
  ];

  const quickDateOptions = [
    { label: 'This Week', value: 'thisWeek', type: 'weekly' as const },
    { label: 'Last Week', value: 'lastWeek', type: 'weekly' as const },
    { label: 'This Month', value: 'thisMonth', type: 'monthly' as const },
    { label: 'Last Month', value: 'lastMonth', type: 'monthly' as const },
    { label: 'Last 3 Months', value: 'last3Months', type: 'monthly' as const },
  ];

  const getDateRange = (option: string) => {
    const now = new Date();
    switch (option) {
      case 'thisWeek':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'lastWeek':
        return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: now, end: now };
    }
  };

  const generateReportData = () => {
    const range = reportType === 'weekly' 
      ? { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) }
      : { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

    // Tasks data
    const tasksData = {
      total: mockTasks.length,
      completed: mockTasks.filter(t => t.status === 'completed').length,
      inProgress: mockTasks.filter(t => t.status === 'in_progress').length,
      assigned: mockTasks.filter(t => t.status === 'assigned').length,
      blocked: mockTasks.filter(t => t.status === 'blocked').length,
      byPriority: {
        urgent: mockTasks.filter(t => t.priority === 'urgent').length,
        high: mockTasks.filter(t => t.priority === 'high').length,
        medium: mockTasks.filter(t => t.priority === 'medium').length,
        low: mockTasks.filter(t => t.priority === 'low').length,
      }
    };

    // Departments data
    const departmentsData = mockDepartments.map(dept => {
      const deptTasks = mockTasks.filter(t => t.departmentId === dept.id);
      const completedTasks = deptTasks.filter(t => t.status === 'completed').length;
      return {
        name: dept.name,
        totalTasks: deptTasks.length,
        completedTasks,
        completionRate: deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0,
        members: dept.memberCount
      };
    });

    // Users data
    const usersData = mockUsers.map(user => {
      const userTasks = mockTasks.filter(t => t.assignedTo === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      return {
        name: user.name,
        email: user.email,
        department: mockDepartments.find(d => d.id === user.departmentId)?.name || 'No Department',
        totalTasks: userTasks.length,
        completedTasks,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
      };
    });

    // Leave data
    const leaveData = {
      total: mockLeaveRequests.length,
      approved: mockLeaveRequests.filter(l => l.status === 'approved').length,
      pending: mockLeaveRequests.filter(l => l.status === 'pending').length,
      rejected: mockLeaveRequests.filter(l => l.status === 'rejected').length,
      byType: {
        annual: mockLeaveRequests.filter(l => l.leaveType === 'annual').length,
        sick: mockLeaveRequests.filter(l => l.leaveType === 'sick').length,
        compensatory: mockLeaveRequests.filter(l => l.leaveType === 'compensatory').length,
        emergency: mockLeaveRequests.filter(l => l.leaveType === 'emergency').length,
      }
    };

    return {
      period: `${format(range.start, 'MMM dd, yyyy')} - ${format(range.end, 'MMM dd, yyyy')}`,
      reportType: reportType,
      category: reportCategory,
      generatedAt: new Date().toISOString(),
      tasks: tasksData,
      departments: departmentsData,
      users: usersData,
      leave: leaveData
    };
  };

  const downloadReport = async (fileFormat: 'json' | 'csv' | 'pdf') => {
    setIsGenerating(true);
    try {
      const reportData = generateReportData();
      const fileName = `${reportCategory}_report_${reportType}_${format(selectedDate, 'yyyy-MM-dd')}.${fileFormat}`;

      if (fileFormat === 'json') {
        // Download as JSON
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (fileFormat === 'csv') {
        // Download as CSV
        let csvContent = '';
        
        if (reportCategory === 'overview' || reportCategory === 'tasks') {
          csvContent += 'Task Status,Count\n';
          csvContent += `Completed,${reportData.tasks.completed}\n`;
          csvContent += `In Progress,${reportData.tasks.inProgress}\n`;
          csvContent += `Assigned,${reportData.tasks.assigned}\n`;
          csvContent += `Blocked,${reportData.tasks.blocked}\n\n`;
          
          csvContent += 'Priority,Count\n';
          csvContent += `Urgent,${reportData.tasks.byPriority.urgent}\n`;
          csvContent += `High,${reportData.tasks.byPriority.high}\n`;
          csvContent += `Medium,${reportData.tasks.byPriority.medium}\n`;
          csvContent += `Low,${reportData.tasks.byPriority.low}\n`;
        }

        if (reportCategory === 'overview' || reportCategory === 'departments') {
          csvContent += '\nDepartment,Total Tasks,Completed Tasks,Completion Rate,Members\n';
          reportData.departments.forEach(dept => {
            csvContent += `${dept.name},${dept.totalTasks},${dept.completedTasks},${dept.completionRate}%,${dept.members}\n`;
          });
        }

        if (reportCategory === 'overview' || reportCategory === 'users') {
          csvContent += '\nUser Name,Email,Department,Total Tasks,Completed Tasks,Completion Rate\n';
          reportData.users.forEach(user => {
            csvContent += `${user.name},${user.email},${user.department},${user.totalTasks},${user.completedTasks},${user.completionRate}%\n`;
          });
        }

        if (reportCategory === 'overview' || reportCategory === 'leave') {
          csvContent += '\nLeave Status,Count\n';
          csvContent += `Approved,${reportData.leave.approved}\n`;
          csvContent += `Pending,${reportData.leave.pending}\n`;
          csvContent += `Rejected,${reportData.leave.rejected}\n\n`;
          
          csvContent += 'Leave Type,Count\n';
          csvContent += `Annual,${reportData.leave.byType.annual}\n`;
          csvContent += `Sick,${reportData.leave.byType.sick}\n`;
          csvContent += `Compensatory,${reportData.leave.byType.compensatory}\n`;
          csvContent += `Emergency,${reportData.leave.byType.emergency}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (fileFormat === 'pdf') {
        // For PDF, we'll create a simplified HTML version that can be printed as PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${reportCategory === 'overview' ? 'NevoStack Overview' : reportCategory.toUpperCase()} Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .table { border-collapse: collapse; width: 100%; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f2f2f2; }
              .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportCategory === 'overview' ? 'NevoStack Overview' : reportCategory.toUpperCase()} Report</h1>
              <p>Period: ${reportData.period}</p>
              <p>Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            
            ${reportCategory === 'overview' || reportCategory === 'tasks' ? `
            <div class="section">
              <h2>Task Overview</h2>
              <div class="metric">Total Tasks: ${reportData.tasks.total}</div>
              <div class="metric">Completed: ${reportData.tasks.completed}</div>
              <div class="metric">In Progress: ${reportData.tasks.inProgress}</div>
              <div class="metric">Blocked: ${reportData.tasks.blocked}</div>
            </div>
            ` : ''}
            
            ${reportCategory === 'overview' || reportCategory === 'departments' ? `
            <div class="section">
              <h2>Department Performance</h2>
              <table class="table">
                <tr><th>Department</th><th>Total Tasks</th><th>Completed</th><th>Completion Rate</th><th>Members</th></tr>
                ${reportData.departments.map(dept => 
                  `<tr><td>${dept.name}</td><td>${dept.totalTasks}</td><td>${dept.completedTasks}</td><td>${dept.completionRate}%</td><td>${dept.members}</td></tr>`
                ).join('')}
              </table>
            </div>
            ` : ''}
            
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.pdf', '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Generated",
          description: "HTML file downloaded. Use your browser's print function to save as PDF.",
        });
      }

      toast({
        title: "Report Downloaded",
        description: `${reportCategory} report has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const quickDateSelect = (option: string) => {
    const dateOption = quickDateOptions.find(opt => opt.value === option);
    if (dateOption) {
      const range = getDateRange(option);
      setSelectedDate(range.start);
      setReportType(dateOption.type);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-muted-foreground">Generate and download comprehensive company reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Date Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Date Selection</label>
                <div className="flex flex-wrap gap-2">
                  {quickDateOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => quickDateSelect(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={reportType} onValueChange={(value: 'weekly' | 'monthly') => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Report Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">Report Category</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-colors",
                          reportCategory === category.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setReportCategory(category.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{category.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => downloadReport('json')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download JSON
                </Button>
                <Button
                  onClick={() => downloadReport('csv')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button
                  onClick={() => downloadReport('pdf')}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <FileImage className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Report Type:</p>
                  <Badge variant="outline">{reportType}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Category:</p>
                  <Badge>{reportCategory}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Period:</p>
                  <p className="text-sm text-muted-foreground">
                    {reportType === 'weekly' 
                      ? `${format(startOfWeek(selectedDate), 'MMM dd')} - ${format(endOfWeek(selectedDate), 'MMM dd, yyyy')}`
                      : `${format(startOfMonth(selectedDate), 'MMM dd')} - ${format(endOfMonth(selectedDate), 'MMM dd, yyyy')}`
                    }
                  </p>
                </div>
                
                {/* Quick Stats Preview */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Quick Stats:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Tasks:</span>
                      <Badge variant="outline">{mockTasks.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <Badge variant="default">{mockTasks.filter(t => t.status === 'completed').length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <Badge variant="outline">{mockUsers.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Departments:</span>
                      <Badge variant="outline">{mockDepartments.length}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}