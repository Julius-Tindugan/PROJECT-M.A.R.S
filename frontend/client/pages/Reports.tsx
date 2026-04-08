import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Calendar, TrendingUp, PieChartIcon, BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  api,
  type WeeklyTrend,
  type MonthlyTrend,
  type CategoryDistribution,
  type DepartmentRanking,
  type DashboardStats,
} from "@/lib/api";

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

type TimeRange = "weekly" | "monthly";

export default function Reports() {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrend[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentRanking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [weekly, monthly, categories, departments, dashStats] = await Promise.all([
        api.getWeeklyTrends(),
        api.getMonthlyTrends(),
        api.getCategoryDistribution(),
        api.getDepartmentRankings(),
        api.getDashboardStats(),
      ]);

      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setCategoryData(categories);
      setDepartmentData(departments);
      setStats(dashStats);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const trendData = timeRange === "weekly" ? weeklyData : monthlyData;
  const trendXKey = timeRange === "weekly" ? "day" : "month";

  // Chart colors
  const colors = useMemo(
    () => ({
      border: "#e5e7eb",
      primary: "#f59e0b",
      accent: "#3b82f6",
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

  // Calculate completion rate for display
  const completionRate = Math.round(
    (stats.completed / stats.totalTasks) * 100
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analytics and insights from IT support data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeRange("weekly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                timeRange === "weekly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                timeRange === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Monthly
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* KPI Summary */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Task Volume</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalTasks}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {completionRate}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.dailyAverage}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <PieChartIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Issue</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats.mostFrequentIssue}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row 1 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Task Trend Chart */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {timeRange === "weekly" ? "Weekly" : "Monthly"} Task Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                  <XAxis
                    dataKey={trendXKey}
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
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Categorical Breakdown
              </h2>
              <div className="flex flex-col items-center">
                {/* Pie Chart */}
                <div className="w-full max-w-[280px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={90}
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
                        formatter={(value: number, name: string, props: any) => {
                          const category = props.payload.category;
                          const percentage = props.payload.percentage;
                          return [`${value} tasks (${percentage}%)`, category];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend - Horizontal Grid */}
                <div className="w-full mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categoryData.map((category) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                      title={`${category.category}: ${category.count} tasks`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {category.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.percentage}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts Row 2 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Department Report Volume */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Department Report Volume
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={departmentData.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                  <XAxis
                    type="number"
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    dataKey="department"
                    type="category"
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "11px" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.card,
                      border: `1px solid ${chartColors.border}`,
                      borderRadius: "8px",
                      color: chartColors.foreground,
                    }}
                  />
                  <Bar
                    dataKey="totalReports"
                    name="Total Reports"
                    fill={chartColors.primary}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Recurring Issues */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top Recurring Issues
              </h2>
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {index + 1}. {category.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {category.count} tasks ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Insight Box */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Insight:</span>{" "}
                  <span className="text-muted-foreground">
                    Printer issues account for {categoryData[0].percentage}% of all
                    tasks. Consider hardware upgrade or preventive maintenance program.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Departmental Load Analysis */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg p-6 border border-border shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Departmental Load Analysis
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Identifying high-maintenance departments for better resource allocation
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Total Reports
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Resolved
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      In Progress
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Avg. Resolution
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Load Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departmentData.map((dept) => (
                    <tr key={dept.department} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {dept.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-semibold">
                        {dept.totalReports}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
                          {dept.resolved}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                          {dept.inProgress}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                          {dept.pending}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {dept.avgResolutionTime}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
