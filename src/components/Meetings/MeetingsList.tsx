
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Video, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
import { meetingService } from '@/services/meetingService';
import { Meeting } from '@/types/meetings';
import { mockUsers, mockDepartments } from '@/data/mockData';
import EditMeetingDialog from './EditMeetingDialog';
import toast from 'react-hot-toast';

interface MeetingsListProps {
  meetings: Meeting[];
  onStatusChange?: () => void; // callback to refresh meetings list
  onEdit?: (meeting: Meeting) => void;
}

export default function MeetingsList({ meetings, onStatusChange, onEdit }: MeetingsListProps) {
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      in_progress: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
      completed: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600',
      cancelled: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-600'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getUserName = (user: any) => {
    if (!user) return 'Unknown User';
    if (typeof user === 'string') {
      const u = mockUsers.find(u => u.id === user);
      return u ? u.name : 'Unknown User';
    }
    if (user.name) return user.name;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (user.id) {
      const u = mockUsers.find(u => u.id === user.id);
      return u ? u.name : 'Unknown User';
    }
    return 'Unknown User';
  };

  type DeptLike = string | { _id?: string; id?: string; name?: string };

  const getDepartmentNames = (deptItems?: DeptLike[]) => {
    if (!deptItems) return [];
    return deptItems.map(item => {
      if (!item) return 'Unknown';
      if (typeof item === 'string') {
        const dept = mockDepartments.find(d => d.id === item);
        return dept ? dept.name : 'Unknown';
      }
      // item is an object
      if ((item as any).name) return (item as any).name;
      const id = (item as any).id || (item as any)._id;
      if (id) {
        const dept = mockDepartments.find(d => d.id === id);
        return dept ? dept.name : 'Unknown';
      }
      return 'Unknown';
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    
    try {
      console.log('🗑️ Attempting to delete meeting:', meetingToDelete.id);
      console.log('🗑️ Meeting data:', meetingToDelete);
      
      await meetingService.deleteMeeting(meetingToDelete.id);
      
      console.log('✅ Meeting deleted successfully');
      toast.success(`Meeting "${meetingToDelete.title}" deleted successfully! 🗑️`);
      
      if (onStatusChange) onStatusChange();
      setShowDeleteDialog(false);
      setMeetingToDelete(null);
    } catch (error) {
      console.error('❌ Failed to delete meeting:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // Show error toast
      const errorMessage = error.message || 'Failed to delete meeting. Please try again.';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const sortedMeetings = [...meetings].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Pagination logic
  const totalPages = Math.ceil(sortedMeetings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMeetings = sortedMeetings.slice(startIndex, endIndex);

  // Reset to first page when meetings change
  useEffect(() => {
    setCurrentPage(1);
  }, [meetings.length]);

  if (meetings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No meetings found.
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {paginatedMeetings.map((meeting) => (
        <div
          key={meeting.id}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 hover:shadow-md dark:hover:shadow-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group"
        >
          {/* Header */}
          <div className="relative mb-3 sm:mb-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-lg"></div>
            
            <div className="relative flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 p-2 sm:p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-full shadow-lg shadow-red-500/25"></div>
                    <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-red-500 to-transparent dark:from-red-400 dark:to-transparent rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 leading-tight">
                      {meeting?.title || 'Untitled Meeting'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Meeting ID: {meeting?.id?.slice(-8) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                {meeting?.description && (
                  <div className="ml-5 sm:ml-7">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-3 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-600 italic">
                      {meeting.description}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 sm:ml-4">
                <div className="text-right sm:text-right">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</div>
                  <Badge className={`${getStatusColor(meeting?.status || 'scheduled')} border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-full shadow-sm`}>
                    {(meeting?.status || 'scheduled').replace('_', ' ')}
                  </Badge>
                </div>
                <Select value={meeting.status} onValueChange={async (val: any) => {
                  try {
                    await meetingService.updateMeetingStatus(meeting.id, val as any);
                    if (onStatusChange) onStatusChange();
                  } catch (e) {
                    console.error('Failed to update meeting status', e);
                  }
                }}>
                  <SelectTrigger className="w-full sm:w-36 h-7 sm:h-8 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors bg-white dark:bg-slate-700 shadow-sm text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center border border-red-100 dark:border-red-800">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  {meeting?.date ? new Date(meeting.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'No date'}
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                  {meeting?.date ? new Date(meeting.date).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'No time'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center border border-red-100 dark:border-red-800">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1 sm:mb-2">
                  {meeting?.attendees?.length || 0} Attendees
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {(meeting?.attendees && meeting.attendees.length > 0)
                    ? meeting.attendees.map((a: any, index: number) => {
                      if (!a) return 'Unknown';
                      const person = a.user || a;
                      const name = getUserName(person);
                      return (
                        <span key={index} className="inline-block mr-2 sm:mr-3 mb-1 font-medium">
                          {name}
                          {index < meeting.attendees.length - 1 ? ',' : ''}
                        </span>
                      );
                    })
                    : 'No attendees'}
                </div>
              </div>
            </div>
          </div>

          {/* Departments */}
          {meeting.departments && meeting.departments.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm mb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Departments:</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {getDepartmentNames(meeting.departments).map((name, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2 sm:px-3 py-1 rounded-full font-medium">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 px-3 sm:px-4 text-xs sm:text-sm"
              onClick={() => {
                if (onEdit) onEdit(meeting);
                else setEditingMeeting(meeting);
              }}
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Edit Meeting</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 px-3 sm:px-4 text-xs sm:text-sm"
              onClick={() => {
                setMeetingToDelete(meeting);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Delete Meeting</span>
              <span className="sm:hidden">Delete</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white px-4 shadow-sm hover:shadow-md transition-all duration-200"
              asChild
            >
              <a href={meeting.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className={`cursor-pointer ${
                      currentPage === page 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <EditMeetingDialog
        open={!!editingMeeting}
        onClose={() => setEditingMeeting(null)}
        meeting={editingMeeting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the meeting "{meetingToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
