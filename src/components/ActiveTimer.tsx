import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Clock } from "lucide-react";

interface ActiveTimerProps {
  userId: string;
}

interface ActiveSession {
  id: string;
  task_id: string;
  started_at: string;
  task_name: string;
}

export function ActiveTimer({ userId }: ActiveTimerProps) {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const loadActiveSession = useCallback(async () => {
    // Find sessions with no ended_at (still in progress)
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, task_id, started_at")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      const s = sessions[0];
      // Get task name
      const { data: task } = await supabase
        .from("tasks")
        .select("name")
        .eq("id", s.task_id)
        .single();

      setSession({
        id: s.id,
        task_id: s.task_id,
        started_at: s.started_at,
        task_name: task?.name ?? "Unknown task",
      });
    } else {
      setSession(null);
    }
  }, [userId]);

  useEffect(() => {
    loadActiveSession();
    // Poll every 10s for new active sessions
    const poll = setInterval(loadActiveSession, 10000);
    return () => clearInterval(poll);
  }, [loadActiveSession]);

  // Tick the timer
  useEffect(() => {
    if (!session) {
      setElapsed(0);
      return;
    }

    const calcElapsed = () => {
      const start = new Date(session.started_at).getTime();
      return Math.floor((Date.now() - start) / 1000);
    };

    setElapsed(calcElapsed());
    const interval = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return (
    <div className="glass glow-primary rounded-full px-4 py-2 flex items-center gap-2 animate-pulse-slow">
      <Play className="h-3 w-3 text-primary fill-primary" />
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{session.task_name}</span>
      <span className="font-mono text-sm text-primary tabular-nums flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {timeStr}
      </span>
    </div>
  );
}
