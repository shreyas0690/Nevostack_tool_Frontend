import { apiService } from './apiService';
import { companyService } from './companyService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Types for reports
export interface ReportRequest {
  reportType: 'weekly' | 'monthly';
  reportCategory: 'overview' | 'tasks' | 'departments' | 'users' | 'leave';
  startDate?: string;
  endDate?: string;
  companyId?: string;
}

export interface TasksReport {
  total: number;
  byStatus: {
    completed: number;
    inProgress: number;
    assigned: number;
    blocked: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  topPerformers: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  period?: string;
  reportType?: string;
}

export interface DepartmentsReport {
  departments: Array<{
    name: string;
    description: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    members: number;
    activeMembers: number;
    completionRate: number;
    productivity: number;
  }>;
  summary: {
    totalDepartments: number;
    totalMembers: number;
    totalTasks: number;
    totalCompleted: number;
    averageCompletionRate: number;
  };
  period?: string;
  reportType?: string;
}

export interface UsersReport {
  users: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    department: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    lastLogin?: string;
  }>;
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    totalCompleted: number;
    averageCompletionRate: number;
    usersWithTasks: number;
  };
  period?: string;
  reportType?: string;
}

export interface LeaveReport {
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
    totalDays: number;
  };
  byType: {
    annual: number;
    sick: number;
    compensatory: number;
    emergency: number;
  };
  byMonth: Array<{
    date: string;
    count: number;
    totalDays: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    department: string;
    totalLeaveDays: number;
    leaveRequests: number;
  }>;
  recentRequests: Array<{
    id: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    createdAt: string;
    employee?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  period?: string;
  reportType?: string;
}

export interface OverviewReport {
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    assigned: number;
    blocked: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  departments: Array<{
    name: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    members: number;
  }>;
  users: Array<{
    name: string;
    email: string;
    department: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  leave: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
    byType: {
      annual: number;
      sick: number;
      compensatory: number;
      emergency: number;
    };
  };
  period?: string;
  reportType?: string;
}

export interface ReportResponse {
  period: string;
  reportType: string;
  category: string;
  generatedAt: string;
  generatedBy: string;
  companyId?: string;
  company?: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
  };
  tasks?: any;
  departments?: any;
  users?: any;
  leave?: any;
}

class ReportsService {
  // Backend routes are mounted under /api/reports
  private baseEndpoint = '/api/reports';

