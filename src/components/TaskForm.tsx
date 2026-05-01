import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface TaskFormProps {
  userId: string;
  onTaskCreated: () => void;
}

export function TaskForm({ userId, onTaskCreated }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [urgency, setUrgency] = useState([3]);
  const [effort, setEffort] = useState([3]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dueDate) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: userId,
        name: name.trim(),
        due_date: new Date(dueDate).toISOString(),
        urgency: urgency[0],
        effort: effort[0],
      });
      if (error) throw error;
      toast.success("Task created!");
      setName("");
      setDueDate("");
      setUrgency([3]);
      setEffort([3]);
      setOpen(false);
      onTaskCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const priorityScore = (urgency[0] * 3) + (effort[0] * 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 glow-primary">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient">New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              placeholder="What needs to get done?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Urgency</Label>
              <span className="text-sm font-mono text-primary">{urgency[0]}/5</span>
            </div>
            <Slider value={urgency} onValueChange={setUrgency} min={1} max={5} step={1} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Effort</Label>
              <span className="text-sm font-mono text-primary">{effort[0]}/5</span>
            </div>
            <Slider value={effort} onValueChange={setEffort} min={1} max={5} step={1} />
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Impact Score</p>
            <p className="text-2xl font-bold text-gradient">{priorityScore}</p>
            <p className="text-xs text-muted-foreground">(Urgency×3) + (Effort×1)</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
