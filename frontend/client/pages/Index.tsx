import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Plus,
  Clock,
  Bell,
  CalendarDays,
  ListTodo,
  Target,
  TriangleAlert,
  PieChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { TaskCalendarSection } from "@/components/TaskCalendarSection";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  api,
  CategoryDistribution,
  DashboardStats,
  DepartmentRanking,
  MonthlyTrend,
  Task,
  WeeklyTrend,
} from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const defaultDashboardStats: DashboardStats = {
  totalTasks: 0,
  totalTasksTrend: "0% from last month",
  mostFrequentIssue: "N/A",
  mostFrequentIssueCount: 0,
  topDepartment: "N/A",
  topDepartmentReports: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  completionRate: 0,
  avgResponseTime: "N/A",
  dailyAverage: 0,
  resolutionRate: "0%",
  customerSatisfaction: "N/A",
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

const formatClockTime = (timeValue: string): string => {
  if (!timeValue) {
    return "Time not set";
  }

  const [hourString, minuteString] = timeValue.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

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

const parseTaskDueAt = (task: Task): Date | null => {
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

const formatSignedPercent = (value: number, digits = 0): string => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : "";

  return `${sign}${rounded}%`;
};

interface FulfillmentDepartment extends DepartmentRanking {
  completionRate: number;
  backlogCount: number;
  backlogRate: number;
}

interface PendingTaskAlert extends Task {
  dueAt: Date;
  minuteOffset: number;
  urgencyLevel: "overdue" | "today" | "upcoming";
  urgencyScore: number;
}

interface MonthlyKpiPoint {
  key: string;
  label: string;
  month: string;
  tasks: number;
  resolved: number;
  pending: number;
  completionRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultDashboardStats);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrend[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [departmentRankings, setDepartmentRankings] = useState<DepartmentRanking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        statsData,
        weeklyTrendData,
        monthlyTrendData,
        categoryDistributionData,
        departmentRankingsData,
        taskData,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getWeeklyTrends(),
        api.getMonthlyTrends(),
        api.getCategoryDistribution(),
        api.getDepartmentRankings(),
        api.getTasks(),
      ]);

      setStats(statsData);
      setWeeklyData(weeklyTrendData);
      setMonthlyData(monthlyTrendData);
      setCategoryData(categoryDistributionData);
      setDepartmentRankings(departmentRankingsData);
      setTasks(taskData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const topFulfillmentDepartments = useMemo<FulfillmentDepartment[]>(() => {
    return departmentRankings
      .map((department) => {
        const completionRate =
          department.totalReports > 0
            ? Math.round((department.resolved / department.totalReports) * 100)
            : 0;
        const backlogCount = department.pending + department.inProgress;
        const backlogRate =
          department.totalReports > 0
            ? Math.round((backlogCount / department.totalReports) * 100)
            : 0;

        return {
          ...department,
          completionRate,
          backlogCount,
          backlogRate,
        };
      })
      .sort((a, b) => {
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }

        if (a.backlogCount !== b.backlogCount) {
          return a.backlogCount - b.backlogCount;
        }

        return b.totalReports - a.totalReports;
      });
  }, [departmentRankings]);

  const departmentFulfillmentData = useMemo(
    () =>
      topFulfillmentDepartments.slice(0, 6).map((department) => ({
        dept:
          department.department.length > 15
            ? `${department.department.substring(0, 15)}...`
            : department.department,
        completionRate: department.completionRate,
        backlogCount: department.backlogCount,
      })),
    [topFulfillmentDepartments]
  );

  const monthlyKpiSeries = useMemo<MonthlyKpiPoint[]>(() => {
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

    return monthlyData.map((entry, index) => {
      const monthDate = new Date(referenceMonth);
      monthDate.setMonth(
        referenceMonth.getMonth() - (monthlyData.length - 1 - index)
      );

      const year = monthDate.getFullYear();
      const monthNumber = String(monthDate.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${monthNumber}`;
      const tasksCount = entry.tasks ?? 0;
      const resolvedCount = entry.resolved ?? 0;
      const pendingCount = pendingByMonth[monthKey] ?? 0;

      return {
        key: monthKey,
        label: `${entry.month} ${year}`,
        month: entry.month,
        tasks: tasksCount,
        resolved: resolvedCount,
        pending: pendingCount,
        completionRate:
          tasksCount > 0 ? Math.round((resolvedCount / tasksCount) * 100) : 0,
      };
    });
  }, [monthlyData, tasks]);

  const monthlyKpiSummary = useMemo(() => {
    if (monthlyKpiSeries.length === 0) {
      return {
        monthsAnalyzed: 0,
        averageTasks: 0,
        averageResolved: 0,
        averagePending: 0,
        currentMonthLabel: "Current month",
        currentMonthTasks: 0,
        currentMonthPending: 0,
        monthOverMonthPct: 0,
        currentVsAveragePct: 0,
        busiestMonthLabel: "N/A",
        busiestMonthTasks: 0,
      };
    }

    const monthsAnalyzed = monthlyKpiSeries.length;
    const totals = monthlyKpiSeries.reduce(
      (accumulator, month) => {
        accumulator.tasks += month.tasks;
        accumulator.resolved += month.resolved;
        accumulator.pending += month.pending;

        return accumulator;
      },
      { tasks: 0, resolved: 0, pending: 0 }
    );

    const averageTasks = totals.tasks / monthsAnalyzed;
    const averageResolved = totals.resolved / monthsAnalyzed;
    const averagePending = totals.pending / monthsAnalyzed;

    const currentMonth = monthlyKpiSeries[monthsAnalyzed - 1];
    const previousMonth =
      monthsAnalyzed > 1 ? monthlyKpiSeries[monthsAnalyzed - 2] : null;
    const busiestMonth = monthlyKpiSeries.reduce((best, current) =>
      current.tasks > best.tasks ? current : best
    );

    const monthOverMonthPct = previousMonth
      ? previousMonth.tasks > 0
        ? ((currentMonth.tasks - previousMonth.tasks) / previousMonth.tasks) * 100
        : currentMonth.tasks > 0
        ? 100
        : 0
      : 0;

    const currentVsAveragePct =
      averageTasks > 0
        ? ((currentMonth.tasks - averageTasks) / averageTasks) * 100
        : 0;

    return {
      monthsAnalyzed,
      averageTasks,
      averageResolved,
      averagePending,
      currentMonthLabel: currentMonth.label,
      currentMonthTasks: currentMonth.tasks,
      currentMonthPending: currentMonth.pending,
      monthOverMonthPct,
      currentVsAveragePct,
      busiestMonthLabel: busiestMonth.label,
      busiestMonthTasks: busiestMonth.tasks,
    };
  }, [monthlyKpiSeries]);

  const pendingTaskAlerts = useMemo<PendingTaskAlert[]>(() => {
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
        const dueAt = parseTaskDueAt(task);

        if (!dueAt) {
          return null;
        }

        const minuteOffset = Math.floor((now.getTime() - dueAt.getTime()) / 60000);
        const dueToday =
          dueAt.getFullYear() === now.getFullYear() &&
          dueAt.getMonth() === now.getMonth() &&
          dueAt.getDate() === now.getDate();

        const urgencyLevel: PendingTaskAlert["urgencyLevel"] =
          minuteOffset > 0 ? "overdue" : dueToday ? "today" : "upcoming";

        const urgencyScore =
          (urgencyLevel === "overdue"
            ? 5000
            : urgencyLevel === "today"
            ? 2500
            : 1000) +
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
      .filter((task): task is PendingTaskAlert => task !== null)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [tasks]);

  const overduePendingTasks = pendingTaskAlerts.filter((task) => task.urgencyLevel === "overdue");
  const dueTodayPendingTasks = pendingTaskAlerts.filter((task) => task.urgencyLevel === "today");
  const upcomingPendingTasks = pendingTaskAlerts.filter((task) => task.urgencyLevel === "upcoming");

  const overduePendingCount = overduePendingTasks.length;
  const dueTodayPendingCount = dueTodayPendingTasks.length;
  const attentionPendingCount = overduePendingCount + dueTodayPendingCount;

  // Get colors for chart
  const colors = useMemo(
    () => ({
      border: "#e5e7eb",
      primary: "#f59e0b",
      accent: "#10b981",
      foreground: "#1f2937",
      card: "#ffffff",
      mutedForeground: "#6b7280",
    }),
    []
  );

  // Update colors for dark mode
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              M.A.R.S Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Maintenance, Analytics, & Recording System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input",
                    "text-foreground transition-all hover:bg-muted"
                  )}
                  aria-label="Pending task notifications"
                >
                  <Bell className="w-5 h-5" />
                  {pendingTaskAlerts.length > 0 && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                        overduePendingCount > 0 ? "bg-red-500" : "bg-amber-500"
                      )}
                    >
                      {pendingTaskAlerts.length > 99 ? "99+" : pendingTaskAlerts.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[420px] p-0">
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Pending Alert Center</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {pendingTaskAlerts.length} pending
                      </Badge>
                      {attentionPendingCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {attentionPendingCount} attention now
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Includes task date, schedule time, and urgency level for quick triage.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-center">
                      <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">Overdue</p>
                      <p className="text-sm font-bold text-foreground">{overduePendingCount}</p>
                    </div>
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-center">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Due Today</p>
                      <p className="text-sm font-bold text-foreground">{dueTodayPendingCount}</p>
                    </div>
                    <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-center">
                      <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Upcoming</p>
                      <p className="text-sm font-bold text-foreground">{upcomingPendingTasks.length}</p>
                    </div>
                  </div>
                </div>

                {pendingTaskAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No pending tasks right now. Great work.
                  </div>
                ) : (
                  <ScrollArea className="h-[360px]">
                    <div className="space-y-4 p-3">
                      {[
                        {
                          title: "Overdue",
                          tasks: overduePendingTasks,
                          badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400",
                        },
                        {
                          title: "Due Today",
                          tasks: dueTodayPendingTasks,
                          badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        },
                        {
                          title: "Upcoming",
                          tasks: upcomingPendingTasks,
                          badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                        },
                      ].map((section) => {
                        if (section.tasks.length === 0) {
                          return null;
                        }

                        return (
                          <div key={section.title}>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {section.title}
                              </p>
                              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", section.badgeClass)}>
                                {section.tasks.length}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {section.tasks.slice(0, 5).map((task) => {
                                const scheduleLabel = formatTaskSchedule(task);
                                const timingLabel = formatTimingLabel(task.minuteOffset);

                                return (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "rounded-lg border px-3 py-2.5",
                                      task.urgencyLevel === "overdue"
                                        ? "border-red-300/70 bg-red-500/5"
                                        : task.urgencyLevel === "today"
                                        ? "border-amber-300/70 bg-amber-500/5"
                                        : "border-border bg-card"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-primary">{task.id}</p>
                                        <p className="line-clamp-1 text-sm text-foreground">{task.description}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {task.department} - {task.category}
                                        </p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "shrink-0 text-[10px]",
                                          task.priority === "Critical" && "border-red-300 text-red-600",
                                          task.priority === "High" && "border-orange-300 text-orange-600",
                                          task.priority === "Medium" && "border-amber-300 text-amber-600",
                                          task.priority === "Low" && "border-green-300 text-green-600"
                                        )}
                                      >
                                        {task.priority}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>
                                          {DATE_FORMATTER.format(task.dueAt)} at {TIME_FORMATTER.format(task.dueAt)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{scheduleLabel}</span>
                                        <span className="text-border">|</span>
                                        <span
                                          className={cn(
                                            task.urgencyLevel === "overdue" && "font-semibold text-red-600",
                                            task.urgencyLevel === "today" && "font-semibold text-amber-600"
                                          )}
                                        >
                                          {timingLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                <div className="border-t border-border p-3">
                  <Link
                    to="/task-logs"
                    className="block rounded-md bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Open Task Logs
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
            <Link
              to="/record-task"
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-md hover:shadow-lg"
              )}
            >
              <Plus className="w-5 h-5" />
              Record Task
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* KPI Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KPICard
              title="Current Month Tasks"
              value={monthlyKpiSummary.currentMonthTasks}
              icon={Activity}
              trend={
                monthlyKpiSummary.monthsAnalyzed > 1
                  ? `${formatSignedPercent(monthlyKpiSummary.monthOverMonthPct)} vs previous month`
                  : "Waiting for previous-month data"
              }
              trendUp={monthlyKpiSummary.monthOverMonthPct >= 0}
            />
            <KPICard
              title="Average Tasks / Month"
              value={monthlyKpiSummary.averageTasks.toFixed(1)}
              icon={TrendingUp}
              trend={`Across ${monthlyKpiSummary.monthsAnalyzed || 0} months`}
              trendUp={monthlyKpiSummary.currentVsAveragePct >= 0}
            />
            <KPICard
              title="Average Resolved / Month"
              value={monthlyKpiSummary.averageResolved.toFixed(1)}
              icon={CheckCircle2}
              trend={`${monthlyKpiSummary.currentMonthLabel}: ${monthlyKpiSeries[monthlyKpiSeries.length - 1]?.completionRate ?? 0}% completion`}
              trendUp={(monthlyKpiSeries[monthlyKpiSeries.length - 1]?.completionRate ?? 0) >= 75}
            />
            <KPICard
              title="Average Pending / Month"
              value={monthlyKpiSummary.averagePending.toFixed(1)}
              icon={AlertCircle}
              trend={`${monthlyKpiSummary.currentMonthPending} pending this month`}
              trendUp={monthlyKpiSummary.currentMonthPending <= monthlyKpiSummary.averagePending}
            />
          </motion.div>

          {attentionPendingCount > 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Pending tasks need immediate attention
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {overduePendingCount} overdue and {dueTodayPendingCount} due today based on task date and schedule time.
                    </p>
                  </div>
                </div>
                <Link
                  to="/task-logs"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Review Pending Tasks
                </Link>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  Pending Task Watchlist
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Prioritized list of pending tasks with date, schedule time, and urgency
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{pendingTaskAlerts.length} pending</Badge>
                {overduePendingCount > 0 && (
                  <Badge variant="destructive">{overduePendingCount} overdue</Badge>
                )}
                {dueTodayPendingCount > 0 && (
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400" variant="outline">
                    {dueTodayPendingCount} due today
                  </Badge>
                )}
              </div>
            </div>

            {pendingTaskAlerts.length === 0 ? (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400">
                No pending tasks with dates. Fulfillment queue is clear.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendingTaskAlerts.slice(0, 8).map((task) => {
                  const timingLabel = formatTimingLabel(task.minuteOffset);
                  const scheduleLabel = formatTaskSchedule(task);

                  return (
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
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.department} - {task.category}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            task.priority === "Critical" && "border-red-300 text-red-600",
                            task.priority === "High" && "border-orange-300 text-orange-600",
                            task.priority === "Medium" && "border-amber-300 text-amber-600",
                            task.priority === "Low" && "border-green-300 text-green-600"
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>
                          {DATE_FORMATTER.format(task.dueAt)} at {TIME_FORMATTER.format(task.dueAt)}
                        </span>
                        <span className="text-border">|</span>
                        <span
                          className={cn(
                            task.urgencyLevel === "overdue" && "font-semibold text-red-600",
                            task.urgencyLevel === "today" && "font-semibold text-amber-600"
                          )}
                        >
                          {timingLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{scheduleLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Link
                to="/task-logs"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View full task fulfillment queue
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <TaskCalendarSection tasks={tasks} />
          </motion.div>

          {/* Charts Section - Row 1 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Weekly Trend Chart */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Task Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.border}
                  />
                  <XAxis
                    dataKey="day"
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
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Total Tasks"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke={chartColors.accent}
                    strokeWidth={2}
                    dot={{ fill: chartColors.accent, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Categorical Breakdown Pie Chart */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Categorical Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) =>
                      `${category}: ${percentage}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.card,
                      border: `1px solid ${chartColors.border}`,
                      borderRadius: "8px",
                      color: chartColors.foreground,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} tasks`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Charts Section - Row 2 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Department Fulfillment Chart */}
            <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Department Fulfillment Rate
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={departmentFulfillmentData}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.border}
                  />
                  <XAxis
                    type="number"
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    dataKey="dept"
                    type="category"
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "11px" }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.card,
                      border: `1px solid ${chartColors.border}`,
                      borderRadius: "8px",
                      color: chartColors.foreground,
                    }}
                    labelStyle={{ color: chartColors.foreground }}
                    formatter={(value: number, _name: string, props: any) => {
                      const backlog = props?.payload?.backlogCount ?? 0;
                      return [`${value}% completion`, `Backlog: ${backlog}`];
                    }}
                  />
                  <Bar
                    dataKey="completionRate"
                    name="Fulfillment"
                    fill={chartColors.accent}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Avg Response Time
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats.avgResponseTime}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Daily Average
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats.dailyAverage} tasks
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats.inProgress} tasks
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Monthly KPI Insights */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Monthly KPI Insights
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Average monthly workload, resolution pace, and pending-task pressure.
                </p>
              </div>
              <Link
                to="/rankings"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Open KPI Analytics
              </Link>
            </div>

            {monthlyKpiSeries.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No monthly trend data available yet. Add more dated tasks to populate KPI insights.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3">
                <div className="space-y-3 border-b border-border p-6 xl:border-b-0 xl:border-r">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Average Tasks / Month
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {monthlyKpiSummary.averageTasks.toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on {monthlyKpiSummary.monthsAnalyzed} months of activity
                    </p>
                  </div>

                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Busiest Month
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {monthlyKpiSummary.busiestMonthLabel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {monthlyKpiSummary.busiestMonthTasks} tasks logged
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current vs Average
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold",
                        monthlyKpiSummary.currentVsAveragePct >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatSignedPercent(monthlyKpiSummary.currentVsAveragePct, 1)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {monthlyKpiSummary.currentMonthLabel}
                    </p>
                  </div>
                </div>

                <div className="xl:col-span-2 overflow-x-auto">
                  <table className="w-full min-w-[680px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Month</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tasks</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Resolved</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Pending</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Completion</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vs Avg</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Load Index</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {monthlyKpiSeries.map((month) => {
                        const variancePct =
                          monthlyKpiSummary.averageTasks > 0
                            ? ((month.tasks - monthlyKpiSummary.averageTasks) /
                                monthlyKpiSummary.averageTasks) *
                              100
                            : 0;

                        const loadRatio =
                          monthlyKpiSummary.busiestMonthTasks > 0
                            ? (month.tasks / monthlyKpiSummary.busiestMonthTasks) * 100
                            : 0;

                        return (
                          <tr key={month.key} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{month.label}</td>
                            <td className="px-6 py-4 text-sm text-foreground font-semibold">{month.tasks}</td>
                            <td className="px-6 py-4 text-sm text-green-700 dark:text-green-400">{month.resolved}</td>
                            <td className="px-6 py-4 text-sm text-amber-700 dark:text-amber-400">{month.pending}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{month.completionRate}%</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={cn(
                                  "rounded px-2 py-1 text-xs font-semibold",
                                  variancePct >= 0
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                                )}
                              >
                                {formatSignedPercent(variancePct, 1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{
                                    width: `${Math.max(8, Math.min(loadRatio, 100))}%`,
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
