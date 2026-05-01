import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsChartProps {
  userId: string;
}

interface DayData {
  day: string;
  completed: number;
  focusMinutes: number;
}

export function AnalyticsChart({ userId }: AnalyticsChartProps) {
  const [data, setData] = useState<DayData[]>([]);

  useEffect(() => {
    async function load() {
      const days: DayData[] = [];
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

        days.push({
          day: format(date, "EEE"),
          completed: completed ?? 0,
          focusMinutes: totalMinutes,
        });
      }
      setData(days);
    }

    load();
  }, [userId]);

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 40%)" />
          <XAxis dataKey="day" stroke="oklch(0.65 0.02 260)" fontSize={12} />
          <YAxis stroke="oklch(0.65 0.02 260)" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.17 0.02 260)",
              border: "1px solid oklch(0.30 0.02 260)",
              borderRadius: "8px",
              color: "oklch(0.95 0.01 260)",
            }}
          />
          <Legend />
          <Bar dataKey="completed" name="Completed" fill="oklch(0.70 0.18 155)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="focusMinutes" name="Focus (min)" fill="oklch(0.65 0.22 260)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
