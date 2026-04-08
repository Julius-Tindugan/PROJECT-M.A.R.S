import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, Clock, Building2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Task } from "@/lib/api";
import { Link } from "react-router-dom";

interface PendingTasksNotificationProps {
  onTaskCountChange?: (count: number) => void;
}

export function PendingTasksNotification({ onTaskCountChange }: PendingTasksNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksResponse = await api.getTasks({ paginate: false });
        const loadedTasks = "data" in tasksResponse ? tasksResponse.data : [];
        setTasks(loadedTasks);
        const pendingCount = loadedTasks.filter((t) => t.status === "Pending").length;
        onTaskCountChange?.(pendingCount);
      } catch (error) {
        console.error("Error loading pending tasks:", error);
      }
    };

    loadData();
  }, [onTaskCountChange]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.status === "Pending");
  }, [tasks]);

  const filteredPendingTasks = useMemo(() => {
    if (filterPriority === "All") return pendingTasks;
    return pendingTasks.filter(t => t.priority === filterPriority);
  }, [pendingTasks, filterPriority]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pendingTasks.filter(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    });
  }, [pendingTasks]);

  const todayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pendingTasks.filter(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  }, [pendingTasks]);

  const criticalTasks = useMemo(() => {
    return pendingTasks.filter(t => t.priority === "Critical");
  }, [pendingTasks]);

  const getPriorityBadgeColor = (priority: string) => {
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

  const isOverdue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const hasAlerts = overdueTasks.length > 0 || criticalTasks.length > 0;

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-all",
          isOpen ? "bg-muted" : "hover:bg-muted",
          hasAlerts && "animate-pulse"
        )}
      >
        <Bell className={cn(
          "w-5 h-5",
          hasAlerts ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
        )} />
        {pendingTasks.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
              hasAlerts
                ? "bg-red-600 text-white"
                : "bg-primary text-primary-foreground"
            )}
          >
            {pendingTasks.length > 99 ? "99+" : pendingTasks.length}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-2xl border border-border z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-lg">
                <div>
                  <h3 className="font-semibold text-foreground">Pending Tasks</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} pending
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Alert Summary */}
              {hasAlerts && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs space-y-1">
                      {overdueTasks.length > 0 && (
                        <p className="text-red-700 dark:text-red-400 font-medium">
                          {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {criticalTasks.length > 0 && (
                        <p className="text-red-700 dark:text-red-400 font-medium">
                          {criticalTasks.length} critical priority task{criticalTasks.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="p-3 border-b border-border grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {overdueTasks.length}
                  </p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {todayTasks.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {criticalTasks.length}
                  </p>
                </div>
              </div>

              {/* Filter */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="flex-1 text-xs px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto">
                {filteredPendingTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {filterPriority === "All"
                        ? "No pending tasks"
                        : `No ${filterPriority.toLowerCase()} priority tasks`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredPendingTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                          isOverdue(task.date) && "bg-red-50/50 dark:bg-red-950/10"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary">
                                {task.id}
                              </span>
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded border font-medium",
                                getPriorityBadgeColor(task.priority)
                              )}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">
                                  {task.department}
                                </span>
                              </div>
                              <div className={cn(
                                "flex items-center gap-1",
                                isOverdue(task.date) && "text-red-600 dark:text-red-400 font-medium"
                              )}>
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(task.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/30 rounded-b-lg">
                <Link
                  to="/task-logs"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All Tasks →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
