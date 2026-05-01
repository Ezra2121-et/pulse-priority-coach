import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Brain, Sparkles } from "lucide-react";
import { getAIPrioritization } from "@/server/ai-prioritizer.functions";
import type { Tables } from "@/integrations/supabase/types";

interface AIPrioritizerProps {
  tasks: Tables<"tasks">[];
}

export function AIPrioritizer({ tasks }: AIPrioritizerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const activeTasks = tasks.filter((t) => t.status !== "completed");

  const handleAnalyze = async () => {
    if (activeTasks.length === 0) {
      setSuggestion("No active tasks to analyze. Add some tasks first!");
      return;
    }
    setLoading(true);
    try {
      const result = await getAIPrioritization({
        data: {
          tasks: activeTasks.map((t) => ({
            name: t.name,
            urgency: t.urgency,
            effort: t.effort,
            due_date: t.due_date,
            status: t.status,
            tags: t.tags ?? [],
          })),
        },
      });
      setSuggestion(result.suggestion);
    } catch {
      setSuggestion("Failed to get AI suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !suggestion) handleAnalyze(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Brain className="h-3 w-3" />
          AI Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Task Prioritizer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing {activeTasks.length} tasks...</p>
            </div>
          ) : (
            <div className="glass rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {suggestion}
            </div>
          )}
          <Button onClick={handleAnalyze} disabled={loading} className="w-full gap-2">
            <Brain className="h-4 w-4" />
            {loading ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
