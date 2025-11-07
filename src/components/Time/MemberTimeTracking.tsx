import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock, Play, Square, Pause, Plus, Trash2, Calendar as CalendarIcon, Timer, BarChart3, Edit
} from 'lucide-react';

type TimeLog = {
  id: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMs: number;
  project: string;
  notes?: string;
  createdAt: string;
};

const formatDuration = (ms: number): string => {
  if (!ms || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const toDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MemberTimeTracking() {
  const { currentUser } = useAuth();

  const storageKey = useMemo(() => `time_logs_${currentUser?.id || 'guest'}`,[currentUser?.id]);
  const runningKey = useMemo(() => `time_running_${currentUser?.id || 'guest'}`,[currentUser?.id]);

  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTs, setSessionStartTs] = useState<number | null>(null);
  const [sessionProject, setSessionProject] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [now, setNow] = useState<number>(Date.now());

  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualDate, setManualDate] = useState<string>(toDateKey(new Date()));
  const [manualStart, setManualStart] = useState<string>('');
  const [manualEnd, setManualEnd] = useState<string>('');
  const [manualProject, setManualProject] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');

  const tickRef = useRef<number | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setLogs(JSON.parse(raw) as TimeLog[]);
      }
      const runningRaw = localStorage.getItem(runningKey);
      if (runningRaw) {
        const running = JSON.parse(runningRaw) as { startTs: number; project: string; notes?: string };
        setIsRunning(true);
        setSessionStartTs(running.startTs);
        setSessionProject(running.project || '');
        setSessionNotes(running.notes || '');
      }
    } catch {
      // ignore
    }
  }, [storageKey, runningKey]);

  // Persist logs
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs, storageKey]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      tickRef.current = window.setInterval(() => setNow(Date.now()), 1000) as unknown as number;
      try {
        localStorage.setItem(runningKey, JSON.stringify({ startTs: sessionStartTs, project: sessionProject, notes: sessionNotes }));
      } catch {}
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isRunning, runningKey, sessionStartTs, sessionProject, sessionNotes]);

  const startSession = () => {
    if (isRunning) return;
    const startTs = Date.now();
    setSessionStartTs(startTs);
    setIsRunning(true);
  };

  const stopSession = () => {
    if (!isRunning || !sessionStartTs) return;
    const endTs = Date.now();
    const durationMs = endTs - sessionStartTs;
    const start = new Date(sessionStartTs);
    const end = new Date(endTs);

    const newLog: TimeLog = {
      id: `${endTs}`,
      userId: currentUser?.id || 'guest',
      dateKey: toDateKey(start),
      startTime: `${start.getHours().toString().padStart(2,'0')}:${start.getMinutes().toString().padStart(2,'0')}`,
      endTime: `${end.getHours().toString().padStart(2,'0')}:${end.getMinutes().toString().padStart(2,'0')}`,
      durationMs,
      project: sessionProject || 'General',
      notes: sessionNotes,
      createdAt: new Date().toISOString(),
    };

    setLogs(prev => [newLog, ...prev]);
    setIsRunning(false);
    setSessionStartTs(null);
    setSessionProject('');
    setSessionNotes('');
    try { localStorage.removeItem(runningKey); } catch {}
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const addManualEntry = () => {
    if (!manualDate || !manualStart || !manualEnd) return;
    const [sH, sM] = manualStart.split(':').map(n => parseInt(n, 10));
    const [eH, eM] = manualEnd.split(':').map(n => parseInt(n, 10));
    const start = new Date(manualDate);
    start.setHours(sH || 0, sM || 0, 0, 0);
    const end = new Date(manualDate);
    end.setHours(eH || 0, eM || 0, 0, 0);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    if (durationMs <= 0) return;

    const newLog: TimeLog = {
      id: `${Date.now()}`,
      userId: currentUser?.id || 'guest',
      dateKey: manualDate,
      startTime: manualStart,
      endTime: manualEnd,
      durationMs,
      project: manualProject || 'Manual Entry',
      notes: manualNotes,
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    setShowManualDialog(false);
    setManualProject('');
    setManualNotes('');
    setManualStart('');
    setManualEnd('');
    setManualDate(toDateKey(new Date()));
  };

  const todayKey = toDateKey(new Date());
  const todaysLogs = useMemo(() => logs.filter(l => l.dateKey === todayKey), [logs, todayKey]);
  const todaysTotalMs = todaysLogs.reduce((acc, l) => acc + l.durationMs, 0);

  // Weekly summary (last 7 days including today)
  const weekly = useMemo(() => {
    const days: { label: string; key: string; totalMs: number }[] = [];
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const totalMs = logs.filter(l => l.dateKey === key).reduce((a,b) => a + b.durationMs, 0);
      days.push({ label: labels[d.getDay()], key, totalMs });
    }
    const max = Math.max(1, ...days.map(d => d.totalMs));
    return { days, max };
  }, [logs]);

  const runningElapsedMs = isRunning && sessionStartTs ? (now - sessionStartTs) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Log your work hours and track productivity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowManualDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Entry
          </Button>
          {isRunning ? (
            <Button onClick={stopSession} className="bg-red-600 hover:bg-red-700">
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          ) : (
            <Button onClick={startSession} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" /> Start
            </Button>
          )}
        </div>
      </div>

      {/* Active Timer */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" /> Active Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="text-center lg:col-span-1">
              <div className="text-5xl font-bold text-blue-700">
                {formatDuration(runningElapsedMs)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Elapsed Time</div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">What are you working on?</Label>
                <Input
                  id="project"
                  placeholder="e.g., Landing page redesign"
                  value={sessionProject}
                  onChange={(e) => setSessionProject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add a short note"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Today's Logs
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                {formatDuration(todaysTotalMs)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No logs for today yet
              </div>
            ) : (
              <div className="space-y-3">
                {todaysLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{log.startTime} - {log.endTime}</Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {formatDuration(log.durationMs)}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm font-medium">{log.project}</div>
                      {log.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{log.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => deleteLog(log.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weekly.days.map((d) => {
                const widthPct = Math.round((d.totalMs / weekly.max) * 100);
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    <div className="w-10 text-xs text-muted-foreground">{d.label}</div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full">
                      <div
                        className="h-3 bg-blue-500 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="w-14 text-right text-xs font-medium">
                      {formatDuration(d.totalMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Time Entry</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="project2">Project/Task</Label>
              <Input id="project2" placeholder="e.g., API integration" value={manualProject} onChange={(e) => setManualProject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="start">Start Time</Label>
              <Input id="start" type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">End Time</Label>
              <Input id="end" type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes2">Notes (optional)</Label>
              <Input id="notes2" placeholder="Add context..." value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>Cancel</Button>
            <Button onClick={addManualEntry} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
