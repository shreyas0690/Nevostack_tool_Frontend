import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, ClipboardList, TrendingUp } from 'lucide-react';
import { mockUsers, mockDepartments, mockTasks } from '@/data/mockData';
import { mockMeetings } from '@/data/meetingsData';
import MeetingsDisplay from '@/components/Meetings/MeetingsDisplay';

export default function DashboardOverview() {
  const totalUsers = mockUsers.filter(u => u.isActive).length;
  const totalDepartments = mockDepartments.length;
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(t => t.status === 'completed').length;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      description: 'Active employees',
      color: 'text-blue-600'
    },
    {
      title: 'Departments',
      value: totalDepartments,
      icon: Building2,
      description: 'Company divisions',
      color: 'text-green-600'
    },
    {
      title: 'Active Tasks',
      value: totalTasks - completedTasks,
      icon: ClipboardList,
      description: 'Pending assignments',
      color: 'text-orange-600'
    },
    {
      title: 'Completion Rate',
      value: `${Math.round((completedTasks / totalTasks) * 100)}%`,
      icon: TrendingUp,
      description: 'Tasks completed',
      color: 'text-purple-600'
    }
  ];

  const recentTasks = mockTasks.slice(0, 3);
  const departmentOverview = mockDepartments.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {task.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in_progress' ? 'secondary' :
                      task.status === 'blocked' ? 'destructive' : 'outline'
                    }
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentOverview.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <div>
                      <h4 className="font-medium">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.memberCount} members
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{dept.memberCount}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meetings Display */}
        <MeetingsDisplay 
          meetings={mockMeetings} 
          maxMeetings={3}
        />
      </div>
    </div>
  );
}