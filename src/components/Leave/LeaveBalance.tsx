import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { leaveTypeConfig } from '@/types/leave';
import { mockLeaveBalances } from '@/data/leaveData';
import { currentUser } from '@/data/mockData';

export default function LeaveBalance() {
  const userBalances = mockLeaveBalances.filter(b => b.employeeId === currentUser.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Balance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {userBalances.map((balance) => {
            const config = leaveTypeConfig[balance.leaveType];
            const usagePercentage = (balance.used / balance.totalAllowed) * 100;
            
            return (
              <div key={`${balance.employeeId}-${balance.leaveType}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    <h4 className="font-medium">{config.label}</h4>
                  </div>
                  <Badge variant="outline">
                    {balance.remaining} of {balance.totalAllowed} days
                  </Badge>
                </div>
                
                <Progress 
                  value={usagePercentage} 
                  className="h-2"
                />
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium text-green-600">{balance.remaining}</div>
                    <div className="text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-medium text-orange-600">{balance.used}</div>
                    <div className="text-muted-foreground">Used</div>
                  </div>
                  {balance.carryForward > 0 && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-medium text-blue-600">{balance.carryForward}</div>
                      <div className="text-muted-foreground">Carry Forward</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Quick Stats */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Used:</span>
                <span className="font-medium">
                  {userBalances.reduce((sum, b) => sum + b.used, 0)} days
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Available:</span>
                <span className="font-medium text-green-600">
                  {userBalances.reduce((sum, b) => sum + b.remaining, 0)} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}