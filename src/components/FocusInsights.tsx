import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, startOfDay, endOfDay, getHours } from "date-fns";
import { TrendingUp, Clock, Target, Zap } from "lucide-react";

interface FocusInsightsProps {
  userId: string;
}

interface WeeklyData {
  week: string;
  focusMinutes: number;
  completed: number;
}

interface HourData {
  hour: string;
  minutes: number;
}

export function FocusInsights({ userId }: FocusInsightsProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [hourData, setHourData] = useState<HourData[]>([]);
  const [avgFocusMin, setAvgFocusMin] = useState(0);
  const [productivityScore, setProductivityScore] = useState(0);
  const [peakHour, setPeakHour] = useState("");

  useEffect(() => {
    async function load() {
      // Last 28 days of sessions
      const since = subDays(new Date(), 28).toISOString();
      const { data: sessions } = await supabase
        .from("sessions")
        .select("time_spent, started_at")
        .eq("user_id", userId)
        .gte("started_at", since);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("updated_at, status")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("updated_at", since);

      // Weekly aggregation (4 weeks)
      const weeks: WeeklyData[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekStart = subDays(new Date(), (w + 1) * 7);
        const weekEnd = subDays(new Date(), w * 7);
        const weekSessions = (sessions ?? []).filter((s) => {
          const d = new Date(s.started_at);
          return d >= weekStart && d < weekEnd;
        });
        const weekTasks = (tasks ?? []).filter((t) => {
          const d = new Date(t.updated_at);
          return d >= weekStart && d < weekEnd;
        });
        weeks.push({
          week: `W${4 - w}`,
          focusMinutes: Math.round(weekSessions.reduce((s, r) => s + (r.time_spent || 0), 0) / 60),
          completed: weekTasks.length,
        });
      }
      setWeeklyData(weeks);

      // Peak hours (24h distribution)
      const hourBuckets: Record<number, number> = {};
      for (let h = 0; h < 24; h++) hourBuckets[h] = 0;
      (sessions ?? []).forEach((s) => {
        const h = getHours(new Date(s.started_at));
        hourBuckets[h] += (s.time_spent || 0) / 60;
      });

      const hours: HourData[] = Object.entries(hourBuckets).map(([h, min]) => ({
        hour: `${h.padStart(2, "0")}:00`,
        minutes: Math.round(min),
      }));
      setHourData(hours);

      // Find peak
      const peakEntry = hours.reduce((a, b) => (b.minutes > a.minutes ? b : a), hours[0]);
      setPeakHour(peakEntry.hour);

      // Avg daily focus
      const totalMin = (sessions ?? []).reduce((s, r) => s + (r.time_spent || 0), 0) / 60;
      setAvgFocusMin(Math.round(totalMin / 28));

      // Productivity score (0-100 based on consistency and output)
      const activeDays = new Set(
        (sessions ?? []).filter((s) => s.time_spent > 0).map((s) => format(new Date(s.started_at), "yyyy-MM-dd"))
      ).size;
      const consistency = Math.min((activeDays / 28) * 100, 100);
      const output = Math.min(((tasks ?? []).length / 28) * 100, 100);
      setProductivityScore(Math.round((consistency * 0.6 + output * 0.4)));
    }

    load();
  }, [userId]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{avgFocusMin}m</p>
          <p className="text-[10px] text-muted-foreground">Avg Daily Focus</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Target className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{peakHour}</p>
          <p className="text-[10px] text-muted-foreground">Peak Hour</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{productivityScore}</p>
          <p className="text-[10px] text-muted-foreground">Productivity Score</p>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Weekly Trends (4 weeks)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 40%)" />
            <XAxis dataKey="week" stroke="oklch(0.65 0.02 260)" fontSize={12} />
            <YAxis stroke="oklch(0.65 0.02 260)" fontSize={12} />
            <Tooltip contentStyle={{ background: "oklch(0.17 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: "8px", color: "oklch(0.95 0.01 260)" }} />
            <Bar dataKey="focusMinutes" name="Focus (min)" fill="oklch(0.65 0.22 260)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="oklch(0.70 0.18 155)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Peak hours */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Peak Productivity Hours</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 40%)" />
            <XAxis dataKey="hour" stroke="oklch(0.65 0.02 260)" fontSize={10} interval={3} />
            <YAxis stroke="oklch(0.65 0.02 260)" fontSize={10} />
            <Tooltip contentStyle={{ background: "oklch(0.17 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: "8px", color: "oklch(0.95 0.01 260)" }} />
            <Line type="monotone" dataKey="minutes" stroke="oklch(0.65 0.22 260)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
