import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Flame, Award, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDepartmentRankings, getItemRankings } from "@/lib/mockData";

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

type ViewMode = "departments" | "items";

export default function Rankings() {
  const [viewMode, setViewMode] = useState<ViewMode>("departments");
  const departmentRankings = getDepartmentRankings();
  const itemRankings = getItemRankings();

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const totals = departmentRankings.reduce(
      (acc, dept) => ({
        resolved: acc.resolved + dept.resolved,
        pending: acc.pending + dept.pending,
        inProgress: acc.inProgress + dept.inProgress,
      }),
      { resolved: 0, pending: 0, inProgress: 0 }
    );
    return [
      { name: "Resolved", value: totals.resolved, color: "#10b981" },
      { name: "In Progress", value: totals.inProgress, color: "#3b82f6" },
      { name: "Pending", value: totals.pending, color: "#f59e0b" },
    ];
  }, [departmentRankings]);

  // Chart colors
  const colors = useMemo(
    () => ({
      border: "#e5e7eb",
      primary: "#f59e0b",
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

  const getHeatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getHeatBadge = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700";
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-700";
    if (rank === 3) return "bg-amber-600 text-amber-100";
    return "bg-primary text-primary-foreground";
  };

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
            <h1 className="text-3xl font-bold text-foreground">Rankings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Department and item report rankings with heat map
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("departments")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === "departments"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Departments
            </button>
            <button
              onClick={() => setViewMode("items")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === "items"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Items
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
          {/* Heat Map Legend */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg p-4 border border-border shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  Heat Map Legend
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-sm text-muted-foreground">
                    Critical (40+)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    High (30-39)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span className="text-sm text-muted-foreground">
                    Medium (20-29)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Low (&lt;20)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Reports by Department/Items */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {viewMode === "departments"
                  ? "Total Reports by Department"
                  : "Top Reported Items"}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    viewMode === "departments"
                      ? departmentRankings
                      : itemRankings
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.border}
                  />
                  <XAxis
                    dataKey={viewMode === "departments" ? "department" : "item"}
                    stroke={chartColors.mutedForeground}
                    style={{ fontSize: "10px" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
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
                  <Bar
                    dataKey={
                      viewMode === "departments" ? "totalReports" : "reportCount"
                    }
                    fill={chartColors.primary}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Overall Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
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
                    labelStyle={{ color: chartColors.foreground }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Heat Map Grid */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg p-6 border border-border shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Department Heat Map
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {departmentRankings.map((dept, index) => (
                <motion.div
                  key={dept.department}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative p-4 rounded-lg border border-border",
                    "hover:shadow-md transition-all cursor-pointer group"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-lg opacity-20",
                      getHeatColor(dept.heatLevel)
                    )}
                  />
                  <div className="relative">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {dept.department}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {dept.totalReports}
                    </p>
                    <span
                      className={cn(
                        "inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium",
                        getHeatBadge(dept.heatLevel)
                      )}
                    >
                      {dept.heatLevel.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Rankings Table */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-lg border border-border overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {viewMode === "departments"
                    ? "Department Leaderboard"
                    : "Items Leaderboard"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Ranked by report volume (highest to lowest)
              </p>
            </div>
            <div className="overflow-x-auto">
              {viewMode === "departments" ? (
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
                        In Progress
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Avg Resolution
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Heat Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {departmentRankings.map((dept, index) => (
                      <motion.tr
                        key={dept.department}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                getRankBadge(dept.rank)
                              )}
                            >
                              {dept.rank}
                            </div>
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
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                            {dept.inProgress}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                            {dept.pending}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {dept.avgResolutionTime}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              getHeatBadge(dept.heatLevel)
                            )}
                          >
                            {dept.heatLevel.toUpperCase()}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Report Count
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Last Reported
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {itemRankings.map((item, index) => (
                      <motion.tr
                        key={item.item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                getRankBadge(item.rank)
                              )}
                            >
                              {item.rank}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {item.item}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-semibold">
                          {item.reportCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.lastReported}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
