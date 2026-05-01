import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, X, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface TaskDependenciesProps {
  taskId: string;
  userId: string;
  allTasks: Tables<"tasks">[];
}

interface Dependency {
  id: string;
  depends_on_task_id: string;
  task_name: string;
  status: string;
}

export function TaskDependencies({ taskId, userId, allTasks }: TaskDependenciesProps) {
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("task_dependencies")
      .select("id, depends_on_task_id")
      .eq("task_id", taskId);

    if (data) {
      const enriched = data.map((d) => {
        const task = allTasks.find((t) => t.id === d.depends_on_task_id);
        return {
          ...d,
          task_name: task?.name ?? "Unknown",
          status: task?.status ?? "pending",
        };
      });
      setDeps(enriched);
    }
  }, [taskId, allTasks]);

  useEffect(() => { load(); }, [load]);

  const addDep = async (depTaskId: string) => {
    await supabase.from("task_dependencies").insert({
      task_id: taskId,
      depends_on_task_id: depTaskId,
      user_id: userId,
    });
    setShowAdd(false);
    load();
  };

  const removeDep = async (id: string) => {
    await supabase.from("task_dependencies").delete().eq("id", id);
    load();
  };

  const availableTasks = allTasks.filter(
    (t) => t.id !== taskId && !deps.some((d) => d.depends_on_task_id === t.id)
  );

  const hasBlocking = deps.some((d) => d.status !== "completed");

  return (
    <div className="mt-2 space-y-1">
      {deps.length > 0 && (
        <div className="space-y-1">
          {hasBlocking && (
            <p className="text-[10px] text-orange-400 flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" /> Blocked by incomplete dependencies
            </p>
          )}
          {deps.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5 text-xs">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className={d.status === "completed" ? "line-through text-muted-foreground" : ""}>
                {d.task_name}
              </span>
              <button onClick={() => removeDep(d.id)} className="ml-auto">
                <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
      {showAdd ? (
        <Select onValueChange={addDep}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select dependency..." />
          </SelectTrigger>
          <SelectContent>
            {availableTasks.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(true)} className="h-6 text-[10px] gap-1 px-1">
          <GitBranch className="h-2.5 w-2.5" /> Add dependency
        </Button>
      )}
    </div>
  );
}
