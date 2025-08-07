import { Event } from '@/types/events';

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Q4 All Hands Meeting',
    description: 'Quarterly review and planning session for all departments. We will discuss achievements, challenges, and upcoming goals.',
    type: 'meeting',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
    posterImage: '/placeholder.svg',
    attachedFiles: [
      {
        id: 'file-1',
        name: 'Q4_Agenda.pdf',
        url: '/placeholder.svg',
        size: 245760,
        type: 'application/pdf',
        uploadedAt: new Date('2024-01-15'),
      }
    ],
    isOnline: false,
    visibility: 'all',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'event-2',
    title: 'Security Training Workshop',
    description: 'Mandatory cybersecurity training for all employees. Learn about latest threats and best practices.',
    type: 'training',
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
    posterImage: '/placeholder.svg',
    isOnline: true,
    meetingLink: 'https://zoom.us/j/123456789',
    visibility: 'all',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    isActive: true,
  },
  {
    id: 'event-3',
    title: 'Engineering Department Sprint Planning',
    description: 'Sprint planning meeting for the engineering team to discuss upcoming tasks and priorities.',
    type: 'meeting',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours later
    isOnline: false,
    visibility: 'department_specific',
    allowedDepartments: ['dept-1'], // Engineering department
    createdBy: 'user-1',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    isActive: true,
  },
  {
    id: 'event-4',
    title: 'New Year Celebration',
    description: 'Company-wide celebration to welcome the new year. Food, drinks, and entertainment provided.',
    type: 'celebration',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
    posterImage: '/placeholder.svg',
    isOnline: false,
    visibility: 'all',
    createdBy: 'admin-2',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    isActive: true,
  },
  {
    id: 'event-5',
    title: 'Managers Weekly Sync',
    description: 'Weekly synchronization meeting for all department managers and team leads.',
    type: 'meeting',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 hour later
    isOnline: true,
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/123',
    visibility: 'managers_only',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
  },
  {
    id: 'event-6',
    title: 'Project Deadline: Mobile App Beta',
    description: 'Final deadline for mobile app beta release. All testing and documentation must be completed.',
    type: 'deadline',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 0.5 * 60 * 60 * 1000), // 30 minutes
    isOnline: false,
    visibility: 'department_specific',
    allowedDepartments: ['dept-1', 'dept-3'], // Engineering and Marketing
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
  },
];