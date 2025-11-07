import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsService } from '@/services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function AdminAnalyticsPage() {
  const { data: overviewData } = useQuery(['analytics','overview'], async () => {
    const res: any = await analyticsService.getOverview({});
    return res?.data || {};
  });

  const { data: leavesSeries } = useQuery(['analytics','leavesSeries'], async () => {
    const res: any = await analyticsService.getLeavesTimeseries({});
    return res?.data || [];
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overviewData.totalLeaves || 0}</div>
            <pre className="text-xs mt-2">{JSON.stringify(overviewData.leavesByStatus || {}, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaves (Timeseries)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {leavesSeries.map((r: any) => (
                <li key={String(r.date)}>{format(new Date(r.date), 'yyyy-MM-dd')}: {r.count}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


