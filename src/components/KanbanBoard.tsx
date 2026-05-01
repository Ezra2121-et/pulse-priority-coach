import { useCallback } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, AlertTriangle, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface KanbanBoardProps {
  tasks: Tables<"tasks">[];
  onUpdate: () => void;
}

const COLUMNS = [
  { id: "pending", title: "📋 To Do", color: "oklch(0.65 0.02 260)" },
  { id: "in_progress", title: "⚡ In Progress", color: "oklch(0.65 0.22 260)" },
  { id: "completed", title: "✅ Done", color: "oklch(0.70 0.18 155)" },
];

export function KanbanBoard({ tasks, onUpdate }: KanbanBoardProps) {
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      const newStatus = result.destination.droppableId;
      const taskId = result.draggableId;

      try {
        const { error } = await supabase
          .from("tasks")
          .update({ status: newStatus })
          .eq("id", taskId);
        if (error) throw error;
        onUpdate();
      } catch {
        toast.error("Failed to update task status");
      }
    },
    [onUpdate]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    {colTasks.map((task, index) => {
                      const isOverdue = isPast(new Date(task.due_date)) && task.status !== "completed";
                      const score = task.urgency * 3 + task.effort;
                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
                                snapshot.isDragging ? "glow-primary rotate-2 scale-105" : ""
                              } ${isOverdue ? "border-overdue glow-overdue" : ""}`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                {isOverdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                                <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {task.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {format(new Date(task.due_date), "MMM d")}
                                </span>
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  <Zap className="h-2.5 w-2.5 mr-0.5" />{score}
                                </Badge>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {task.tags.slice(0, 2).map((tag) => (
                                      <span key={tag} className="text-[10px] bg-primary/20 text-primary rounded px-1">{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
