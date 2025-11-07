import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Users,
  Building2,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Share2,
  RefreshCw,
  Plus,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Advanced mock data
const mockReports = [
  {
    id: '1',
    name: 'Comprehensive Revenue Analysis Q4 2024',
    type: 'financial',
    category: 'revenue',
    status: 'generated',
    downloads: 156,
    views: 342,
    lastGenerated: '2024-01-15T10:30:00Z',
    size: '2.4 MB',
    format: 'PDF',
    priority: 'high',
    tags: ['revenue', 'quarterly', 'analysis'],
    description: 'Detailed revenue breakdown with growth trends and projections',
    generatedBy: 'System Auto',
    schedule: 'monthly'
  },
  {
    id: '2',
    name: 'User Growth & Engagement Report',
    type: 'user',
    category: 'analytics',
    status: 'generated',
    downloads: 89,
    views: 234,
    lastGenerated: '2024-01-14T14:20:00Z',
    size: '1.8 MB',
    format: 'Excel',
    priority: 'medium',
    tags: ['users', 'growth', 'engagement'],
    description: 'User acquisition, retention, and engagement metrics',
    generatedBy: 'Analytics Engine',
    schedule: 'weekly'
  },
  {
    id: '3',
    name: 'Platform Performance & Uptime',
    type: 'performance',
    category: 'system',
    status: 'generated',
    downloads: 67,
    views: 189,
    lastGenerated: '2024-01-13T09:15:00Z',
    size: '3.1 MB',
    format: 'PDF',
    priority: 'high',
    tags: ['performance', 'uptime', 'system'],
    description: 'System performance metrics and uptime statistics',
    generatedBy: 'Monitoring System',
    schedule: 'daily'
  },
  {
    id: '4',
    name: 'Company Onboarding Success Rate',
    type: 'company',
    category: 'business',
    status: 'generating',
    downloads: 0,
    views: 12,
    lastGenerated: null,
    size: '0 MB',
    format: 'PDF',
    priority: 'medium',
    tags: ['onboarding', 'success', 'companies'],
    description: 'Analysis of company onboarding process and success rates',
    generatedBy: 'Business Intelligence',
    schedule: 'monthly'
  },
  {
    id: '5',
    name: 'Security Audit & Compliance Report',
    type: 'security',
    category: 'compliance',
    status: 'generated',
    downloads: 45,
    views: 98,
    lastGenerated: '2024-01-12T16:45:00Z',
    size: '4.2 MB',
    format: 'PDF',
    priority: 'critical',
    tags: ['security', 'compliance', 'audit'],
    description: 'Security assessment and compliance verification report',
    generatedBy: 'Security Team',
    schedule: 'quarterly'
  },
  {
    id: '6',
    name: 'Customer Satisfaction Survey Results',
    type: 'feedback',
    category: 'customer',
    status: 'generated',
    downloads: 78,
    views: 156,
    lastGenerated: '2024-01-11T11:30:00Z',
    size: '1.5 MB',
    format: 'Excel',
    priority: 'medium',
    tags: ['satisfaction', 'feedback', 'survey'],
    description: 'Customer satisfaction scores and feedback analysis',
    generatedBy: 'Customer Success',
    schedule: 'monthly'
  }
];

const reportCategories = [
  { id: 'all', name: 'All Reports', count: mockReports.length },
  { id: 'financial', name: 'Financial', count: 1 },
  { id: 'user', name: 'User Analytics', count: 1 },
  { id: 'performance', name: 'Performance', count: 1 },
  { id: 'company', name: 'Company', count: 1 },
  { id: 'security', name: 'Security', count: 1 },
  { id: 'feedback', name: 'Feedback', count: 1 }
];

const reportTypes = [
  { id: 'revenue', name: 'Revenue Analysis' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'system', name: 'System' },
  { id: 'business', name: 'Business' },
  { id: 'compliance', name: 'Compliance' },
  { id: 'customer', name: 'Customer' }
];

export default function SaaSReportsManagement() {
  const [reports] = useState(mockReports);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const { toast } = useToast();

  const totalReports = reports.length;
  const generatedReports = reports.filter(r => r.status === 'generated').length;
  const totalDownloads = reports.reduce((sum, r) => sum + r.downloads, 0);
  const totalViews = reports.reduce((sum, r) => sum + r.views, 0);
  const generatingReports = reports.filter(r => r.status === 'generating').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated': return <Badge className="bg-green-100 text-green-800">Generated</Badge>;
      case 'generating': return <Badge className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'company': return <Building2 className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'security': return <CheckCircle className="h-4 w-4" />;
      case 'feedback': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleDownloadReport = (report: any) => {
    toast({
      title: "Download Started",
      description: `${report.name} is being downloaded.`,
    });
  };

  const handleViewReport = (report: any) => {
    toast({
      title: "Opening Report",
      description: `Opening ${report.name} in preview mode.`,
    });
  };

  const handleShareReport = (report: any) => {
    toast({
      title: "Share Report",
      description: `Sharing options for ${report.name}.`,
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.type === selectedCategory;
    const matchesType = selectedType === 'all' || report.category === selectedType;
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || report.priority === selectedPriority;
    
    return matchesCategory && matchesType && matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reports Center</h1>
          <p className="text-muted-foreground">Comprehensive reporting and analytics dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Advanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{generatedReports}</div>
            <Progress value={(generatedReports / totalReports) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((generatedReports / totalReports) * 100)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalDownloads}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +8% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalViews}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +15% from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Reports</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reports ({filteredReports.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{report.name}</h3>
                          {getStatusBadge(report.status)}
                          {getPriorityBadge(report.priority)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Size: {report.size}</span>
                          <span>Format: {report.format}</span>
                          <span>Generated by: {report.generatedBy}</span>
                          <span>Schedule: {report.schedule}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {report.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{report.downloads} downloads</div>
                        <div className="text-sm font-medium">{report.views} views</div>
                        <div className="text-xs text-muted-foreground">
                          {report.lastGenerated ? new Date(report.lastGenerated).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {report.status === 'generated' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShareReport(report)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            Recent reports will appear here
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            Most popular reports will appear here
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            Scheduled reports will appear here
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Generate Analytics Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <PieChart className="h-6 w-6" />
              <span>Create Custom Dashboard</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <LineChart className="h-6 w-6" />
              <span>Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
