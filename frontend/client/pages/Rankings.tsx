import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  ListTodo,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, MonthlyTrend, Task } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const formatSignedPercent = (value: number, digits = 0): string => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
};

const formatClockTime = (value: string): string => {
  if (!value) {
    return "Time not set";
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "Time not set";
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return TIME_FORMATTER.format(date);
};

const formatTaskSchedule = (task: Task): string => {
  if (task.startTime && task.endTime) {
    return `${formatClockTime(task.startTime)} - ${formatClockTime(task.endTime)}`;
  }

  if (task.startTime) {
    return `Starts ${formatClockTime(task.startTime)}`;
  }

  if (task.endTime) {
    return `Ends ${formatClockTime(task.endTime)}`;
  }

  return "Time not set";
};

const parseDueAt = (task: Task): Date | null => {
  if (!task.date) {
    return null;
  }

  const fallbackTime = task.endTime || task.startTime || "23:59";
  const dueAt = new Date(`${task.date}T${fallbackTime}:00`);

  if (Number.isNaN(dueAt.getTime())) {
    return null;
  }

  return dueAt;
};

const formatDurationFromMinutes = (totalMinutes: number): string => {
  const absoluteMinutes = Math.abs(totalMinutes);
  const days = Math.floor(absoluteMinutes / 1440);
  const hours = Math.floor((absoluteMinutes % 1440) / 60);
  const minutes = absoluteMinutes % 60;

  if (days > 0) {
    return `${days}d${hours > 0 ? ` ${hours}h` : ""}`;
  }

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  }

  return `${minutes}m`;
};

const formatTimingLabel = (minuteOffset: number): string => {
  if (minuteOffset > 0) {
    return `${formatDurationFromMinutes(minuteOffset)} overdue`;
  }

  if (minuteOffset < 0) {
    return `Due in ${formatDurationFromMinutes(minuteOffset)}`;
  }

  return "Due now";
};

interface MonthlyKpiRow {
  key: string;
  label: string;
  month: string;
  tasks: number;
  resolved: number;
  pending: number;
  completionRate: number;
  variancePct: number;
}

interface PendingTaskNotice extends Task {
  dueAt: Date;
  minuteOffset: number;
  urgencyLevel: "overdue" | "today" | "upcoming";
  urgencyScore: number;
}

