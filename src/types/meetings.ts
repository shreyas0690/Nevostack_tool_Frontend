
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'department' | 'user' | 'team' | 'physical' | 'virtual' | 'hybrid';
export type MeetingPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: MeetingType;
  date: Date;
  duration: number; // in minutes
  location: string;
  meetingLink?: string;
  organizer: string | any; // Can be string ID or object with user details
  attendees: string[];
  departments?: string[];
  status: MeetingStatus;
  priority?: MeetingPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingStats {
  totalMeetings: number;
  completedMeetings: number;
  scheduledMeetings: number;
  averageDuration: number;
  monthlyStats: {
    month: string;
    count: number;
    duration: number;
  }[];
}
