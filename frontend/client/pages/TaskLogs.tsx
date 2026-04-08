import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Download, RefreshCw, Eye, User, Clock, CheckCircle2, Pencil, X, Save, UserPlus, Building2, Tag, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, type Task } from "@/lib/api";

// Type definitions
type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type SortKey = keyof Task;
type SortOrder = "asc" | "desc";

// Status options for dropdown
const STATUS_OPTIONS: TaskStatus[] = ["Pending", "In Progress", "Completed"];
const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

// Helper function to calculate duration between two times
const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "N/A";
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic data
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, deptResponse, catResponse, staffResponse] = await Promise.all([
        api.getTasks({ paginate: false }),
        api.getDepartmentsList({ names_only: true }),
        api.getCategoriesList({ names_only: true }),
        api.getStaffList({ names_only: true }),
      ]);

      // Extract tasks from response
      const loadedTasks = 'data' in tasksResponse ? tasksResponse.data : [];
      setTasks(loadedTasks);

      // Handle department/category/staff responses (they return string[] when names_only is true)
      setDepartments(Array.isArray(deptResponse) ? deptResponse : []);
      setCategories(Array.isArray(catResponse) ? catResponse : []);
      setStaffList(Array.isArray(staffResponse) ? staffResponse : []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshTasks = async () => {
    try {
      const tasksResponse = await api.getTasks({ paginate: false });
      const loadedTasks = 'data' in tasksResponse ? tasksResponse.data : [];
      setTasks(loadedTasks);
      toast.success('Tasks refreshed');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    }
  };

  /**
   * Handle status change for a task
   * When status changes to "Completed":
   * - Auto-sets end time to current time if not already set
   * - If no start time exists, sets it to beginning of day
   * - Calculates and displays duration
   */
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    let updatePayload: Record<string, string> = { status: newStatus };
    let startTime = task.startTime;
    let endTime = task.endTime;

    // When marking as "Completed", auto-fill end time and calculate duration
    if (newStatus === "Completed") {
      if (!task.startTime) {
        startTime = "08:00";
        updatePayload.starttime = startTime;
      }
      if (!task.endTime) {
        endTime = currentTime;
        updatePayload.endtime = endTime;
      }
    }
    // When changing to "In Progress", set start time if not exists
    else if (newStatus === "In Progress" && !task.startTime) {
      startTime = currentTime;
      updatePayload.starttime = startTime;
    }

    try {
      // Update via API using the database ID
      await api.updateTask(task.dbId, updatePayload);

      // Update local state
      const updatedTask = { ...task, status: newStatus, startTime, endTime };
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      setTasks(updatedTasks);

      // Show appropriate toast
      if (newStatus === "Completed") {
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
      } else if (newStatus === "In Progress") {
        toast.success(`Task ${taskId} is now In Progress`, { duration: 2000 });
      } else if (newStatus === "Pending") {
        toast.info(`Task ${taskId} set to Pending`, { duration: 2000 });
      } else {
        toast.success(`Status updated to ${newStatus}`, { duration: 2000 });
      }

      // Update selectedTask if it's the one being modified
      if (selectedTask?.id === taskId) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Open edit modal with task data
  const handleEditClick = (task: Task) => {
    setEditFormData({ ...task });
    setIsEditMode(true);
    setSelectedTask(task);
  };

  // Handle form field changes in edit mode
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  // Save edited task
  const handleEditSave = async () => {
    if (!editFormData) return;

    // Validation
    if (!editFormData.description || !editFormData.department || !editFormData.category || !editFormData.staffName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Update via API using the database ID
      await api.updateTask(editFormData.dbId, {
        description: editFormData.description,
        department: editFormData.department,
        category: editFormData.category,
        staff: editFormData.staffName,
        priority: editFormData.priority,
        status: editFormData.status,
        requester: editFormData.requestedBy,
        date: editFormData.date,
        starttime: editFormData.startTime,
        endtime: editFormData.endTime,
        remarks: editFormData.remarks,
      });

      // Update local state
      const updatedTasks = tasks.map((task) =>
        task.id === editFormData.id ? editFormData : task
      );

      setTasks(updatedTasks);
      setSelectedTask(editFormData);
      setIsEditMode(false);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Task {editFormData.id} updated!</span>
          <span className="text-sm opacity-90">Changes saved successfully</span>
        </div>,
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task changes');
    }
  };

  // Cancel edit mode
  const handleEditCancel = () => {
    setIsEditMode(false);
    setEditFormData(selectedTask);
  };

  // Close modal completely
  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsEditMode(false);
    setEditFormData(null);
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
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border border-input text-foreground hover:bg-muted"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-blue-600"
                            title="Edit Task"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Task Detail/Edit Modal */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full border border-border max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isEditMode ? "bg-blue-100 dark:bg-blue-900/30" : "bg-primary/10"
                    )}>
                      {isEditMode ? (
                        <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {isEditMode ? "Edit Task" : "Task Details"} - {selectedTask.id}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {isEditMode ? "Modify task information" : "View complete task information"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditMode && (
                      <button
                        onClick={() => handleEditClick(selectedTask)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600 hover:text-blue-700"
                        title="Edit Task"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  {isEditMode && editFormData ? (
                    /* Edit Mode */
                    <>
                      {/* Description */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          <FileText className="w-3.5 h-3.5" />
                          Description <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditChange}
                          rows={3}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                          )}
                        />
                      </div>

                      {/* Department & Category */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <Building2 className="w-3.5 h-3.5" />
                            Department <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="department"
                            value={editFormData.department}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          >
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <Tag className="w-3.5 h-3.5" />
                            Category <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Staff & Requested By */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <User className="w-3.5 h-3.5" />
                            Assigned Staff <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="staffName"
                            value={editFormData.staffName}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          >
                            {staffList.map((staff) => (
                              <option key={staff} value={staff}>{staff}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <UserPlus className="w-3.5 h-3.5" />
                            Requested By
                          </label>
                          <input
                            type="text"
                            name="requestedBy"
                            value={editFormData.requestedBy || ""}
                            onChange={handleEditChange}
                            placeholder="Person who requested this task"
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>
                      </div>

                      {/* Priority & Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Priority
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {PRIORITY_OPTIONS.map((priority) => (
                              <button
                                key={priority}
                                type="button"
                                onClick={() => setEditFormData(prev => prev ? { ...prev, priority } : null)}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                  editFormData.priority === priority
                                    ? priority === "Critical"
                                      ? "bg-red-500 text-white border-red-500"
                                      : priority === "High"
                                      ? "bg-orange-500 text-white border-orange-500"
                                      : priority === "Medium"
                                      ? "bg-amber-500 text-white border-amber-500"
                                      : "bg-green-500 text-white border-green-500"
                                    : "bg-background text-foreground border-input hover:border-primary/50"
                                )}
                              >
                                {priority}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Status
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setEditFormData(prev => prev ? { ...prev, status } : null)}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                  editFormData.status === status
                                    ? status === "Completed"
                                      ? "bg-green-500 text-white border-green-500"
                                      : status === "In Progress"
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-amber-500 text-white border-amber-500"
                                    : "bg-background text-foreground border-input hover:border-primary/50"
                                )}
                              >
                                {status === "In Progress" ? "Progress" : status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={editFormData.date}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            Start Time
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            value={editFormData.startTime}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            End Time
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            value={editFormData.endTime}
                            onChange={handleEditChange}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>
                      </div>

                      {/* Duration Display */}
                      {editFormData.startTime && editFormData.endTime && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Calculated Duration: </span>
                          <span className="font-bold text-primary">
                            {calculateDuration(editFormData.startTime, editFormData.endTime)}
                          </span>
                        </div>
                      )}

                      {/* Remarks */}
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          <FileText className="w-3.5 h-3.5" />
                          Remarks
                        </label>
                        <textarea
                          name="remarks"
                          value={editFormData.remarks}
                          onChange={handleEditChange}
                          rows={2}
                          placeholder="Additional notes or observations..."
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                          )}
                        />
                      </div>
                    </>
                  ) : (
                    /* View Mode */
                    <>
                      {/* Description */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Description
                        </label>
                        <p className="text-sm text-foreground mt-1">{selectedTask.description}</p>
                      </div>

                      {/* Department & Category */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Department
                          </label>
                          <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-primary" />
                            {selectedTask.department}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Category
                          </label>
                          <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                            <Tag className="w-4 h-4 text-primary" />
                            {selectedTask.category}
                          </p>
                        </div>
                      </div>

                      {/* Staff & Requested By */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Assigned Staff
                          </label>
                          <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                            <User className="w-4 h-4 text-primary" />
                            {selectedTask.staffName}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Requested By
                          </label>
                          <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                            <UserPlus className="w-4 h-4 text-primary" />
                            {selectedTask.requestedBy || <span className="text-muted-foreground italic">Not specified</span>}
                          </p>
                        </div>
                      </div>

                      {/* Priority & Status */}
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Date
                          </label>
                          <p className="text-sm text-foreground mt-1">{formatDate(selectedTask.date)}</p>
                        </div>
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

                      {/* Remarks */}
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
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleEditCancel}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                          "border border-input text-foreground hover:bg-muted"
                        )}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
                          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        )}
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(selectedTask.createdAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(selectedTask)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            "border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          )}
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        {selectedTask.status !== "Completed" && (
                          <button
                            onClick={() => handleStatusChange(selectedTask.id, "Completed")}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              "bg-green-500 text-white hover:bg-green-600"
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
