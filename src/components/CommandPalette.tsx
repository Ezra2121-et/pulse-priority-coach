import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Play, CheckCircle2, Search, BarChart3, ListTodo, Keyboard } from "lucide-react";

interface CommandPaletteProps {
  onNewTask: () => void;
  onSwitchToTasks: () => void;
  onSwitchToAnalytics: () => void;
}

interface Command {
  id: string;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette({ onNewTask, onSwitchToTasks, onSwitchToAnalytics }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const commands: Command[] = [
    { id: "new-task", label: "New Task", shortcut: "N", icon: <Plus className="h-4 w-4" />, action: () => { onNewTask(); setOpen(false); } },
    { id: "tasks", label: "Go to Tasks", shortcut: "T", icon: <ListTodo className="h-4 w-4" />, action: () => { onSwitchToTasks(); setOpen(false); } },
    { id: "analytics", label: "Go to Analytics", shortcut: "A", icon: <BarChart3 className="h-4 w-4" />, action: () => { onSwitchToAnalytics(); setOpen(false); } },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setSearch("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-glass-border sm:max-w-md p-0 gap-0">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-glass-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type a command..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 h-auto text-sm"
              autoFocus
            />
            <kbd className="hidden sm:inline text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No commands found.</p>
            ) : (
              filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                >
                  {cmd.icon}
                  <span className="flex-1">{cmd.label}</span>
                  <kbd className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-glass-border text-xs text-muted-foreground flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            <span>⌘K to toggle</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
