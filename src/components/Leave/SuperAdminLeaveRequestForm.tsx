import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, FileText, AlertCircle, User, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { leaveTypeConfig, LeaveType } from '@/types/leave';
import { mockLeaveBalances } from '@/data/leaveData';
import { mockUsers, currentUser } from '@/data/mockData';

export default function SuperAdminLeaveRequestForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    selectedUserId: '',
    leaveType: '' as LeaveType,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
    isHalfDay: false,
    halfDayPeriod: 'morning' as 'morning' | 'afternoon'
  });

  // Get all active users except super admin
  const availableUsers = mockUsers.filter(user => 
    user.isActive && user.id !== currentUser.id
  );

  const selectedUser = availableUsers.find(user => user.id === formData.selectedUserId);
  const userBalances = selectedUser ? 
    mockLeaveBalances.filter(b => b.employeeId === selectedUser.id) : [];

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const days = differenceInDays(formData.endDate, formData.startDate) + 1;
    return formData.isHalfDay ? 0.5 : days;
  };

  const getBalance = (leaveType: LeaveType) => {
    return userBalances.find(b => b.leaveType === leaveType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "User Required",
        description: "Please select a user for whom to create the leave request.",
        variant: "destructive"
      });
      return;
    }

    const totalDays = calculateDays();
    const balance = getBalance(formData.leaveType);
    
    if (!balance || totalDays > balance.remaining) {
      toast({
        title: "Insufficient Balance",
        description: `${selectedUser.name} doesn't have enough leave balance for this request.`,
        variant: "destructive"
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Leave Request Created",
      description: `${leaveTypeConfig[formData.leaveType].label} request for ${selectedUser.name} (${totalDays} day(s)) has been created successfully.`,
    });

    // Reset form
    setFormData({
      selectedUserId: '',
      leaveType: '' as LeaveType,
      startDate: undefined,
      endDate: undefined,
      reason: '',
      isHalfDay: false,
      halfDayPeriod: 'morning'
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create Leave Request (Super Admin)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create leave requests on behalf of any user in the system
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="userSelect">Select User</Label>
            <Select 
              value={formData.selectedUserId} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                selectedUserId: value,
                leaveType: '' as LeaveType // Reset leave type when user changes
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose user for leave request" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-blue-900">{selectedUser.name}</p>
                  <p className="text-sm text-blue-700">{selectedUser.email}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selectedUser.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Leave Type */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={formData.leaveType} onValueChange={(value: LeaveType) => 
                setFormData(prev => ({ ...prev, leaveType: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeConfig).map(([key, config]) => {
                    const balance = getBalance(key as LeaveType);
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center justify-between w-full">
                          <span>{config.label}</span>
                          {balance && (
                            <Badge variant="outline" className="ml-2">
                              {balance.remaining} days left
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          {formData.leaveType && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ 
                        ...prev, 
                        startDate: date,
                        endDate: date && !prev.endDate ? date : prev.endDate
                      }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      disabled={(date) => 
                        date < new Date() || 
                        (formData.startDate && date < formData.startDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Total Days Display */}
          {formData.startDate && formData.endDate && selectedUser && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Days:</span>
                <Badge variant="secondary">{calculateDays()} days</Badge>
              </div>
              {formData.leaveType && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedUser.name}'s Remaining Balance:
                  </span>
                  <span className="text-sm font-medium">
                    {getBalance(formData.leaveType)?.remaining || 0} days
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Half Day Option */}
          {formData.leaveType && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="halfDay"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isHalfDay: e.target.checked,
                  endDate: e.target.checked ? prev.startDate : prev.endDate
                }))}
                className="rounded"
              />
              <Label htmlFor="halfDay">Half Day Leave</Label>
            </div>
          )}

          {formData.isHalfDay && (
            <Select 
              value={formData.halfDayPeriod} 
              onValueChange={(value: 'morning' | 'afternoon') => 
                setFormData(prev => ({ ...prev, halfDayPeriod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (First Half)</SelectItem>
                <SelectItem value="afternoon">Afternoon (Second Half)</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Reason */}
          {formData.leaveType && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for this leave request..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          )}

          {/* Warning for insufficient balance */}
          {formData.leaveType && formData.startDate && formData.endDate && selectedUser && (
            (() => {
              const balance = getBalance(formData.leaveType);
              const totalDays = calculateDays();
              if (balance && totalDays > balance.remaining) {
                return (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Insufficient balance! {selectedUser.name} needs {totalDays} days but only has {balance.remaining} days remaining.
                    </span>
                  </div>
                );
              }
              return null;
            })()
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={
              !formData.selectedUserId ||
              !formData.leaveType || 
              !formData.startDate || 
              !formData.endDate || 
              !formData.reason.trim() ||
              (formData.leaveType && formData.startDate && formData.endDate && selectedUser && 
                (() => {
                  const balance = getBalance(formData.leaveType);
                  return balance ? calculateDays() > balance.remaining : true;
                })()
              )
            }
          >
            Create Leave Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

















































































































