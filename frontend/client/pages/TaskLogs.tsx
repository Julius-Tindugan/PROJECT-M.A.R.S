import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Download, RefreshCw, Eye, User, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  api,
  Task,
  TaskStatus,
  calculateDuration,
} from "@/lib/api";

type SortKey = keyof Task;
type SortOrder = "asc" | "desc";

// Status options for dropdown
const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export default function TaskLogs() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [staffFilter, setStaffFilter] = useState<string>("All");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic data
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);

  const refreshTasks = async () => {
    setIsRefreshing(true);

    try {
      const taskData = await api.getTasks();
      setTasks(taskData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load task logs");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadFilterData = async () => {
    try {
      const [departmentData, categoryData, staffData] = await Promise.all([
        api.getDepartments(),
        api.getCategories(),
        api.getStaff(),
      ]);

      setDepartments(departmentData);
      setCategories(categoryData);
      setStaffList(staffData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load filter data");
    }
  };

  useEffect(() => {
    refreshTasks();
    loadFilterData();
  }, []);

  /**
   * Handle status change for a task
   * When status changes to "Completed":
   * - Auto-sets end time to current time if not already set
   * - If no start time exists, sets it to beginning of day
   * - Calculates and displays duration
   *
   */
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    let startTime = task.startTime;
    let endTime = task.endTime;

    if (newStatus === "Completed") {
      startTime = startTime || "08:00";
      endTime = endTime || currentTime;

      const duration = calculateDuration(startTime, endTime);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Task {taskId} Completed!</span>
          <span className="text-sm opacity-90">
            Duration: {duration} ({startTime} - {endTime})
          </span>
        </div>,
        { duration: 4000 }
      );
    } else if (newStatus === "In Progress" && !startTime) {
      startTime = currentTime;
      toast.success(`Task ${taskId} is now In Progress`, { duration: 2000 });
    } else if (newStatus === "Pending") {
      toast.info(`Task ${taskId} set to Pending`, { duration: 2000 });
    } else {
      toast.success(`Status updated to ${newStatus}`, { duration: 2000 });
    }

    try {
      const response = await api.updateTaskStatus(taskId, {
        status: newStatus,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === taskId ? response.task : currentTask
        )
      );

      if (selectedTask?.id === taskId) {
        setSelectedTask(response.task);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update task status");
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.staffName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || task.category === categoryFilter;

      const matchesDepartment =
        departmentFilter === "All" || task.department === departmentFilter;

      const matchesStaff =
        staffFilter === "All" || task.staffName === staffFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesStaff;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, sortKey, sortOrder, statusFilter, categoryFilter, departmentFilter, staffFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronsUpDown className="w-3 h-3" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  // Get status dropdown styling based on current status
  const getStatusSelectClass = (status: string) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none pr-6 bg-no-repeat bg-right";

    switch (status) {
      case "Completed":
        return cn(baseClass, "bg-green-100 text-green-700 border border-green-300 focus:ring-green-400 dark:bg-green-900/40 dark:text-green-400 dark:border-green-600");
      case "In Progress":
        return cn(baseClass, "bg-blue-100 text-blue-700 border border-blue-300 focus:ring-blue-400 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-600");
      case "Pending":
        return cn(baseClass, "bg-amber-100 text-amber-700 border border-amber-300 focus:ring-amber-400 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-600");
      default:
        return baseClass;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700";
      case "In Progress":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700";
      case "Pending":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    return timeStr;
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
            <h1 className="text-3xl font-bold text-foreground">Task Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all recorded IT maintenance tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshTasks}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border border-input text-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  )}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                )}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                )}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                )}
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Staff Filter */}
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                )}
              >
                <option value="All">All Staff</option>
                {staffList.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("id")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        ID {getSortIcon("id")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left min-w-[180px]">
                      <span className="text-xs font-semibold text-foreground">
                        Description
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("department")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Department {getSortIcon("department")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("category")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Category {getSortIcon("category")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("staffName")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Staff {getSortIcon("staffName")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("priority")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Priority {getSortIcon("priority")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Status {getSortIcon("status")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        Date {getSortIcon("date")}
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <span className="text-xs font-semibold text-foreground">
                        Duration
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left">
                      <span className="text-xs font-semibold text-foreground">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAndSortedTasks.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-xs font-medium text-primary">
                        {task.id}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        <div className="line-clamp-2 max-w-[180px]">{task.description}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        <div className="max-w-[120px] truncate">{task.department}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        {task.category}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {task.staffName}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-xs font-medium",
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      {/* Interactive Status Dropdown */}
                      <td className="px-3 py-2.5">
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={getStatusSelectClass(task.status)}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                              backgroundPosition: "right 4px center",
                            }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(task.date)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground whitespace-nowrap">
                        {task.startTime && task.endTime ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="font-medium text-primary">
                              {calculateDuration(task.startTime, task.endTime)}
                            </span>
                          </div>
                        ) : task.startTime ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
                            <span className="text-muted-foreground italic">
                              In progress...
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedTasks.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-muted-foreground">No tasks found matching your filters</p>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
            </span>
            <span>
              {tasks.filter((t) => t.status === "Completed").length} completed |{" "}
              {tasks.filter((t) => t.status === "In Progress").length} in progress |{" "}
              {tasks.filter((t) => t.status === "Pending").length} pending
            </span>
          </div>
        </motion.div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTask(null)}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full border border-border max-h-[90vh] overflow-auto">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Task Details - {selectedTask.id}
                </h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <p className="text-sm text-foreground mt-1">{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Department
                    </label>
                    <p className="text-sm text-foreground mt-1">{selectedTask.department}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Category
                    </label>
                    <p className="text-sm text-foreground mt-1">{selectedTask.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Staff Name
                    </label>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                      <User className="w-4 h-4 text-primary" />
                      {selectedTask.staffName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Priority
                    </label>
                    <p className="mt-1">
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor(selectedTask.priority))}>
                        {selectedTask.priority}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </label>
                    <div className="mt-2">
                      <select
                        value={selectedTask.status}
                        onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                        className={cn(
                          getStatusSelectClass(selectedTask.status),
                          "text-sm py-1.5"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundPosition: "right 6px center",
                        }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Date
                    </label>
                    <p className="text-sm text-foreground mt-1">{formatDate(selectedTask.date)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Start Time
                    </label>
                    <p className="text-sm text-foreground mt-1">{formatTime(selectedTask.startTime)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      End Time
                    </label>
                    <p className="text-sm text-foreground mt-1">{formatTime(selectedTask.endTime)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Duration
                    </label>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {selectedTask.startTime && selectedTask.endTime
                        ? calculateDuration(selectedTask.startTime, selectedTask.endTime)
                        : "-"}
                    </p>
                  </div>
                </div>
                {selectedTask.remarks && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Remarks
                    </label>
                    <p className="text-sm text-foreground mt-1 p-3 rounded-lg bg-muted/50 border border-border">
                      {selectedTask.remarks}
                    </p>
                  </div>
                )}

                {/* Quick Complete Button for non-completed tasks */}
                {selectedTask.status !== "Completed" && (
                  <div className="pt-3 border-t border-border">
                    <button
                      onClick={() => handleStatusChange(selectedTask.id, "Completed")}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                        "bg-green-500 text-white hover:bg-green-600"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
