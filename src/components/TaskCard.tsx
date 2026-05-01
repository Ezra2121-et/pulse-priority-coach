import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Square, CheckCircle2, Clock, Zap, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { format, isPast } from "date-fns";
import { Subtasks } from "@/components/Subtasks";
import { TaskDependencies } from "@/components/TaskDependencies";
import { TagBadge } from "@/components/TaskTags";
import { useConfetti } from "@/components/Confetti";
import type { Tables } from "@/integrations/supabase/types";

interface TaskCardProps {
  task: Tables<"tasks">;
  onUpdate: () => void;
  userId: string;
  allTasks: Tables<"tasks">[];
}

export function TaskCard({ task, onUpdate, userId, allTasks }: TaskCardProps) {
  const [focusing, setFocusing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const fireConfetti = useConfetti();

  const isOverdue = isPast(new Date(task.due_date)) && task.status !== "completed";
  const priorityScore = (task.urgency * 3) + (task.effort * 1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (focusing) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [focusing]);

  const startFocus = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("sessions").insert({
        user_id: userId,
        task_id: task.id,
        time_spent: 0,
      }).select().single();
      if (error) throw error;

      await supabase.from("tasks").update({ status: "in_progress" }).eq("id", task.id);
      setSessionId(data.id);
      setFocusing(true);
      setSeconds(0);
      onUpdate();
    } catch {
      toast.error("Failed to start focus session");
    }
  }, [userId, task.id, onUpdate]);

  const stopFocus = useCallback(async () => {
    if (!sessionId) return;
    try {
      await supabase.from("sessions").update({
        time_spent: seconds,
        ended_at: new Date().toISOString(),
      }).eq("id", sessionId);
      setFocusing(false);
      setSessionId(null);
      toast.success(`Focused for ${formatTime(seconds)}`);
      onUpdate();
    } catch {
      toast.error("Failed to save session");
    }
  }, [sessionId, seconds, onUpdate]);

  const completeTask = useCallback(async () => {
    if (focusing) await stopFocus();
    try {
      await supabase.from("tasks").update({ status: "completed" }).eq("id", task.id);
      fireConfetti();
      toast.success("🎉 Task completed!");
      onUpdate();
    } catch {
      toast.error("Failed to complete task");
    }
  }, [focusing, stopFocus, task.id, onUpdate, fireConfetti]);

  return (
    <div
      className={`glass rounded-xl p-4 transition-all duration-300 glass-hover ${
        isOverdue ? "border-overdue glow-overdue" : ""
      } ${focusing ? "glow-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
            <h3 className={`font-semibold truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {task.name}
            </h3>
            {task.status !== "completed" && (
              <button onClick={() => setExpanded(!expanded)} className="shrink-0">
                {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(task.due_date), "MMM d, h:mm a")}
            </span>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Score: {priorityScore}
            </Badge>
            <Badge variant="outline" className="text-xs">U:{task.urgency} E:{task.effort}</Badge>
            {task.tags && task.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} size="sm" />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {focusing && (
            <span className="font-mono text-sm text-primary tabular-nums">
              {formatTime(seconds)}
            </span>
          )}
          {task.status !== "completed" && (
            <>
              {!focusing ? (
                <Button size="sm" onClick={startFocus} className="gap-1">
                  <Play className="h-3 w-3" />
                  Focus
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={stopFocus} className="gap-1">
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={completeTask}>
                <CheckCircle2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && task.status !== "completed" && (
        <div className="mt-3 pt-3 border-t border-glass-border space-y-3">
          <Subtasks taskId={task.id} userId={userId} />
          <TaskDependencies taskId={task.id} userId={userId} allTasks={allTasks} />
        </div>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
