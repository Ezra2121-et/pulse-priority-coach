import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Zap, Star, Target, Clock, Award } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval, isToday, isYesterday } from "date-fns";

interface StreaksAndBadgesProps {
  userId: string;
}

interface BadgeInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
}

interface DayActivity {
  date: string;
  count: number;
}

export function StreaksAndBadges({ userId }: StreaksAndBadgesProps) {
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalFocusMin, setTotalFocusMin] = useState(0);
  const [heatmapData, setHeatmapData] = useState<DayActivity[]>([]);

  useEffect(() => {
    async function load() {
      // Get completed tasks with dates
      const { data: tasks } = await supabase
        .from("tasks")
        .select("updated_at, status")
        .eq("user_id", userId)
        .eq("status", "completed");

      const completedCount = tasks?.length ?? 0;
      setTotalCompleted(completedCount);

      // Get total focus time
      const { data: sessions } = await supabase
        .from("sessions")
        .select("time_spent, started_at")
        .eq("user_id", userId);

      const totalMin = Math.round((sessions ?? []).reduce((s, r) => s + (r.time_spent || 0), 0) / 60);
      setTotalFocusMin(totalMin);

      // Calculate streak
      const completionDays = new Set(
        (tasks ?? []).map((t) => format(new Date(t.updated_at), "yyyy-MM-dd"))
      );
      const sessionDays = new Set(
        (sessions ?? []).filter((s) => s.time_spent > 0).map((s) => format(new Date(s.started_at), "yyyy-MM-dd"))
      );
      const activeDays = new Set([...completionDays, ...sessionDays]);

      let currentStreak = 0;
      let checkDate = new Date();
      // If today has activity, start counting; otherwise check from yesterday
      const todayStr = format(checkDate, "yyyy-MM-dd");
      if (!activeDays.has(todayStr)) {
        checkDate = subDays(checkDate, 1);
        const yesterdayStr = format(checkDate, "yyyy-MM-dd");
        if (!activeDays.has(yesterdayStr)) {
          setStreak(0);
          buildHeatmap(activeDays);
          return;
        }
      }

      while (activeDays.has(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
      setStreak(currentStreak);
      buildHeatmap(activeDays);
    }

    function buildHeatmap(activeDays: Set<string>) {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 90),
        end: new Date(),
      });
      setHeatmapData(
        days.map((d) => ({
          date: format(d, "yyyy-MM-dd"),
          count: activeDays.has(format(d, "yyyy-MM-dd")) ? 1 : 0,
        }))
      );
    }

    load();
  }, [userId]);

  const badges: BadgeInfo[] = useMemo(() => [
    { id: "first", label: "First Blood", description: "Complete your first task", icon: <Zap className="h-3 w-3" />, earned: totalCompleted >= 1 },
    { id: "five", label: "High Five", description: "Complete 5 tasks", icon: <Star className="h-3 w-3" />, earned: totalCompleted >= 5 },
    { id: "streak3", label: "On Fire", description: "3-day streak", icon: <Flame className="h-3 w-3" />, earned: streak >= 3 },
    { id: "streak7", label: "Week Warrior", description: "7-day streak", icon: <Flame className="h-3 w-3" />, earned: streak >= 7 },
    { id: "focus30", label: "Deep Work", description: "30+ min total focus", icon: <Clock className="h-3 w-3" />, earned: totalFocusMin >= 30 },
    { id: "focus120", label: "Flow State", description: "2+ hours total focus", icon: <Target className="h-3 w-3" />, earned: totalFocusMin >= 120 },
    { id: "ten", label: "Task Master", description: "Complete 10 tasks", icon: <Trophy className="h-3 w-3" />, earned: totalCompleted >= 10 },
    { id: "fifty", label: "Legendary", description: "Complete 50 tasks", icon: <Award className="h-3 w-3" />, earned: totalCompleted >= 50 },
  ], [totalCompleted, streak, totalFocusMin]);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-4">
      {/* Streak */}
      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${streak > 0 ? "bg-orange-500/20" : "bg-secondary"}`}>
            <Flame className={`h-6 w-6 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary">{earnedCount}/{badges.length}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Activity (90 days)</h3>
        <div className="flex flex-wrap gap-[3px]">
          {heatmapData.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count ? "Active" : "No activity"}`}
              className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${
                d.count > 0
                  ? "bg-primary/80"
                  : "bg-secondary/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Badges</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <Badge
              key={b.id}
              variant={b.earned ? "default" : "outline"}
              className={`gap-1 text-xs cursor-default ${
                b.earned ? "glow-primary" : "opacity-40"
              }`}
              title={b.description}
            >
              {b.icon}
              {b.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
