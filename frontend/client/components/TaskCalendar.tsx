import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Building2,
  X,
  Filter,
  Play,
  Check,
  RotateCcw,
  CalendarDays,
  ListFilter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Task } from "@/lib/api";
import { toast } from "sonner";
 
interface TaskCalendarProps {
  tasks: Task[];
  onTaskUpdate?: (updatedTask?: Task) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type StatusFilter = "all" | "Pending" | "In Progress" | "Completed";

export function TaskCalendar({ tasks, onTaskUpdate }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Get previous month's days to fill the start
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  // Get week data for week view
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days: { date: Date; isToday: boolean }[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }

    return days;
  }, [currentDate]);

  // Filter tasks by status
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter(task => task.status === statusFilter);
  }, [tasks, statusFilter]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate);
  }, [selectedDate, filteredTasks]);

  // Navigate months/weeks
  const navigate = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === "month") {
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      default:
        return "bg-amber-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700";
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

  const isOverdue = (task: Task) => {
    if (task.status === "Completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  // Update task status
  const updateTaskStatus = async (task: Task, newStatus: "Pending" | "In Progress" | "Completed") => {
    try {
      const response = await api.updateTask(task.dbId, { status: newStatus });
      const updatedTask = response.data;
      onTaskUpdate?.(updatedTask);
      setSelectedTask(updatedTask);
      toast.success(`Task ${task.id} marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status === "Pending").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const overdue = tasks.filter(t => isOverdue(t)).length;
    return { pending, inProgress, completed, overdue };
  }, [tasks]);

  const formatDateHeader = () => {
    if (viewMode === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const start = weekData[0].date;
      const end = weekData[6].date;
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getDate()} - ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
      }
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Tasks Calendar
              </h2>
              <p className="text-sm text-muted-foreground">
                View and manage all your tasks
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")}
            className={cn(
              "p-3 rounded-lg border transition-all text-left",
              statusFilter === "Pending"
                ? "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                : "bg-muted/50 border-border hover:border-amber-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-foreground">{stats.pending}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "In Progress" ? "all" : "In Progress")}
            className={cn(
              "p-3 rounded-lg border transition-all text-left",
              statusFilter === "In Progress"
                ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                : "bg-muted/50 border-border hover:border-blue-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-foreground">{stats.inProgress}</p>
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "Completed" ? "all" : "Completed")}
            className={cn(
              "p-3 rounded-lg border transition-all text-left",
              statusFilter === "Completed"
                ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700"
                : "bg-muted/50 border-border hover:border-green-300"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-foreground">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </button>

          <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-foreground min-w-[200px] text-center">
              {formatDateHeader()}
            </h3>
            <button
              onClick={() => navigate("next")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Clear Filter
              </button>
            )}
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month View */}
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => {
              const dayTasks = getTasksForDate(day.date);
              const hasOverdue = dayTasks.some(t => isOverdue(t));
              const isSelected = selectedDate &&
                day.date.getDate() === selectedDate.getDate() &&
                day.date.getMonth() === selectedDate.getMonth() &&
                day.date.getFullYear() === selectedDate.getFullYear();

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "min-h-[80px] p-2 rounded-lg border transition-all text-left",
                    day.isCurrentMonth
                      ? "bg-background border-border"
                      : "bg-muted/30 border-transparent",
                    day.isToday && "ring-2 ring-primary ring-offset-2",
                    isSelected && "border-primary bg-primary/5",
                    hasOverdue && day.isCurrentMonth && "border-red-300 dark:border-red-700"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        day.isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                        day.isToday && "bg-primary text-primary-foreground px-2 py-0.5 rounded-full"
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Indicators */}
                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate",
                          getStatusColor(task.status),
                          "text-white"
                        )}
                        title={task.description}
                      >
                        {task.id}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((day, index) => {
              const dayTasks = getTasksForDate(day.date);
              const isSelected = selectedDate &&
                day.date.getDate() === selectedDate.getDate() &&
                day.date.getMonth() === selectedDate.getMonth() &&
                day.date.getFullYear() === selectedDate.getFullYear();

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[200px] p-2 rounded-lg border transition-all",
                    "bg-background border-border",
                    day.isToday && "ring-2 ring-primary ring-offset-2",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <button
                    onClick={() => setSelectedDate(day.date)}
                    className="w-full text-left mb-2"
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        day.isToday && "bg-primary text-primary-foreground px-2 py-0.5 rounded-full"
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {MONTHS[day.date.getMonth()].slice(0, 3)}
                    </span>
                  </button>

                  <div className="space-y-1 overflow-y-auto max-h-[160px]">
                    {dayTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "w-full text-left text-xs p-2 rounded border transition-all hover:shadow-sm",
                          getStatusBgColor(task.status),
                          isOverdue(task) && "border-red-400"
                        )}
                      >
                        <div className="font-medium truncate">{task.id}</div>
                        <div className="text-[10px] opacity-75 truncate">
                          {task.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Date Tasks Panel */}
      <AnimatePresence>
        {selectedDate && selectedDateTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">
                  Tasks for {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                  })}
                </h4>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedDateTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                      "bg-background border-border",
                      isOverdue(task) && "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">{task.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium border",
                            getStatusBgColor(task.status)
                          )}>
                            {task.status}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            getPriorityColor(task.priority)
                          )}>
                            {task.priority}
                          </span>
                          {isOverdue(task) && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {task.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.staffName}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        {task.status === "Pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task, "In Progress");
                            }}
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="Start Task"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {task.status === "In Progress" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task, "Completed");
                            }}
                            className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                            title="Mark Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {task.status === "Completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task, "Pending");
                            }}
                            className="p-1.5 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                            title="Reopen Task"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border sticky top-0 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{selectedTask.id}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      getStatusBgColor(selectedTask.status)
                    )}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Description */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <p className="text-foreground mt-1">{selectedTask.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Department
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedTask.department}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Assigned To
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedTask.staffName}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Category
                    </label>
                    <p className="text-foreground mt-1">{selectedTask.category}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Priority
                    </label>
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-xs font-medium mt-1",
                      getPriorityColor(selectedTask.priority)
                    )}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Date
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className={cn(
                        "text-foreground",
                        isOverdue(selectedTask) && "text-red-600 font-semibold"
                      )}>
                        {new Date(selectedTask.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                        {isOverdue(selectedTask) && " (Overdue)"}
                      </span>
                    </div>
                  </div>
                  {selectedTask.startTime && selectedTask.endTime && (
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Time
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {selectedTask.startTime} - {selectedTask.endTime}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {selectedTask.remarks && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Remarks
                    </label>
                    <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-lg">
                      {selectedTask.remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer - Quick Actions */}
              <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(selectedTask.createdAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  {selectedTask.status === "Pending" && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask, "In Progress")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Task
                    </button>
                  )}
                  {selectedTask.status === "In Progress" && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask, "Completed")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                  {selectedTask.status === "Completed" && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask, "Pending")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reopen Task
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
