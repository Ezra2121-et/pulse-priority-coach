import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface SubtasksProps {
  taskId: string;
  userId: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export function Subtasks({ taskId, userId }: SubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("subtasks")
      .select("id, title, completed")
      .eq("task_id", taskId)
      .order("created_at");
    if (data) setSubtasks(data);
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await supabase.from("subtasks").insert({ task_id: taskId, user_id: userId, title });
    setNewTitle("");
    load();
  };

  const toggle = async (id: string, completed: boolean) => {
    await supabase.from("subtasks").update({ completed: !completed }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("subtasks").delete().eq("id", id);
    load();
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="space-y-2 mt-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{completedCount}/{subtasks.length}</span>
        </div>
      )}
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-2 group">
          <Checkbox checked={s.completed} onCheckedChange={() => toggle(s.id, s.completed)} className="h-3.5 w-3.5" />
          <span className={`text-xs flex-1 ${s.completed ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
          <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      <div className="flex gap-1">
        <Input
          placeholder="Add subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className="h-7 text-xs"
        />
        <Button type="button" size="sm" variant="ghost" onClick={add} className="h-7 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
