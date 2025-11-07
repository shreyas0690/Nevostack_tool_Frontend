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
      }
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
    const tasksData = reportData;
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
    // Frontend expects the summary stats directly
    const departmentsData = reportData.summary || reportData;
    console.log('🏢 Departments summary data final:', departmentsData);

    return departmentsData as DepartmentsReport;
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
    // Frontend expects the summary stats directly
    const usersData = reportData.summary || reportData;
    console.log('👥 Users summary data final:', usersData);

    return usersData as UsersReport;
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
    const leaveData = reportData;
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
    console.log('Starting simple PDF generation...', { category, fileName });

    try {
      // Create PDF document with proper encoding
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

      // Set font to ensure proper character encoding
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      // Company Header
      const companyName = String(reportData.company?.name || 'Company Name');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Company contact info
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const companyAddress = reportData.company?.address;
      const companyPhone = reportData.company?.phone;
      const companyEmail = reportData.company?.email;

      // Format address properly
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

      if (formattedAddress) {
        pdf.text(formattedAddress, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }
      if (companyPhone) {
        pdf.text(String(companyPhone), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }
      if (companyEmail) {
        pdf.text(String(companyEmail), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }

      yPosition += 15;

      // Report Title
      const title = `${category.charAt(0).toUpperCase() + category.slice(1)} Report`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Report Meta Information
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      // Format dates properly to avoid encoding issues
      const periodText = reportData.period || 'N/A';
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const reportTypeText = reportData.reportType || 'N/A';

      pdf.text(`Period: ${periodText}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Generated: ${generatedDate}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Report Type: ${reportTypeText}`, 20, yPosition);
      yPosition += 20;

      // Generate content based on category
      switch (category) {
        case 'overview':
          this.addSimpleOverviewContentToPDF(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'tasks':
          this.addSimpleTasksContentToPDF(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'departments':
          this.addSimpleDepartmentsContentToPDF(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'users':
          this.addSimpleUsersContentToPDF(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        case 'leave':
          this.addSimpleLeaveContentToPDF(pdf, reportData, yPosition, pageWidth, pageHeight);
          break;
        default:
          pdf.text(`Report Category: ${category}`, 20, yPosition);
      }

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(
          `Generated for ${companyName} - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
      }

      // Save the PDF
      pdf.save(fileName);
      console.log('Simple PDF saved successfully!');

    } catch (error) {
      console.error('Error generating simple PDF:', error);

      // Create a basic fallback PDF with proper encoding
      try {
        const fallbackPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          putOnlyUsedFonts: true
        });

        const companyName = String(reportData.company?.name || 'Company Report');

        // Set proper font and encoding
        fallbackPdf.setFont('helvetica', 'normal');
        fallbackPdf.setTextColor(0, 0, 0);

        fallbackPdf.setFontSize(16);
        fallbackPdf.text(`${companyName} Report`, 20, 30);
        fallbackPdf.setFontSize(12);
        fallbackPdf.text(`Category: ${category}`, 20, 50);
        fallbackPdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);
        fallbackPdf.text(`Error: ${String(error.message)}`, 20, 80);
        fallbackPdf.text('Please try again or contact support.', 20, 95);

        fallbackPdf.save(`${fileName.replace('.pdf', '')}_fallback.pdf`);
        console.log('Fallback PDF created successfully');
      } catch (fallbackError) {
        console.error('Fallback PDF also failed:', fallbackError);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
      }
    }
  }

  private addSimpleOverviewContentToPDF(pdf: jsPDF, reportData: any, startY: number, pageWidth: number, pageHeight: number): void {
    let yPosition = startY;

    // Ensure proper font settings
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Tasks Summary
    if (reportData.tasks) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Task Overview', 20, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const completionRate = reportData.tasks.total > 0 ?
        Math.round((reportData.tasks.completed / reportData.tasks.total) * 100) : 0;

      pdf.text(`Total Tasks: ${String(reportData.tasks.total || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Completed: ${String(reportData.tasks.completed || 0)} (${completionRate}%)`, 25, yPosition);
      yPosition += 5;
      pdf.text(`In Progress: ${String(reportData.tasks.inProgress || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Assigned: ${String(reportData.tasks.assigned || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Blocked: ${String(reportData.tasks.blocked || 0)}`, 25, yPosition);
      yPosition += 15;
    }

    // Departments Summary
    if (reportData.departments && reportData.departments.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Department Performance', 20, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      reportData.departments.slice(0, 5).forEach(dept => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          // Reset font after page break
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
        }

        const deptName = String(dept.name || 'Unknown');
        const completedTasks = dept.completedTasks || 0;
        const totalTasks = dept.totalTasks || 0;
        const completionRate = dept.completionRate || 0;

        pdf.text(`${deptName}: ${completedTasks}/${totalTasks} tasks (${completionRate}%)`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Leave Summary
    if (reportData.leave) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Leave Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Total Requests: ${String(reportData.leave.total || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Approved: ${String(reportData.leave.approved || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Pending: ${String(reportData.leave.pending || 0)}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Rejected: ${String(reportData.leave.rejected || 0)}`, 25, yPosition);
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

    // Top Performers
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

    // Department Details
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

    // User Details
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

    // Top Users
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