  /**
   * Generate a report based on the provided parameters
   */
  async generateReport(request: ReportRequest): Promise<any> {
    try {
      console.log('🔄 Making API call to backend:', request);

      const response = await apiService.post<any>(
        `${this.baseEndpoint}/generate`,
        request
      );

      console.log('📥 Raw API response:', response);

      // Handle backend response structure
      if (response && response.success === false) {
        throw new Error(response.error || 'Failed to generate report');
      }

      // Backend returns { success: true, data: reportData }
      if (response && response.success && response.data) {
        console.log('✅ Backend returned success with data:', response.data);
        return response.data;
      }

      // If response doesn't have expected structure, return it as-is
      console.log('⚠️ Backend returned unexpected structure, returning as-is:', response);
      return response;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  }

  /**
   * Generate overview report
   */
  async generateOverviewReport(
    reportType: 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
    companyId?: string
  ): Promise<OverviewReport> {
    const response = await this.generateReport({
      reportType,
      reportCategory: 'overview',
      startDate,
      endDate,
      companyId
    });

    // Backend returns data directly
    const reportData = response;

    return {
      tasks: reportData.tasks,
      departments: reportData.departments,
      users: reportData.users,
      leave: {
        ...reportData.leave,
        cancelled: reportData.leave?.cancelled || 0
      },
      period: reportData.period,
      reportType: reportData.reportType
    } as OverviewReport;
  }

  /**
   * Generate tasks report
   */
  async generateTasksReport(
    reportType: 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
    companyId?: string
  ): Promise<TasksReport> {
    console.log('📋 Generating tasks report with params:', { reportType, startDate, endDate, companyId });

    const response = await this.generateReport({
      reportType,
      reportCategory: 'tasks',
      startDate,
      endDate,
      companyId
    });

    console.log('📋 Tasks report raw response:', response);

    // Backend returns data directly
    const reportData = response;
    console.log('📋 Tasks report data extracted:', reportData);

    // Backend returns flat structure directly
    const tasksData = {
      ...reportData,
      period: reportData.period,
      reportType: reportData.reportType
    };
    console.log('📋 Tasks data final:', tasksData);

    return tasksData as TasksReport;
  }

  /**
   * Generate departments report
   */
  async generateDepartmentsReport(
    reportType: 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
    companyId?: string
  ): Promise<DepartmentsReport> {
    console.log('🏢 Generating departments report with params:', { reportType, startDate, endDate, companyId });

    const response = await this.generateReport({
      reportType,
      reportCategory: 'departments',
      startDate,
      endDate,
      companyId
    });

    console.log('🏢 Departments report raw response:', response);

    // Backend returns data directly
    const reportData = response;
    console.log('🏢 Departments report data extracted:', reportData);

    // Backend returns {departments: [...], summary: {...}}
    // Return the complete structure
    return {
      ...reportData,
      period: reportData.period,
      reportType: reportData.reportType
    } as DepartmentsReport;
  }

  /**
   * Generate users report
   */
  async generateUsersReport(
    reportType: 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
    companyId?: string
  ): Promise<UsersReport> {
    console.log('👥 Generating users report with params:', { reportType, startDate, endDate, companyId });

    const response = await this.generateReport({
      reportType,
      reportCategory: 'users',
      startDate,
      endDate,
      companyId
    });

    console.log('👥 Users report raw response:', response);

    // Backend returns data directly
    const reportData = response;
    console.log('👥 Users report data extracted:', reportData);

    // Backend returns {users: [...], summary: {...}}
    // Return the complete structure
    return {
      ...reportData,
      period: reportData.period,
      reportType: reportData.reportType
    } as UsersReport;
  }

  /**
   * Generate leave report
   */
  async generateLeaveReport(
    reportType: 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string,
    companyId?: string
  ): Promise<LeaveReport> {
    console.log('📅 Generating leave report with params:', { reportType, startDate, endDate, companyId });

    const response = await this.generateReport({
      reportType,
      reportCategory: 'leave',
      startDate,
      endDate,
      companyId
    });

    console.log('📅 Leave report raw response:', response);

    // Backend returns data directly
    const reportData = response;
    console.log('📅 Leave report data extracted:', reportData);

    // Backend returns flat structure directly
    const leaveData = {
      ...reportData,
      period: reportData.period,
      reportType: reportData.reportType
    };
    console.log('📅 Leave data final:', leaveData);

    return leaveData as LeaveReport;
  }

  /**
   * Download report as file
   */
  async downloadReport(
    request: ReportRequest,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<void> {
    try {
      // Generate the report data based on category
      let reportData;
      console.log('📥 Starting download for category:', request.reportCategory);

      switch (request.reportCategory) {
        case 'overview':
          console.log('📊 Downloading overview report');
          reportData = await this.generateOverviewReport(request.reportType, request.startDate, request.endDate, request.companyId);
          break;
        case 'tasks':
          console.log('📋 Downloading tasks report');
          const tasksResponse = await this.generateReport({
            reportType: request.reportType,
            reportCategory: 'tasks',
            startDate: request.startDate,
            endDate: request.endDate,
            companyId: request.companyId
          });
          const tasksReportData = tasksResponse;
          console.log('📋 Tasks download data:', tasksReportData);
          // Tasks report returns flat structure directly
          reportData = tasksReportData;
          console.log('📋 Tasks final download data:', reportData);
          break;
        case 'departments':
          console.log('🏢 Downloading departments report');
          const deptsResponse = await this.generateReport({
            reportType: request.reportType,
            reportCategory: 'departments',
            startDate: request.startDate,
            endDate: request.endDate,
            companyId: request.companyId
          });
          const deptsReportData = deptsResponse;
          console.log('🏢 Departments download data:', deptsReportData);
          // Departments report returns {departments: [...], summary: {...}}
          // For download, we want the full structure with both departments and summary
          reportData = deptsReportData;
          console.log('🏢 Departments final download data:', reportData);
          break;
        case 'users':
          console.log('👥 Downloading users report');
          const usersResponse = await this.generateReport({
            reportType: request.reportType,
            reportCategory: 'users',
            startDate: request.startDate,
            endDate: request.endDate,
            companyId: request.companyId
          });
          const usersReportData = usersResponse;
          console.log('👥 Users download data:', usersReportData);
          // Users report returns {users: [...], summary: {...}}
          // For download, we want the full structure with both users and summary
          reportData = usersReportData;
          console.log('👥 Users final download data:', reportData);
          break;
        case 'leave':
          console.log('📅 Downloading leave report');
          const leaveResponse = await this.generateReport({
            reportType: request.reportType,
            reportCategory: 'leave',
            startDate: request.startDate,
            endDate: request.endDate,
            companyId: request.companyId
          });
          const leaveReportData = leaveResponse;
          console.log('📅 Leave download data:', leaveReportData);
          // Leave report returns flat structure directly
          reportData = leaveReportData;
          console.log('📅 Leave final download data:', reportData);
          break;
        default:
          console.log('📊 Downloading default overview report');
          reportData = await this.generateOverviewReport(request.reportType, request.startDate, request.endDate, request.companyId);
      }

      // Create filename
      const fileName = `${request.reportCategory}_report_${request.reportType}_${new Date().toISOString().split('T')[0]}.${format}`;

      if (format === 'json') {
        // Download as JSON
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: 'application/json'
        });
        this.downloadBlob(blob, fileName);
      } else if (format === 'csv') {
        // Fetch company information for CSV header
        let companyInfo = null;
        try {
          if (request.companyId) {
            console.log('🏢 Fetching company information for CSV:', request.companyId);
            const companyResponse = await companyService.getCompanyById(request.companyId);
            companyInfo = companyResponse.data;
            console.log('✅ Company info loaded for CSV:', companyInfo?.name);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch company info for CSV, using defaults:', error);
        }

        // Add company info to report data
        const enrichedReportData = {
          ...reportData,
          company: companyInfo || {
            name: 'Company Name',
            address: 'Company Address',
            phone: 'Company Phone',
            email: 'Company Email'
          }
        };

        console.log('📄 Generating CSV with company info:', enrichedReportData.company);

        // Generate CSV content based on report category
        const csvContent = this.generateCSVContent(enrichedReportData, request.reportCategory);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, fileName);
      } else if (format === 'pdf') {
        // Fetch company information for PDF header
        let companyInfo = null;
        try {
          if (request.companyId) {
            console.log('🏢 Fetching company information for PDF:', request.companyId);
            const companyResponse = await companyService.getCompanyById(request.companyId);
            companyInfo = companyResponse.data;
            console.log('✅ Company info loaded for PDF:', companyInfo?.name);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch company info for PDF, using defaults:', error);
        }

        // Add company info to report data
        const enrichedReportData = {
          ...reportData,
          company: companyInfo || {
            name: 'Company Name',
            address: 'Company Address',
            phone: 'Company Phone',
            email: 'Company Email'
          }
        };

        console.log('📄 Generating PDF with company info:', enrichedReportData.company);

        // Generate simple, reliable PDF using jsPDF
        await this.generateSimplePDF(enrichedReportData, request.reportCategory, fileName);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  private generateCSVContent(reportData: any, category: string): string {
    let csvContent = '';

    // Add company header information
    const companyName = String(reportData.company?.name || 'Company Name');
    const companyAddress = reportData.company?.address;
    let formattedAddress = '';

    if (companyAddress) {
      if (typeof companyAddress === 'string') {
        formattedAddress = String(companyAddress);
      } else if (companyAddress && typeof companyAddress === 'object') {
        const addressParts = [];
        if (companyAddress.street) addressParts.push(String(companyAddress.street));
        if (companyAddress.city) addressParts.push(String(companyAddress.city));
        if (companyAddress.state) addressParts.push(String(companyAddress.state));
        if (companyAddress.zipCode) addressParts.push(String(companyAddress.zipCode));
        if (companyAddress.country) addressParts.push(String(companyAddress.country));
        formattedAddress = addressParts.join(', ');
      }
    }

    const companyPhone = String(reportData.company?.phone || 'Company Phone');
    const companyEmail = String(reportData.company?.email || 'Company Email');

    csvContent += `${companyName}\n`;
    if (formattedAddress) csvContent += `${formattedAddress}\n`;
    csvContent += `Phone: ${companyPhone}\n`;
    csvContent += `Email: ${companyEmail}\n\n`;

    // Add report metadata
    const periodText = reportData.period || 'N/A';
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const reportTypeText = reportData.reportType || 'N/A';

    csvContent += `Report Type,${category.charAt(0).toUpperCase() + category.slice(1)} Report\n`;
    csvContent += `Period,${periodText}\n`;
    csvContent += `Generated,${generatedDate}\n`;
    csvContent += `Report Format,${reportTypeText}\n\n`;

    switch (category) {
      case 'overview':
        // Tasks data
        csvContent += 'Task Status,Count\n';
        csvContent += `Completed,${String(reportData.tasks?.completed || 0)}\n`;
        csvContent += `In Progress,${String(reportData.tasks?.inProgress || 0)}\n`;
        csvContent += `Assigned,${String(reportData.tasks?.assigned || 0)}\n`;
        csvContent += `Blocked,${String(reportData.tasks?.blocked || 0)}\n\n`;

        // Departments data
        csvContent += 'Department,Total Tasks,Completed Tasks,Completion Rate,Members\n';
        if (reportData.departments) {
          reportData.departments.forEach((dept: any) => {
            csvContent += `${String(dept.name)},${String(dept.totalTasks)},${String(dept.completedTasks)},${String(dept.completionRate)}%,${String(dept.members)}\n`;
          });
        }
        csvContent += '\n';

        // Users data
        csvContent += 'User Name,Email,Department,Total Tasks,Completed Tasks,Completion Rate\n';
        if (reportData.users) {
          reportData.users.forEach((user: any) => {
            csvContent += `${String(user.name)},${String(user.email)},${String(user.department)},${String(user.totalTasks)},${String(user.completedTasks)},${String(user.completionRate)}%\n`;
          });
        }
        csvContent += '\n';

        // Leave data
        csvContent += 'Leave Status,Count\n';
        csvContent += `Approved,${String(reportData.leave?.approved || 0)}\n`;
        csvContent += `Pending,${String(reportData.leave?.pending || 0)}\n`;
        csvContent += `Rejected,${String(reportData.leave?.rejected || 0)}\n\n`;

        csvContent += 'Leave Type,Count\n';
        csvContent += `Annual,${String(reportData.leave?.byType?.annual || 0)}\n`;
        csvContent += `Sick,${String(reportData.leave?.byType?.sick || 0)}\n`;
        csvContent += `Compensatory,${String(reportData.leave?.byType?.compensatory || 0)}\n`;
        csvContent += `Emergency,${String(reportData.leave?.byType?.emergency || 0)}\n`;
        break;

      case 'tasks':
        csvContent += 'Task Status,Count\n';
        csvContent += `Total,${String(reportData.total || 0)}\n`;
        csvContent += `Completed,${String(reportData.byStatus?.completed || 0)}\n`;
        csvContent += `In Progress,${String(reportData.byStatus?.inProgress || 0)}\n`;
        csvContent += `Assigned,${String(reportData.byStatus?.assigned || 0)}\n`;
        csvContent += `Blocked,${String(reportData.byStatus?.blocked || 0)}\n\n`;

        csvContent += 'Priority,Count\n';
        csvContent += `Urgent,${String(reportData.byPriority?.urgent || 0)}\n`;
        csvContent += `High,${String(reportData.byPriority?.high || 0)}\n`;
        csvContent += `Medium,${String(reportData.byPriority?.medium || 0)}\n`;
        csvContent += `Low,${String(reportData.byPriority?.low || 0)}\n\n`;

        csvContent += 'Top Performers,Name,Email,Total Tasks,Completed Tasks,Completion Rate\n';
        if (reportData.topPerformers) {
          reportData.topPerformers.forEach((user: any, index: number) => {
            csvContent += `${index + 1},${String(user.userName)},${String(user.userEmail)},${String(user.totalTasks)},${String(user.completedTasks)},${String(user.completionRate)}%\n`;
          });
        }
        break;

      case 'departments':
        // Add summary first
        csvContent += 'Summary\n';
        csvContent += `Total Departments,${String(reportData.summary?.totalDepartments || 0)}\n`;
        csvContent += `Total Members,${String(reportData.summary?.totalMembers || 0)}\n`;
        csvContent += `Total Tasks,${String(reportData.summary?.totalTasks || 0)}\n`;
        csvContent += `Total Completed,${String(reportData.summary?.totalCompleted || 0)}\n`;
        csvContent += `Average Completion Rate,${String(reportData.summary?.averageCompletionRate?.toFixed(1) || 0)}%\n\n`;

        csvContent += 'Department Details,Name,Total Tasks,Completed Tasks,In Progress,Pending,Members,Active Members,Completion Rate,Productivity\n';
        if (reportData.departments) {
          reportData.departments.forEach((dept: any) => {
            csvContent += `${String(dept.name)},${String(dept.name)},${String(dept.totalTasks)},${String(dept.completedTasks)},${String(dept.inProgressTasks || 0)},${String(dept.pendingTasks || 0)},${String(dept.members)},${String(dept.activeMembers || 0)},${String(dept.completionRate)}%,${String(dept.productivity?.toFixed(1) || 0)}%\n`;
          });
        }
        break;

      case 'users':
        // Add summary first
        csvContent += 'Summary\n';
        csvContent += `Total Users,${String(reportData.summary?.totalUsers || 0)}\n`;
        csvContent += `Active Users,${String(reportData.summary?.activeUsers || 0)}\n`;
        csvContent += `Users with Tasks,${String(reportData.summary?.usersWithTasks || 0)}\n`;
        csvContent += `Total Tasks,${String(reportData.summary?.totalTasks || 0)}\n`;
        csvContent += `Total Completed,${String(reportData.summary?.totalCompleted || 0)}\n`;
        csvContent += `Average Completion Rate,${String(reportData.summary?.averageCompletionRate?.toFixed(1) || 0)}%\n\n`;

        csvContent += 'User Details,Name,Email,Department,Role,Total Tasks,Completed Tasks,In Progress,Overdue,Completion Rate,Status\n';
        if (reportData.users) {
          reportData.users.forEach((user: any) => {
            csvContent += `${String(user.name)},${String(user.name)},${String(user.email)},${String(user.department)},${String(user.role)},${String(user.totalTasks)},${String(user.completedTasks)},${String(user.inProgressTasks || 0)},${String(user.overdueTasks || 0)},${String(user.completionRate)}%,${user.isActive ? 'Active' : 'Inactive'}\n`;
          });
        }
        break;

      case 'leave':
        // Add summary first
        csvContent += 'Summary\n';
        csvContent += `Total Requests,${String(reportData.summary?.total || 0)}\n`;
        csvContent += `Approved,${String(reportData.summary?.approved || 0)}\n`;
        csvContent += `Pending,${String(reportData.summary?.pending || 0)}\n`;
        csvContent += `Rejected,${String(reportData.summary?.rejected || 0)}\n`;
        csvContent += `Cancelled,${String(reportData.summary?.cancelled || 0)}\n`;
        csvContent += `Total Days,${String(reportData.summary?.totalDays || 0)}\n\n`;

        csvContent += 'Leave Types,Annual,Sick,Compensatory,Emergency\n';
        csvContent += `Count,${String(reportData.byType?.annual || 0)},${String(reportData.byType?.sick || 0)},${String(reportData.byType?.compensatory || 0)},${String(reportData.byType?.emergency || 0)}\n\n`;

        csvContent += 'Recent Requests,Employee,Email,Type,Status,Start Date,End Date,Days,Reason\n';
        if (reportData.recentRequests) {
          reportData.recentRequests.forEach((leave: any) => {
            csvContent += `${String(leave.employee?.name || 'N/A')},${String(leave.employee?.name || 'N/A')},${String(leave.employee?.email || 'N/A')},${String(leave.type)},${String(leave.status)},${String(leave.startDate)},${String(leave.endDate)},${String(leave.days)},${String(leave.reason || '')}\n`;
          });
        }
        break;
    }

    return csvContent;
  }



  private async generateSimplePDF(reportData: any, category: string, fileName: string): Promise<void> {
    console.log('🎨 Starting professional PDF generation...', { category, fileName });

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // ========== ENTERPRISE HEADER ==========
      const companyName = String(reportData.company?.name || 'Acme Corporation');

      // Company Name - Centered, Large, Professional
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(17, 24, 39); // Almost black for authority
      pdf.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Elegant separator line under company name
      pdf.setDrawColor(203, 213, 225); // Light gray
      pdf.setLineWidth(0.5);
      pdf.line(40, yPosition, pageWidth - 40, yPosition);
      yPosition += 10;

      // Company contact info - Professional spacing
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); // Muted gray

      const companyAddress = this.formatAddress(reportData.company?.address);
      const companyPhone = String(reportData.company?.phone || '+919734338742');
      const companyEmail = String(reportData.company?.email || 'contact@acme.com');

      if (companyAddress) {
        pdf.text(companyAddress, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }
      pdf.text(`${companyPhone}  •  ${companyEmail}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 18;

      // ========== REPORT TITLE SECTION ==========
      // Professional box with subtle shadow effect
      const boxY = yPosition;
      const boxHeight = 35;

      // Shadow layer
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(21, boxY + 1, pageWidth - 42, boxHeight, 3, 3, 'F');

      // Main box with gradient simulation
      pdf.setFillColor(241, 245, 249); // Very light blue-gray
      pdf.roundedRect(20, boxY, pageWidth - 40, boxHeight, 3, 3, 'F');

      // Border
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(20, boxY, pageWidth - 40, boxHeight, 3, 3, 'S');

      // Report Title - Bold and prominent
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // Dark blue-gray
      const title = `${category.charAt(0).toUpperCase()}${category.slice(1)} Report`;
      pdf.text(title, pageWidth / 2, boxY + 12, { align: 'center' });

      // Report metadata - Clean, icon-style presentation
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);

      const periodText = reportData.period || 'N/A';
      const generatedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const reportTypeText = (reportData.reportType || 'Monthly').charAt(0).toUpperCase() +
        (reportData.reportType || 'Monthly').slice(1);

      // Three columns for metadata - Centered
      const centerX = pageWidth / 2;
      const spacing = 60; // Space between items

      // Period (Left of center)
      pdf.setFont('helvetica', 'bold');
      pdf.text('PERIOD', centerX - spacing, boxY + 22, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(periodText, centerX - spacing, boxY + 28, { align: 'center' });

      // Generated Date (Center)
      pdf.setFont('helvetica', 'bold');
      pdf.text('GENERATED', centerX, boxY + 22, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(generatedDate, centerX, boxY + 28, { align: 'center' });

      // Report Type (Right of center)
      pdf.setFont('helvetica', 'bold');
      pdf.text('TYPE', centerX + spacing, boxY + 22, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportTypeText, centerX + spacing, boxY + 28, { align: 'center' });

      yPosition += boxHeight + 20;

      // ========== CONTENT SECTIONS ==========
      switch (category) {
        case 'overview':
          this.addProfessionalOverviewContent(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'tasks':
          this.addProfessionalTasksContent(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'departments':
          this.addProfessionalDepartmentsContent(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'users':
          this.addProfessionalUsersContent(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'leave':
          this.addProfessionalLeaveContent(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
      }



      pdf.save(fileName);
      console.log('✅ Professional PDF saved successfully!');

    } catch (error) {
      console.error('❌ Error generating professional PDF:', error);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }


  // ========== HELPER METHODS FOR PROFESSIONAL PDF DESIGN ==========

  private formatAddress(address: any): string {
    if (!address) return '';

    if (typeof address === 'string') {
      return String(address);
    }

    if (address && typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(String(address.street));
      if (address.city) parts.push(String(address.city));
      if (address.state) parts.push(String(address.state));
      if (address.zipCode) parts.push(String(address.zipCode));
      if (address.country) parts.push(String(address.country));
      return parts.join(', ');
    }

    return '';
  }

  private drawGradientBox(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    startColor: number[],
    endColor: number[]
  ): void {
    // Simulate gradient with multiple rectangles
    const steps = 20;
    const stepHeight = height / steps;

    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);

      pdf.setFillColor(r, g, b);
      pdf.rect(x, y + (i * stepHeight), width, stepHeight, 'F');
    }

    // Add subtle wave decoration at bottom
    pdf.setDrawColor(96, 165, 250);
    pdf.setLineWidth(0.3);
    const waveY = y + height;
    for (let i = 0; i < width; i += 2) {
      const waveHeight = Math.sin(i / 5) * 1.5;
      pdf.line(x + i, waveY + waveHeight, x + i + 1, waveY + Math.sin((i + 1) / 5) * 1.5);
    }
  }

  private drawDonutChart(
    pdf: jsPDF,
    centerX: number,
    centerY: number,
    radius: number,
    innerRadius: number,
    data: { value: number; color: number[]; label: string }[]
  ): void {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    let currentAngle = -90; // Start from top

    data.forEach(item => {
      const sliceAngle = (item.value / total) * 360;
      if (sliceAngle > 0) {
        this.drawDonutSlice(pdf, centerX, centerY, radius, innerRadius, currentAngle, sliceAngle, item.color);
        currentAngle += sliceAngle;
      }
    });

    // Center circle for donut hole
    pdf.setFillColor(255, 255, 255);
    pdf.circle(centerX, centerY, innerRadius, 'F');

    // Total in center
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Total Tasks:', centerX, centerY - 2, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text(String(total), centerX, centerY + 4, { align: 'center' });
  }

  private drawDonutSlice(
    pdf: jsPDF,
    centerX: number,
    centerY: number,
    radius: number,
    innerRadius: number,
    startAngle: number,
    angle: number,
    color: number[]
  ): void {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.setDrawColor(color[0], color[1], color[2]);

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    // Draw donut slice using multiple thin wedges for smooth appearance
    const segments = Math.max(10, Math.ceil(angle / 3));

    for (let i = 0; i < segments; i++) {
      const angle1 = startRad + (endRad - startRad) * (i / segments);
      const angle2 = startRad + (endRad - startRad) * ((i + 1) / segments);

      // Calculate 4 points of the wedge (2 on outer circle, 2 on inner circle)
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      const x3 = centerX + innerRadius * Math.cos(angle2);
      const y3 = centerY + innerRadius * Math.sin(angle2);
      const x4 = centerX + innerRadius * Math.cos(angle1);
      const y4 = centerY + innerRadius * Math.sin(angle1);

      // Draw filled quadrilateral (wedge segment)
      pdf.triangle(x1, y1, x2, y2, x3, y3, 'F');
      pdf.triangle(x1, y1, x3, y3, x4, y4, 'F');
    }
  }

  private drawProgressBar(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    percentage: number,
    color: number[],
    label: string
  ): void {
    // Background bar
    pdf.setFillColor(243, 244, 246); // Gray-100
    pdf.roundedRect(x, y, width, height, 2, 2, 'F');

    // Progress bar
    const progressWidth = (width * percentage) / 100;
    if (progressWidth > 0) {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.roundedRect(x, y, progressWidth, height, 2, 2, 'F');
    }

    // Label on left
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(55, 65, 81); // Gray-700
    pdf.text(label, x - 2, y + height / 2 + 1, { align: 'right' });

    // Percentage on right
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text(`${percentage}%`, x + width + 3, y + height / 2 + 1);
  }

  private drawSummaryCard(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    icon: string,
    value: number,
    label: string,
    color: number[]
  ): void {
    // Card background
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setLineWidth(0.5);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, height, 2, 2, 'FD');

    let textYOffset = 0;

    // Only draw icon if provided
    if (icon) {
      // Icon circle
      const iconSize = 8;
      pdf.setFillColor(color[0], color[1], color[2], 0.2);
      pdf.circle(x + width / 2, y + 10, iconSize / 2, 'F');

      // Icon (using text as icon substitute)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(icon, x + width / 2, y + 12, { align: 'center' });
    } else {
      // Adjust text position if no icon
      textYOffset = -5;
    }

    // Value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text(String(value), x + width / 2, y + 24 + textYOffset, { align: 'center' });

    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text(label, x + width / 2, y + 30 + textYOffset, { align: 'center' });
  }



  // ========== PROFESSIONAL CONTENT RENDERING METHODS ==========

  private addProfessionalOverviewContent(
    pdf: jsPDF,
    reportData: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    let yPosition = startY;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    // ========== TASK OVERVIEW SECTION ==========
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55); // Gray-800
    pdf.text('Task Overview', leftMargin, yPosition);
    yPosition += 10;

    const taskData = reportData.tasks || {};
    const total = taskData.total || 0;
    const completed = taskData.completed || 0;
    const inProgress = taskData.inProgress || 0;
    const assigned = taskData.assigned || 0;
    const blocked = taskData.blocked || 0;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgressRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const assignedRate = total > 0 ? Math.round((assigned / total) * 100) : 0;

    // LEFT SIDE: Bullet list with colored indicators (like in reference image)
    const leftColumnX = leftMargin;
    let leftY = yPosition;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Total Tasks
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.circle(leftColumnX + 2, leftY + 2, 1.5, 'F');
    pdf.setTextColor(55, 65, 81); // Gray-700
    pdf.text(`Total Tasks: ${total}`, leftColumnX + 6, leftY + 3);
    leftY += 6;

    // Completed
    pdf.setFillColor(16, 185, 129); // Green
    pdf.circle(leftColumnX + 2, leftY + 2, 1.5, 'F');
    pdf.text(`Completed: ${completed} (${completionRate}%)`, leftColumnX + 6, leftY + 3);
    leftY += 6;

    // In Progress (with percentage)
    pdf.setFillColor(251, 191, 36); // Yellow
    pdf.circle(leftColumnX + 2, leftY + 2, 1.5, 'F');
    pdf.text(`In Progress: ${inProgress} (${inProgressRate}%)`, leftColumnX + 6, leftY + 3);
    leftY += 6;

    // Assigned (with percentage)
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.circle(leftColumnX + 2, leftY + 2, 1.5, 'F');
    pdf.text(`Assigned: ${assigned} (${assignedRate}%)`, leftColumnX + 6, leftY + 3);
    leftY += 6;

    // Blocked (only if exists)
    if (blocked > 0) {
      pdf.setFillColor(239, 68, 68); // Red
      pdf.circle(leftColumnX + 2, leftY + 2, 1.5, 'F');
      pdf.text(`Blocked: ${blocked}`, leftColumnX + 6, leftY + 3);
      leftY += 6;
    }

    // RIGHT SIDE: Large Donut Chart (prominently placed like in reference)
    const chartCenterX = pageWidth - 55;
    const chartCenterY = yPosition + 18;
    const chartRadius = 25; // Larger radius for prominence
    const chartInnerRadius = 15;

    // Draw the donut chart
    this.drawDonutChart(pdf, chartCenterX, chartCenterY, chartRadius, chartInnerRadius, [
      { value: completed, color: [16, 185, 129], label: 'Completed' }, // Green
      { value: inProgress, color: [251, 191, 36], label: 'In Progress' }, // Yellow  
      { value: assigned, color: [59, 130, 246], label: 'Assigned' }, // Blue
      { value: blocked, color: [239, 68, 68], label: 'Blocked' } // Red
    ]);

    // No legend - chart speaks for itself with the left side bullet list
    yPosition = Math.max(leftY, chartCenterY + chartRadius + 5);
    yPosition += 15;

    // ========== DEPARTMENT PERFORMANCE SECTION ==========
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Department Performance', leftMargin, yPosition);
    yPosition += 10;

    const departments = reportData.departments || [];
    const displayDepts = departments.slice(0, 5);

    displayDepts.forEach((dept: any) => {
      const deptName = String(dept.name || 'Unknown').substring(0, 20);
      const deptRate = Math.round(dept.completionRate || 0);
      const deptTasks = `${dept.completedTasks || 0}/${dept.totalTasks || 0} tasks`;

      // Department name and stats
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(55, 65, 81);

      const barX = leftMargin + 45;
      const barWidth = pageWidth - barX - 30;
      const barHeight = 4;

      pdf.text(deptName, leftMargin, yPosition + 2);
      pdf.text(deptTasks, leftMargin + 42, yPosition + 2, { align: 'right' });

      // Progress bar
      const color = deptRate > 66 ? [16, 185, 129] : deptRate > 33 ? [251, 191, 36] : [239, 68, 68];
      this.drawProgressBar(pdf, barX, yPosition - 1, barWidth, barHeight, deptRate, color, '');

      yPosition += 8;
    });

    yPosition += 10;

    // ========== LEAVE SUMMARY SECTION ==========
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Leave Summary', leftMargin, yPosition);
    yPosition += 10;

    const leave = reportData.leave || {};
    const cardWidth = (pageWidth - 60) / 4; // 4 cards with spacing
    const cardHeight = 35;
    const cardSpacing = 5;

    const leaveCards = [
      { icon: '', value: leave.total || 0, label: 'Total Requests', color: [59, 130, 246] },
      { icon: '', value: leave.approved || 0, label: 'Approved', color: [16, 185, 129] },
      { icon: '', value: leave.pending || 0, label: 'Pending', color: [251, 191, 36] },
      { icon: '', value: leave.rejected || 0, label: 'Rejected', color: [239, 68, 68] }
    ];

    leaveCards.forEach((card, index) => {
      const cardX = leftMargin + (index * (cardWidth + cardSpacing));
      this.drawSummaryCard(pdf, cardX, yPosition, cardWidth, cardHeight, card.icon, card.value, card.label, card.color);
    });
  }


  private addProfessionalTasksContent(
    pdf: jsPDF,
    reportData: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    let yPosition = startY;
    const leftMargin = 20;

    const total = reportData.total || 0;
    const completed = reportData.byStatus?.completed || 0;
    const inProgress = reportData.byStatus?.inProgress || 0;
    const assigned = reportData.byStatus?.assigned || 0;
    const blocked = reportData.byStatus?.blocked || 0;

    // Task Statistics with donut chart
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Task Overview', leftMargin, yPosition);
    yPosition += 10;

    // Stats on left
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);

    pdf.text(`Total Tasks: ${total}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Completed: ${completed}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`In Progress: ${inProgress}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Assigned: ${assigned}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Blocked: ${blocked}`, leftMargin, yPosition);

    // Donut chart on right
    const chartX = pageWidth - 45;
    const chartY = startY + 20;
    this.drawDonutChart(pdf, chartX, chartY, 20, 12, [
      { value: completed, color: [16, 185, 129], label: 'Completed' },
      { value: inProgress, color: [251, 191, 36], label: 'In Progress' },
      { value: assigned, color: [59, 130, 246], label: 'Assigned' },
      { value: blocked, color: [239, 68, 68], label: 'Blocked' }
    ]);

    yPosition = Math.max(yPosition, chartY + 25);
    yPosition += 15;

    // Priority breakdown with progress bars
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); pdf.setTextColor(31, 41, 55);
    pdf.text('Priority Breakdown', leftMargin, yPosition);
    yPosition += 8;

    const priorities = [
      { label: 'Urgent', value: reportData.byPriority?.urgent || 0, color: [239, 68, 68] },
      { label: 'High', value: reportData.byPriority?.high || 0, color: [251, 191, 36] },
      { label: 'Medium', value: reportData.byPriority?.medium || 0, color: [59, 130, 246] },
      { label: 'Low', value: reportData.byPriority?.low || 0, color: [107, 114, 128] }
    ];

    priorities.forEach(priority => {
      const percentage = total > 0 ? Math.round((priority.value / total) * 100) : 0;
      const barX = leftMargin + 35;
      const barWidth = pageWidth - barX - 40;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(55, 65, 81);
      pdf.text(`${priority.label}:`, leftMargin + 33, yPosition + 2, { align: 'right' });

      this.drawProgressBar(pdf, barX, yPosition - 1, barWidth, 4, percentage, priority.color, '');
      yPosition += 7;
    });

    yPosition += 10;

    // Top performers
    if (reportData.topPerformers && reportData.topPerformers.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Top Performers', leftMargin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);

      reportData.topPerformers.slice(0, 5).forEach((user: any, index: number) => {
        const userName = String(user.userName || 'Unknown');
        const rate = Math.round(user.completionRate || 0);
        const tasks = `${user.completedTasks}/${user.totalTasks}`;

        pdf.text(`${index + 1}. ${userName}`, leftMargin, yPosition);
        pdf.text(`${tasks} (${rate}%)`, leftMargin + 80, yPosition);
        yPosition += 5;
      });
    }
  }

  private addProfessionalDepartmentsContent(
    pdf: jsPDF,
    reportData: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    let yPosition = startY;
    const leftMargin = 20;

    // Department summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Department Summary', leftMargin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);

    const summary = reportData.summary || {};
    pdf.text(`Total Departments: ${summary.totalDepartments || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Total Members: ${summary.totalMembers || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Total Tasks: ${summary.totalTasks || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Completed Tasks: ${summary.totalCompleted || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Average Completion: ${Math.round(summary.averageCompletionRate || 0)}%`, leftMargin, yPosition);
    yPosition += 15;

    // Department performance with progress bars
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Department Performance', leftMargin, yPosition);
    yPosition += 8;

    const departments = reportData.departments || [];
    departments.slice(0, 8).forEach((dept: any) => {
      const name = String(dept.name || 'Unknown').substring(0, 25);
      const rate = Math.round(dept.completionRate || 0);
      const tasks = `${dept.completedTasks || 0}/${dept.totalTasks || 0}`;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(55, 65, 81);

      const barX = leftMargin + 55;
      const barWidth = pageWidth - barX - 30;

      pdf.text(name, leftMargin, yPosition + 2);
      pdf.text(tasks, leftMargin + 53, yPosition + 2, { align: 'right' });

      const color = rate > 66 ? [16, 185, 129] : rate > 33 ? [251, 191, 36] : [239, 68, 68];
      this.drawProgressBar(pdf, barX, yPosition - 1, barWidth, 4, rate, color, '');

      yPosition += 8;
    });
  }

  private addProfessionalUsersContent(
    pdf: jsPDF,
    reportData: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    let yPosition = startY;
    const leftMargin = 20;

    // User summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Employee Summary', leftMargin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);

    const summary = reportData.summary || {};
    pdf.text(`Total Users: ${summary.totalUsers || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Active Users: ${summary.activeUsers || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Users with Tasks: ${summary.usersWithTasks || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Total Tasks: ${summary.totalTasks || 0}`, leftMargin, yPosition);
    yPosition += 5;
    pdf.text(`Average Completion: ${Math.round(summary.averageCompletionRate || 0)}%`, leftMargin, yPosition);
    yPosition += 15;

    // Top performers table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Employee Performance', leftMargin, yPosition);
    yPosition += 8;

    const users = reportData.users || [];
    users.slice(0, 10).forEach((user: any) => {
      const name = String(user.name || 'Unknown').substring(0, 30);
      const rate = Math.round(user.completionRate || 0);
      const tasks = user.totalTasks || 0;
      const dept = String(user.department || 'N/A').substring(0, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(55, 65, 81);

      pdf.text(name, leftMargin, yPosition);
      pdf.text(`${tasks} tasks`, leftMargin + 70, yPosition);
      pdf.text(`${rate}%`, leftMargin + 95, yPosition);

      // Small progress indicator
      const barX = leftMargin + 105;
      const barWidth = 30;
      const color = rate > 66 ? [16, 185, 129] : rate > 33 ? [251, 191, 36] : [239, 68, 68];

      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(barX, yPosition - 2, barWidth, 3, 1, 1, 'F');
      if (rate > 0) {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(barX, yPosition - 2, (barWidth * rate) / 100, 3, 1, 1, 'F');
      }

      yPosition += 6;
    });
  }

  private addProfessionalLeaveContent(
    pdf: jsPDF,
    reportData: any,
    startY: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    let yPosition = startY;
    const leftMargin = 20;

    // Leave summary with cards
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Leave Summary', leftMargin, yPosition);
    yPosition += 10;

    const summary = reportData.summary || {};
    const cardWidth = (pageWidth - 60) / 4;
    const cardHeight = 35;
    const cardSpacing = 5;

    const cards = [
      { icon: '', value: summary.total || 0, label: 'Total', color: [59, 130, 246] },
      { icon: '', value: summary.approved || 0, label: 'Approved', color: [16, 185, 129] },
      { icon: '', value: summary.pending || 0, label: 'Pending', color: [251, 191, 36] },
      { icon: '', value: summary.rejected || 0, label: 'Rejected', color: [239, 68, 68] }
    ];

    cards.forEach((card, i) => {
      const x = leftMargin + (i * (cardWidth + cardSpacing));
      this.drawSummaryCard(pdf, x, yPosition, cardWidth, cardHeight, card.icon, card.value, card.label, card.color);
    });

    yPosition += cardHeight + 15;

    // Leave types breakdown
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Leave Types', leftMargin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);

    const types = reportData.byType || {};
    const total = summary.total || 1;

    [
      { label: 'Annual Leave', value: types.annual || 0, color: [59, 130, 246] },
      { label: 'Sick Leave', value: types.sick || 0, color: [239, 68, 68] },
      { label: 'Emergency Leave', value: types.emergency || 0, color: [251, 191, 36] },
      { label: 'Compensatory Leave', value: types.compensatory || 0, color: [16, 185, 129] }
    ].forEach(type => {
      const percentage = total > 0 ? Math.round((type.value / total) * 100) : 0;
      const barX = leftMargin + 50;
      const barWidth = pageWidth - barX - 40;

      pdf.text(`${type.label}:`, leftMargin + 48, yPosition + 2, { align: 'right' });
      pdf.text(String(type.value), leftMargin + 52, yPosition + 2);

      this.drawProgressBar(pdf, barX + 20, yPosition - 1, barWidth - 20, 4, percentage, type.color, '');
      yPosition += 7;
    });

    yPosition += 10;

    // Recent requests
    if (reportData.recentRequests && reportData.recentRequests.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Recent Requests', leftMargin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(75, 85, 99);

      reportData.recentRequests.slice(0, 15).forEach((request: any) => {
        // Check for page break
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = 20;
          // Reset fonts after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(75, 85, 99);
        }

        const name = String(request.employee?.name || 'Unknown').substring(0, 25);
        const type = String(request.type || 'N/A');
        const days = request.days || 0;
        const status = String(request.status || 'N/A');

        // Status color
        let statusColor;
        switch (status.toLowerCase()) {
          case 'approved': statusColor = [16, 185, 129]; break;
          case 'pending': statusColor = [251, 191, 36]; break;
          case 'rejected': statusColor = [239, 68, 68]; break;
          default: statusColor = [107, 114, 128];
        }

        pdf.setTextColor(55, 65, 81);
        pdf.text(name, leftMargin, yPosition);
        pdf.text(`${type} (${days}d)`, leftMargin + 60, yPosition);

        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.text(status, leftMargin + 100, yPosition);

        yPosition += 5;
      });
    }
  }

  private addSimpleTasksContentToPDF(pdf: jsPDF, reportData: any, startY: number, pageWidth: number, pageHeight: number): void {
    let yPosition = startY;

    // Ensure proper font settings
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Task Statistics
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Task Statistics', 20, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Tasks: ${String(reportData.total || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Completed: ${String(reportData.byStatus?.completed || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`In Progress: ${String(reportData.byStatus?.inProgress || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Assigned: ${String(reportData.byStatus?.assigned || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Blocked: ${String(reportData.byStatus?.blocked || 0)}`, 25, yPosition);
    yPosition += 15;

    // Priority Breakdown
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Priority Breakdown:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Urgent: ${String(reportData.byPriority?.urgent || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`High: ${String(reportData.byPriority?.high || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`Medium: ${String(reportData.byPriority?.medium || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`Low: ${String(reportData.byPriority?.low || 0)}`, 25, yPosition);
    yPosition += 15;

    if (reportData.topPerformers && reportData.topPerformers.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Top Performers:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      reportData.topPerformers.slice(0, 5).forEach((user: any, index: number) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          // Reset font after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
        }
        const userName = String(user.userName || 'Unknown');
        const totalTasks = user.totalTasks || 0;
        const completionRate = user.completionRate || 0;
        pdf.text(`${index + 1}. ${userName}: ${totalTasks} tasks (${completionRate}% completion)`, 25, yPosition);
        yPosition += 5;
      });
    }
  }

  private addSimpleDepartmentsContentToPDF(pdf: jsPDF, reportData: any, startY: number, pageWidth: number, pageHeight: number): void {
    let yPosition = startY;

    // Ensure proper font settings
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Department Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Department Analytics', 20, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Departments: ${String(reportData.summary?.totalDepartments || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Total Members: ${String(reportData.summary?.totalMembers || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Total Tasks: ${String(reportData.summary?.totalTasks || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Completed Tasks: ${String(reportData.summary?.totalCompleted || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Avg Completion Rate: ${String(reportData.summary?.averageCompletionRate || 0)}%`, 25, yPosition);
    yPosition += 15;

    if (reportData.departments && reportData.departments.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Department Details:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      reportData.departments.slice(0, 8).forEach(dept => {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = 20;
          // Reset font after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
        }
        const deptName = String(dept.name || 'Unknown');
        const totalTasks = dept.totalTasks || 0;
        const completedTasks = dept.completedTasks || 0;
        const completionRate = dept.completionRate || 0;
        const members = dept.members || 0;

        pdf.text(`${deptName}:`, 25, yPosition);
        yPosition += 4;
        pdf.text(`  ${totalTasks} total tasks, ${completedTasks} completed (${completionRate}% rate)`, 30, yPosition);
        yPosition += 4;
        pdf.text(`  ${members} members`, 30, yPosition);
        yPosition += 6;
      });
    }
  }

  private addSimpleUsersContentToPDF(pdf: jsPDF, reportData: any, startY: number, pageWidth: number, pageHeight: number): void {
    let yPosition = startY;

    // Ensure proper font settings
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // User Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Employee Performance', 20, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Users: ${String(reportData.summary?.totalUsers || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Active Users: ${String(reportData.summary?.activeUsers || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Users with Tasks: ${String(reportData.summary?.usersWithTasks || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Total Tasks: ${String(reportData.summary?.totalTasks || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Avg Completion Rate: ${String(reportData.summary?.averageCompletionRate || 0)}%`, 25, yPosition);
    yPosition += 15;

    if (reportData.users && reportData.users.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Employee Details:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      reportData.users.slice(0, 10).forEach(user => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          // Reset font after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
        }
        const userName = String(user.name || 'Unknown');
        const totalTasks = user.totalTasks || 0;
        const completionRate = user.completionRate || 0;
        const department = String(user.department || 'No Department');

        pdf.text(`${userName}:`, 25, yPosition);
        yPosition += 4;
        pdf.text(`  ${totalTasks} tasks, ${completionRate}% completion rate`, 30, yPosition);
        yPosition += 4;
        pdf.text(`  Department: ${department}`, 30, yPosition);
        yPosition += 6;
      });
    }
  }

  private addSimpleLeaveContentToPDF(pdf: jsPDF, reportData: any, startY: number, pageWidth: number, pageHeight: number): void {
    let yPosition = startY;

    // Ensure proper font settings
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Leave Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Leave Management', 20, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Requests: ${String(reportData.summary?.total || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Approved: ${String(reportData.summary?.approved || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Pending: ${String(reportData.summary?.pending || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Rejected: ${String(reportData.summary?.rejected || 0)}`, 25, yPosition);
    yPosition += 5;
    pdf.text(`Total Days: ${String(reportData.summary?.totalDays || 0)}`, 25, yPosition);
    yPosition += 15;

    // Leave Types Breakdown
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Leave Types Breakdown:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Annual Leave: ${String(reportData.byType?.annual || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`Sick Leave: ${String(reportData.byType?.sick || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`Emergency Leave: ${String(reportData.byType?.emergency || 0)}`, 25, yPosition);
    yPosition += 4;
    pdf.text(`Compensatory Leave: ${String(reportData.byType?.compensatory || 0)}`, 25, yPosition);
    yPosition += 15;

    if (reportData.topUsers && reportData.topUsers.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Top Leave Users:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      reportData.topUsers.slice(0, 5).forEach((user: any, index: number) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
          // Reset font after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
        }
        const userName = String(user.userName || 'Unknown');
        const totalLeaveDays = user.totalLeaveDays || 0;
        const leaveRequests = user.leaveRequests || 0;
        pdf.text(`${index + 1}. ${userName}: ${totalLeaveDays} days (${leaveRequests} requests)`, 25, yPosition);
        yPosition += 5;
      });
    }
  }



  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Test method to create a simple PDF and verify jsPDF is working
   */
  async testPDFGeneration(): Promise<void> {
    try {
      console.log('Testing PDF generation...');
      const pdf = new jsPDF();

      // Add some basic content
      pdf.setFontSize(20);
      pdf.text('NevoStack PDF Test', 20, 30);

      pdf.setFontSize(12);
      pdf.text('This is a test PDF to verify jsPDF functionality.', 20, 50);
      pdf.text(`Generated at: ${new Date().toLocaleString()}`, 20, 70);
      pdf.text('If you can read this, PDF generation is working!', 20, 90);

      // Save the test PDF
      pdf.save('nevoStack_test.pdf');
      console.log('Test PDF created successfully!');

    } catch (error) {
      console.error('PDF test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const reportsService = new ReportsService();
export default reportsService;
