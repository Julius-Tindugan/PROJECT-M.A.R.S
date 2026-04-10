import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { RecordTaskModal } from "@/components/RecordTaskModal";
import { cn } from "@/lib/utils";
import { api, calculateDuration, Task } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function RecordTaskPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingRecentTasks, setIsLoadingRecentTasks] = useState(false);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  const fetchRecentTasks = useCallback(async () => {
    setIsLoadingRecentTasks(true);

    try {
      const recentTaskData = await api.getRecentTasks(8);
      setRecentTasks(recentTaskData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load recent tasks");
    } finally {
      setIsLoadingRecentTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentTasks();
  }, [fetchRecentTasks]);

  const handleTaskRecorded = (task: Task) => {
    setRecentTasks((prev) => [task, ...prev.filter((entry) => entry.id !== task.id)].slice(0, 8));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "border-red-300 bg-red-50 text-red-700 dark:border-red-800/70 dark:bg-red-900/30 dark:text-red-300";
      case "High":
        return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800/70 dark:bg-orange-900/30 dark:text-orange-300";
      case "Medium":
        return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur"
      >
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Record Task</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the modal form to capture maintenance tasks with less friction.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
              "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg"
            )}
          >
            <Plus className="h-4.5 w-4.5" />
            Record New Task
          </button>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 xl:grid-cols-3"
        >
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Better Task Capture
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the modal to focus only on what matters while entering a task.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                  <p className="font-medium">What improves in the new modal?</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Required-field completion indicator</li>
                    <li>Cleaner sectioned form flow</li>
                    <li>Save and continue with Save & New</li>
                  </ul>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Open Record Task Form
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="xl:col-span-2">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest 8 task entries, refreshed when a new task is recorded
                </p>
              </div>

              <div className="max-h-[680px] divide-y divide-border overflow-auto">
                {isLoadingRecentTasks ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading recent tasks...</div>
                ) : recentTasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No tasks recorded yet.</div>
                ) : (
                  recentTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="space-y-3 p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className="text-sm font-semibold text-primary">{task.id}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-foreground">{task.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.department} - {task.category}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold",
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {task.staffName}
                        </span>

                        {task.startTime && task.endTime && (
                          <>
                            <span className="text-border">|</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {calculateDuration(task.startTime, task.endTime)}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <RecordTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskRecorded={handleTaskRecorded}
      />
    </div>
  );
}
