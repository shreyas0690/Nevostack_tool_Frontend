
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Calendar, Clock, Users, MapPin, Video, BarChart3 } from 'lucide-react';
import { mockMeetings } from '@/data/meetingsData';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';
import MeetingsList from './MeetingsList';
import MeetingsCalendar from './MeetingsCalendar';
import MeetingStats from './MeetingStats';
import MeetingDialog from '../Tasks/MeetingDialog';

export default function MeetingsManagement() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getDepartmentNames = (deptIds?: string[]) => {
    if (!deptIds) return 'N/A';
    return deptIds.map(id => {
      const dept = mockDepartments.find(d => d.id === id);
      return dept ? dept.name : 'Unknown';
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meetings Management</h1>
        <Button onClick={() => setShowMeetingDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Meetings List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Meetings</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <MeetingsList meetings={filteredMeetings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <MeetingsCalendar meetings={meetings} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <MeetingStats meetings={meetings} />
        </TabsContent>
      </Tabs>

      <MeetingDialog
        open={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
      />
    </div>
  );
}