export default function Rankings() {
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const [monthlyTrendData, taskData] = await Promise.all([
          api.getMonthlyTrends(),
          api.getTasks(),
        ]);

        setMonthlyData(monthlyTrendData);
        setTasks(taskData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchKpiData();
  }, []);

  const monthlyKpiRows = useMemo<MonthlyKpiRow[]>(() => {
    if (monthlyData.length === 0) {
      return [];
    }

    const pendingByMonth = tasks.reduce<Record<string, number>>((accumulator, task) => {
      if (task.status !== "Pending" || task.date.length < 7) {
        return accumulator;
      }

      const monthKey = task.date.slice(0, 7);
      accumulator[monthKey] = (accumulator[monthKey] ?? 0) + 1;

      return accumulator;
    }, {});

    const referenceMonth = new Date();
    referenceMonth.setDate(1);
    referenceMonth.setHours(0, 0, 0, 0);

    const baseRows = monthlyData.map((entry, index) => {
      const monthDate = new Date(referenceMonth);
      monthDate.setMonth(referenceMonth.getMonth() - (monthlyData.length - 1 - index));

      const year = monthDate.getFullYear();
      const monthNumber = String(monthDate.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${monthNumber}`;
      const tasksCount = entry.tasks ?? 0;
      const resolvedCount = entry.resolved ?? 0;
      const pendingCount = pendingByMonth[key] ?? 0;

      return {
        key,
        label: `${entry.month} ${year}`,
        month: entry.month,
        tasks: tasksCount,
        resolved: resolvedCount,
        pending: pendingCount,
        completionRate: tasksCount > 0 ? Math.round((resolvedCount / tasksCount) * 100) : 0,
        variancePct: 0,
      };
    });

    const averageTasks =
      baseRows.reduce((sum, row) => sum + row.tasks, 0) / Math.max(baseRows.length, 1);

    return baseRows.map((row) => ({
      ...row,
      variancePct:
        averageTasks > 0 ? ((row.tasks - averageTasks) / averageTasks) * 100 : 0,
    }));
  }, [monthlyData, tasks]);

  const monthlySummary = useMemo(() => {
    if (monthlyKpiRows.length === 0) {
      return {
        monthsAnalyzed: 0,
        averageTasks: 0,
        averageResolved: 0,
        averagePending: 0,
        currentMonthLabel: "Current month",
        currentMonthTasks: 0,
        monthOverMonthPct: 0,
        currentVsAveragePct: 0,
        busiestMonthLabel: "N/A",
        busiestMonthTasks: 0,
      };
    }

    const monthsAnalyzed = monthlyKpiRows.length;
    const totalTasks = monthlyKpiRows.reduce((sum, row) => sum + row.tasks, 0);
    const totalResolved = monthlyKpiRows.reduce((sum, row) => sum + row.resolved, 0);
    const totalPending = monthlyKpiRows.reduce((sum, row) => sum + row.pending, 0);

    const averageTasks = totalTasks / monthsAnalyzed;
    const averageResolved = totalResolved / monthsAnalyzed;
    const averagePending = totalPending / monthsAnalyzed;

    const currentMonth = monthlyKpiRows[monthsAnalyzed - 1];
    const previousMonth = monthsAnalyzed > 1 ? monthlyKpiRows[monthsAnalyzed - 2] : null;

    const monthOverMonthPct = previousMonth
      ? previousMonth.tasks > 0
        ? ((currentMonth.tasks - previousMonth.tasks) / previousMonth.tasks) * 100
        : currentMonth.tasks > 0
        ? 100
        : 0
      : 0;

    const currentVsAveragePct =
      averageTasks > 0 ? ((currentMonth.tasks - averageTasks) / averageTasks) * 100 : 0;

    const busiestMonth = monthlyKpiRows.reduce((best, current) =>
      current.tasks > best.tasks ? current : best
    );

    return {
      monthsAnalyzed,
      averageTasks,
      averageResolved,
      averagePending,
      currentMonthLabel: currentMonth.label,
      currentMonthTasks: currentMonth.tasks,
      monthOverMonthPct,
      currentVsAveragePct,
      busiestMonthLabel: busiestMonth.label,
      busiestMonthTasks: busiestMonth.tasks,
    };
  }, [monthlyKpiRows]);

  const pendingNotices = useMemo<PendingTaskNotice[]>(() => {
    const now = new Date();

    const priorityWeight: Record<Task["priority"], number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    return tasks
      .filter((task) => task.status === "Pending")
      .map((task) => {
        const dueAt = parseDueAt(task);

        if (!dueAt) {
          return null;
        }

        const minuteOffset = Math.floor((now.getTime() - dueAt.getTime()) / 60000);
        const dueToday =
          dueAt.getFullYear() === now.getFullYear() &&
          dueAt.getMonth() === now.getMonth() &&
          dueAt.getDate() === now.getDate();

        const urgencyLevel: PendingTaskNotice["urgencyLevel"] =
          minuteOffset > 0 ? "overdue" : dueToday ? "today" : "upcoming";

        const urgencyScore =
          (urgencyLevel === "overdue" ? 5000 : urgencyLevel === "today" ? 2500 : 1000) +
          priorityWeight[task.priority] * 100 -
          Math.abs(minuteOffset);

        return {
          ...task,
          dueAt,
          minuteOffset,
          urgencyLevel,
          urgencyScore,
        };
      })
      .filter((task): task is PendingTaskNotice => task !== null)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [tasks]);

  const overdueCount = pendingNotices.filter((task) => task.urgencyLevel === "overdue").length;
  const dueTodayCount = pendingNotices.filter((task) => task.urgencyLevel === "today").length;
  const attentionNowCount = overdueCount + dueTodayCount;

  const colors = useMemo(
    () => ({
      border: "#e5e7eb",
      primary: "#f59e0b",
      accent: "#10b981",
      muted: "#3b82f6",
      foreground: "#1f2937",
      card: "#ffffff",
      mutedForeground: "#6b7280",
    }),
    []
  );

  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const chartColors = isDark
    ? {
        ...colors,
        border: "#262626",
        foreground: "#f3f4f6",
        card: "#1f2937",
        mutedForeground: "#d1d5db",
      }
    : colors;

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
      >
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-foreground">Monthly KPI Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Average task volume per month with pending-task notification insights.
          </p>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Tasks / Month</p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{monthlySummary.averageTasks.toFixed(1)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on {monthlySummary.monthsAnalyzed} recent months
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Resolved / Month</p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">{monthlySummary.averageResolved.toFixed(1)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sustained completion throughput
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Pending / Month</p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <ListTodo className="w-4 h-4 text-amber-500" />
                <span className="text-2xl font-bold">{monthlySummary.averagePending.toFixed(1)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Unresolved task load trend
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Current vs Average</p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <CalendarRange className="w-4 h-4 text-blue-500" />
                <span
                  className={cn(
                    "text-2xl font-bold",
                    monthlySummary.currentVsAveragePct >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatSignedPercent(monthlySummary.currentVsAveragePct, 1)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {monthlySummary.currentMonthLabel}
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            <div className="xl:col-span-2 bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Monthly Tasks vs Resolution
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyKpiRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                  <XAxis
                    dataKey="month"
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.card,
                      border: `1px solid ${chartColors.border}`,
                      borderRadius: "8px",
                      color: chartColors.foreground,
                    }}
                    labelStyle={{ color: chartColors.foreground }}
                    formatter={(value: number, name: string) => {
                      if (name === "pending") {
                        return [value, "Pending"];
                      }

                      return [value, name === "tasks" ? "Tasks" : "Resolved"];
                    }}
                  />
                  <ReferenceLine
                    y={monthlySummary.averageTasks}
                    stroke={chartColors.muted}
                    strokeDasharray="6 6"
                    label={{
                      value: `Avg ${monthlySummary.averageTasks.toFixed(1)}`,
                      fill: chartColors.mutedForeground,
                      position: "insideTopRight",
                    }}
                  />
                  <Bar dataKey="tasks" fill={chartColors.primary} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="resolved" fill={chartColors.accent} radius={[8, 8, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke={chartColors.muted}
                    strokeWidth={2}
                    dot={{ fill: chartColors.muted, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-primary" />
                Pending Notifications
              </h2>
              <p className="text-sm text-muted-foreground">
                {attentionNowCount} tasks need attention now ({overdueCount} overdue, {dueTodayCount} due today).
              </p>

              {pendingNotices.length === 0 ? (
                <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                  No pending tasks with schedule data.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendingNotices.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-lg border p-3",
                        task.urgencyLevel === "overdue"
                          ? "border-red-300/70 bg-red-500/5"
                          : task.urgencyLevel === "today"
                          ? "border-amber-300/70 bg-amber-500/5"
                          : "border-border bg-background"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary">{task.id}</p>
                          <p className="line-clamp-1 text-sm text-foreground">{task.description}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">{task.priority}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="w-3.5 h-3.5" />
                          <span>
                            {DATE_FORMATTER.format(task.dueAt)} at {TIME_FORMATTER.format(task.dueAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>{formatTaskSchedule(task)}</span>
                          <span className="text-border">|</span>
                          <span
                            className={cn(
                              task.urgencyLevel === "overdue" && "font-semibold text-red-600",
                              task.urgencyLevel === "today" && "font-semibold text-amber-600"
                            )}
                          >
                            {formatTimingLabel(task.minuteOffset)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Monthly KPI Breakdown</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Month-by-month comparison against average monthly task volume.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                Busiest: {monthlySummary.busiestMonthLabel} ({monthlySummary.busiestMonthTasks} tasks)
              </span>
            </div>

            {monthlyKpiRows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No monthly task trend data yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Month</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tasks</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Resolved</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Pending</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Completion</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vs Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlyKpiRows.map((row) => (
                      <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{row.label}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{row.tasks}</td>
                        <td className="px-6 py-4 text-sm text-green-700 dark:text-green-400">{row.resolved}</td>
                        <td className="px-6 py-4 text-sm text-amber-700 dark:text-amber-400">{row.pending}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{row.completionRate}%</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={cn(
                              "rounded px-2 py-1 text-xs font-semibold",
                              row.variancePct >= 0
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            )}
                          >
                            {formatSignedPercent(row.variancePct, 1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
