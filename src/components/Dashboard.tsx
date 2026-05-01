import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { ExportStats } from "@/components/ExportStats";
import { ActiveTimer } from "@/components/ActiveTimer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Zap, ListTodo, BarChart3 } from "lucide-react";
import { isPast } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface DashboardProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export function Dashboard({ userId, userEmail, onSignOut }: DashboardProps) {
  const [tasks, setTasks] = useState<Tables<"tasks">[]>([]);

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  }, [userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Sort: overdue first, then by priority score descending, completed last
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    const aOverdue = isPast(new Date(a.due_date)) && a.status !== "completed";
    const bOverdue = isPast(new Date(b.due_date)) && b.status !== "completed";
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    const aScore = (a.urgency * 3) + (a.effort * 1);
    const bScore = (b.urgency * 3) + (b.effort * 1);
    return bScore - aScore;
  });

  const activeTasks = sortedTasks.filter((t) => t.status !== "completed");
  const completedTasks = sortedTasks.filter((t) => t.status === "completed");
  const totalScore = activeTasks.reduce((sum, t) => sum + (t.urgency * 3 + t.effort), 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-gradient">FocusPulse</h1>
          </div>
          <div className="flex items-center gap-3">
            <ActiveTimer userId={userId} />
            <span className="text-xs text-muted-foreground hidden sm:block">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{activeTasks.length}</p>
            <p className="text-xs text-muted-foreground">Active Tasks</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{completedTasks.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gradient">{totalScore}</p>
            <p className="text-xs text-muted-foreground">Total Impact</p>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="glass">
              <TabsTrigger value="tasks" className="gap-1">
                <ListTodo className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <TaskForm userId={userId} onTaskCreated={loadTasks} />
          </div>

          <TabsContent value="tasks" className="space-y-3">
            {sortedTasks.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tasks yet. Add one to get started!</p>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={loadTasks} userId={userId} />
              ))
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsChart userId={userId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
