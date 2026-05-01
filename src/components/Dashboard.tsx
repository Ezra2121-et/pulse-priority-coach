import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskForm } from "@/components/TaskForm";
import { TaskCard } from "@/components/TaskCard";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { ExportStats } from "@/components/ExportStats";
import { ActiveTimer } from "@/components/ActiveTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { CursorSpotlight } from "@/components/CursorSpotlight";
import { StreaksAndBadges } from "@/components/StreaksAndBadges";
import { KanbanBoard } from "@/components/KanbanBoard";
import { FocusInsights } from "@/components/FocusInsights";
import { AIPrioritizer } from "@/components/AIPrioritizer";
import { TagFilter } from "@/components/TaskTags";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Zap, ListTodo, BarChart3, Kanban, TrendingUp, Trophy, Search } from "lucide-react";
import { isPast } from "date-fns";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/integrations/supabase/types";

interface DashboardProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export function Dashboard({ userId, userEmail, onSignOut }: DashboardProps) {
  const [tasks, setTasks] = useState<Tables<"tasks">[]>([]);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);

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

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach((t) => (t.tags ?? []).forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [tasks]);

  // Sort: overdue first, then by priority score descending, completed last
  const sortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (tagFilters.length > 0) {
      filtered = filtered.filter((t) =>
        tagFilters.some((f) => (t.tags ?? []).includes(f))
      );
    }

    return filtered.sort((a, b) => {
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
  }, [tasks, searchQuery, tagFilters]);

  const activeTasks = sortedTasks.filter((t) => t.status !== "completed");
  const completedTasks = sortedTasks.filter((t) => t.status === "completed");
  const totalScore = activeTasks.reduce((sum, t) => sum + (t.urgency * 3 + t.effort), 0);

  return (
    <div className="min-h-screen relative">
      <CursorSpotlight />

      {/* Command palette */}
      <CommandPalette
        onNewTask={() => setTaskFormOpen(true)}
        onSwitchToTasks={() => setActiveTab("tasks")}
        onSwitchToAnalytics={() => setActiveTab("analytics")}
      />

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-gradient">FocusPulse</h1>
          </div>
          <div className="flex items-center gap-2">
            <ActiveTimer userId={userId} />
            <PomodoroTimer />
            <ThemeToggle />
            <span className="text-xs text-muted-foreground hidden sm:block">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6 relative z-10">
        {/* Quote */}
        <MotivationalQuote />

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList className="glass">
              <TabsTrigger value="tasks" className="gap-1">
                <ListTodo className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="streaks" className="gap-1">
                <Trophy className="h-4 w-4" />
                Streaks
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <AIPrioritizer tasks={tasks} />
              <ExportStats userId={userId} tasks={tasks} />
              <TaskForm userId={userId} onTaskCreated={loadTasks} externalOpen={taskFormOpen} onExternalOpenChange={setTaskFormOpen} />
            </div>
          </div>

          {/* Search & filter bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks... (⌘K for commands)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <TagFilter activeFilters={tagFilters} onChange={setTagFilters} availableTags={allTags} />
          </div>

          <TabsContent value="tasks" className="space-y-3">
            {sortedTasks.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery || tagFilters.length > 0
                    ? "No tasks match your filters."
                    : "No tasks yet. Add one to get started!"}
                </p>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={loadTasks} userId={userId} allTasks={tasks} />
              ))
            )}
          </TabsContent>

          <TabsContent value="kanban">
            <KanbanBoard tasks={sortedTasks} onUpdate={loadTasks} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsChart userId={userId} />
          </TabsContent>

          <TabsContent value="insights">
            <FocusInsights userId={userId} />
          </TabsContent>

          <TabsContent value="streaks">
            <StreaksAndBadges userId={userId} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="glass rounded-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          ⌘K
        </button>
      </div>
    </div>
  );
}
