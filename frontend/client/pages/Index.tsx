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
  Clock,
  Building2,
  PieChartIcon,
  AlertTriangle,
  Calendar,
  User,
  Zap,
  RefreshCw,
  History,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { QuickLogModal } from "@/components/QuickLogModal";
import { KPICard } from "@/components/KPICard";
import { PendingTasksNotification } from "@/components/PendingTasksNotification";
import { TaskCalendar } from "@/components/TaskCalendar";
import { cn } from "@/lib/utils";
import { api, type Task, type DashboardStats, type WeeklyTrend, type CategoryDistribution, type DepartmentRanking } from "@/lib/api";

// Helper function to calculate task duration
const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "N/A";
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

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

export default function Dashboard() {
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [departmentRankings, setDepartmentRankings] = useState<DepartmentRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all dashboard data from API
  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [tasksResponse, statsData, weeklyTrends, categoryDist, deptRankings] = await Promise.all([
        api.getTasks({ paginate: false }),
        api.getDashboardStats(),
        api.getWeeklyTrends(),
        api.getCategoryDistribution(),
        api.getDepartmentRankings(),
      ]);

      // Extract tasks from response
      const loadedTasks = 'data' in tasksResponse ? tasksResponse.data : [];
      setTasks(loadedTasks);
      setRecentTasks(loadedTasks.slice(0, 8));
      setStats(statsData);
      setWeeklyData(weeklyTrends);
      setCategoryData(categoryDist);
      setDepartmentRankings(deptRankings);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshTasks, 30000);
    return () => clearInterval(interval);
  }, [refreshTasks]);

  // Handle new task added from QuickLogModal
  const handleTaskAdded = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    setRecentTasks((prev) => [newTask, ...prev.slice(0, 7)]);
    setLastUpdated(new Date());
    // Refresh stats after adding task
    refreshTasks();
  };

  // Calculate pending task metrics
  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.status === "Pending");
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pendingTasks.filter(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    });
  }, [pendingTasks]);

  const criticalPendingTasks = useMemo(() => {
    return pendingTasks.filter(t => t.priority === "Critical");
  }, [pendingTasks]);

  const todayPendingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pendingTasks.filter(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  }, [pendingTasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-700";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700";
    }
  };

  const isOverdue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return "Today";
    } else if (taskDate < today) {
      const daysOverdue = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Prepare department data for chart
  const departmentData = departmentRankings.slice(0, 6).map((dept) => ({
    dept: dept.department.length > 15
      ? dept.department.substring(0, 15) + "..."
      : dept.department,
    volume: dept.totalReports,
  }));

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
      {/* Loading State */}
      {isLoading && !stats && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {stats && (
        <>
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
            <PendingTasksNotification />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsQuickLogOpen(true)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-md hover:shadow-lg"
              )}
            >
              <Zap className="w-5 h-5" />
              Record Task
            </motion.button>
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
              title="Task Volume (Monthly)"
              value={String(stats.totalTasks)}
              icon={Activity}
              trend={stats.totalTasksTrend}
              trendUp={true}
            />
            <KPICard
              title="Top Recurring Issue"
              value={stats.mostFrequentIssue}
              icon={AlertCircle}
              trend={`${stats.mostFrequentIssueCount} cases this month`}
            />
            <KPICard
              title="Pending Tasks Alert"
              value={String(pendingTasks.length)}
              icon={AlertTriangle}
              trend={overdueTasks.length > 0
                ? `${overdueTasks.length} overdue | ${criticalPendingTasks.length} critical`
                : `${todayPendingTasks.length} due today`
              }
              trendUp={false}
            />
            <KPICard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={CheckCircle2}
              trend={`${stats.completed} completed / ${stats.pending + stats.inProgress} pending`}
              trendUp={true}
            />
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
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
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

                {/* Custom Legend */}
                <div className="w-full mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {categoryData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground truncate flex-1" title={entry.category}>
                        {entry.category}
                      </span>
                      <span className="font-medium text-foreground">
                        {entry.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Task Fulfillment Dashboard */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Task Fulfillment Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overview of pending tasks requiring attention
                  </p>
                </div>
                <Link
                  to="/task-logs"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View All Tasks
                </Link>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
                        Overdue
                      </p>
                      <p className="text-3xl font-bold text-red-700 dark:text-red-400 mt-1">
                        {overdueTasks.length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
                        Due Today
                      </p>
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                        {todayPendingTasks.length}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400 opacity-50" />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
                        Critical Priority
                      </p>
                      <p className="text-3xl font-bold text-red-700 dark:text-red-400 mt-1">
                        {criticalPendingTasks.length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                        Total Pending
                      </p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                        {pendingTasks.length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Tasks List */}
            {pendingTasks.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  All Caught Up!
                </h3>
                <p className="text-sm text-muted-foreground">
                  No pending tasks at the moment. Great job!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Task ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingTasks.slice(0, 10).map((task, index) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          isOverdue(task.date) && "bg-red-50/50 dark:bg-red-950/10"
                        )}
                      >
                        <td className="px-6 py-4">
                          <Link
                            to="/task-logs"
                            className="text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {task.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground line-clamp-2 max-w-md">
                            {task.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {task.department}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border",
                              getPriorityColor(task.priority)
                            )}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              isOverdue(task.date) && "text-red-600 dark:text-red-400 font-semibold"
                            )}
                          >
                            <Clock className="w-4 h-4" />
                            {formatDate(task.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {task.staffName}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {pendingTasks.length > 10 && (
                  <div className="p-4 border-t border-border bg-muted/20 text-center">
                    <Link
                      to="/task-logs"
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View {pendingTasks.length - 10} more pending tasks →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Tasks Calendar Section */}
          <motion.div variants={itemVariants}>
            <TaskCalendar tasks={tasks} onTaskUpdate={refreshTasks} />
          </motion.div>

          {/* Recent Tasks Section */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Recent Tasks
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Latest recorded IT maintenance activities
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    Updated {formatTimeAgo(lastUpdated.toISOString())}
                  </div>
                  <button
                    onClick={refreshTasks}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      "border border-input text-foreground hover:bg-muted hover:border-primary/50"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {recentTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Recent Tasks
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by recording your first task
                  </p>
                  <button
                    onClick={() => setIsQuickLogOpen(true)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    Quick Log
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {/* Left Column */}
                  <div className="divide-y divide-border">
                    {recentTasks.slice(0, 4).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-primary">
                                {task.id}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                getStatusColor(task.status)
                              )}>
                                {task.status}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                getPriorityColor(task.priority)
                              )}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{task.department}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.staffName}</span>
                              </div>
                              {task.startTime && task.endTime && (
                                <div className="flex items-center gap-1 text-primary font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>{calculateDuration(task.startTime, task.endTime)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatTimeAgo(task.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="divide-y divide-border">
                    {recentTasks.slice(4, 8).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (index + 4) * 0.05 }}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-primary">
                                {task.id}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                getStatusColor(task.status)
                              )}>
                                {task.status}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                getPriorityColor(task.priority)
                              )}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{task.department}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.staffName}</span>
                              </div>
                              {task.startTime && task.endTime && (
                                <div className="flex items-center gap-1 text-primary font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>{calculateDuration(task.startTime, task.endTime)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatTimeAgo(task.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {recentTasks.length <= 4 && recentTasks.length > 0 && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          {recentTasks.length < 4 ? "Record more tasks to see them here" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {recentTasks.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20 text-center">
                <Link
                  to="/task-logs"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All Task Logs →
                </Link>
              </div>
            )}
          </motion.div>

          {/* Department Report Volume & Quick Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Department Report Volume Chart */}
            <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Department Report Volume
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={departmentData}
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
                  />
                  <Bar
                    dataKey="volume"
                    name="Reports"
                    fill={chartColors.primary}
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
        </motion.div>
      </div>
      </>
      )}

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}
