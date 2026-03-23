import { useState, useMemo } from "react";
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
  Building2,
  PieChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { RecordTaskModal } from "@/components/RecordTaskModal";
import { KPICard } from "@/components/KPICard";
import { cn } from "@/lib/utils";
import {
  getDashboardStats,
  getWeeklyTrendData,
  getCategoryDistribution,
  getDepartmentRankings,
} from "@/lib/mockData";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get data from mock store
  const stats = getDashboardStats();
  const weeklyData = getWeeklyTrendData();
  const categoryData = getCategoryDistribution();
  const departmentRankings = getDepartmentRankings();

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
            <Link
              to="/quick-log"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                "border border-input text-foreground hover:bg-muted"
              )}
            >
              Quick Log
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-md hover:shadow-lg"
              )}
            >
              <Plus className="w-5 h-5" />
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
              title="Top Department"
              value={stats.topDepartment}
              icon={Building2}
              trend={`${stats.topDepartmentReports} reports`}
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

          {/* Departmental Leaderboard Preview */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Departmental Leaderboard
              </h2>
              <Link
                to="/rankings"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View Full Rankings
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Total Reports
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Resolved
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Heat Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departmentRankings.slice(0, 5).map((dept, index) => (
                    <motion.tr
                      key={dept.department}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            dept.rank === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : dept.rank === 2
                              ? "bg-gray-300 text-gray-700"
                              : dept.rank === 3
                              ? "bg-amber-600 text-amber-100"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {dept.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {dept.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">
                        {dept.totalReports}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
                          {dept.resolved}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            dept.heatLevel === "critical" &&
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            dept.heatLevel === "high" &&
                              "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                            dept.heatLevel === "medium" &&
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                            dept.heatLevel === "low" &&
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}
                        >
                          {dept.heatLevel.toUpperCase()}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Record Task Modal */}
      <RecordTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
