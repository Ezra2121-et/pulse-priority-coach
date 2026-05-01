import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Download, FileText, Table2, Loader2 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface ExportStatsProps {
  userId: string;
  tasks: Tables<"tasks">[];
}

interface DayStats {
  day: string;
  completed: number;
  focusMinutes: number;
  activeTasks: number;
  totalImpact: number;
}

async function gatherStats(userId: string, tasks: Tables<"tasks">[]): Promise<DayStats[]> {
  const stats: DayStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    const [{ count: completed }, { data: sessions }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("updated_at", dayStart)
        .lte("updated_at", dayEnd),
      supabase
        .from("sessions")
        .select("time_spent")
        .eq("user_id", userId)
        .gte("started_at", dayStart)
        .lte("started_at", dayEnd),
    ]);

    const totalMinutes = Math.round(
      (sessions ?? []).reduce((sum, s) => sum + (s.time_spent || 0), 0) / 60
    );

    const activeTasks = tasks.filter((t) => t.status !== "completed").length;
    const totalImpact = tasks
      .filter((t) => t.status !== "completed")
      .reduce((sum, t) => sum + (t.urgency * 3 + t.effort), 0);

    stats.push({
      day: format(date, "yyyy-MM-dd (EEE)"),
      completed: completed ?? 0,
      focusMinutes: totalMinutes,
      activeTasks,
      totalImpact,
    });
  }
  return stats;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(stats: DayStats[]) {
  const header = "Date,Completed,Focus (min),Active Tasks,Total Impact";
  const rows = stats.map((s) => `${s.day},${s.completed},${s.focusMinutes},${s.activeTasks},${s.totalImpact}`);
  downloadFile([header, ...rows].join("\n"), `focuspulse-stats-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
}

function exportPDF(stats: DayStats[]) {
  // Simple HTML-to-print PDF approach
  const totalCompleted = stats.reduce((s, d) => s + d.completed, 0);
  const totalFocus = stats.reduce((s, d) => s + d.focusMinutes, 0);

  const html = `<!DOCTYPE html>
<html><head><title>FocusPulse Report</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 40px; background: #0f172a; color: #e2e8f0; }
  h1 { color: #818cf8; margin-bottom: 4px; }
  h2 { color: #94a3b8; font-weight: 400; font-size: 14px; margin-bottom: 24px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; }
  .stat { background: #1e293b; border-radius: 12px; padding: 16px 24px; text-align: center; }
  .stat .value { font-size: 28px; font-weight: 700; color: #818cf8; }
  .stat .label { font-size: 12px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #334155; }
  th { color: #94a3b8; font-size: 12px; text-transform: uppercase; }
  td { color: #e2e8f0; }
</style></head><body>
<h1>⚡ FocusPulse Report</h1>
<h2>Last 7 Days — Generated ${format(new Date(), "PPP")}</h2>
<div class="summary">
  <div class="stat"><div class="value">${totalCompleted}</div><div class="label">Tasks Completed</div></div>
  <div class="stat"><div class="value">${totalFocus}</div><div class="label">Focus Minutes</div></div>
</div>
<table>
  <thead><tr><th>Date</th><th>Completed</th><th>Focus (min)</th><th>Active Tasks</th><th>Impact Score</th></tr></thead>
  <tbody>${stats.map((s) => `<tr><td>${s.day}</td><td>${s.completed}</td><td>${s.focusMinutes}</td><td>${s.activeTasks}</td><td>${s.totalImpact}</td></tr>`).join("")}</tbody>
</table>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}

export function ExportStats({ userId, tasks }: ExportStatsProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type: "csv" | "pdf") => {
    setLoading(true);
    try {
      const stats = await gatherStats(userId, tasks);
      if (type === "csv") exportCSV(stats);
      else exportPDF(stats);
      toast.success(`${type.toUpperCase()} export ready!`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glass border-glass-border">
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 cursor-pointer">
          <Table2 className="h-4 w-4" /> Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" /> Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
