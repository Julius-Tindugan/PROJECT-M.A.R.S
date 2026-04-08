import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Clock, AlertCircle, User, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, type Task } from "@/lib/api";

type TaskStatus = "Pending" | "In Progress" | "Completed";
type TaskPriority = "Low" | "Medium" | "High" | "Critical";

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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const initialFormState = {
  description: "",
  department: "",
  category: "",
  staffName: "",
  priority: "Medium" as TaskPriority,
  status: "Pending" as TaskStatus,
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  remarks: "",
};

export default function QuickLog() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptResponse, catResponse, staffResponse, recentResponse] = await Promise.all([
          api.getDepartmentsList({ names_only: true }),
          api.getCategoriesList({ names_only: true }),
          api.getStaffList({ names_only: true }),
          api.getRecentTasks(5),
        ]);

        setDepartments(Array.isArray(deptResponse) ? deptResponse : []);
        setCategories(Array.isArray(catResponse) ? catResponse : []);
        setStaffList(Array.isArray(staffResponse) ? staffResponse : []);
        setRecentTasks(recentResponse.data ?? []);
      } catch (error) {
        console.error("Error loading quick log data:", error);
        toast.error("Failed to load form data");
      }
    };

    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.department || !formData.category || !formData.staffName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.createTask({
        description: formData.description,
        department: formData.department,
        category: formData.category,
        staff: formData.staffName,
        priority: formData.priority,
        status: formData.status,
        date: formData.date,
        starttime: formData.startTime,
        endtime: formData.endTime,
        remarks: formData.remarks,
      });

      const newTask = response.data;
      setRecentTasks((prev) => [newTask, ...prev.slice(0, 4)]);
      toast.success(`Task ${newTask.id} recorded successfully!`);
      setFormData({
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error recording task:", error);
      toast.error("Failed to record task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const duration = calculateDuration(formData.startTime, formData.endTime);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
      >
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-foreground">Quick Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record IT maintenance tasks in real-time
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          {/* Quick Log Form */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Record New Task
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* 1. Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the issue and the fix applied..."
                    rows={3}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                      "resize-none placeholder:text-muted-foreground"
                    )}
                  />
                </div>

                {/* 2. Department & 3. Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Department <span className="text-destructive">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Staff Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      Staff Name <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <select
                    name="staffName"
                    value={formData.staffName}
                    onChange={handleChange}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    )}
                  >
                    <option value="">Select Staff</option>
                    {staffList.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Priority & 6. Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Priority
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["Low", "Medium", "High", "Critical"] as TaskPriority[]).map(
                        (priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, priority }))
                            }
                            className={cn(
                              "px-2 py-2 rounded-lg text-xs font-medium transition-all border",
                              formData.priority === priority
                                ? priority === "Critical"
                                  ? "bg-red-500 text-white border-red-500"
                                  : priority === "High"
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : priority === "Medium"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-green-500 text-white border-green-500"
                                : "bg-background text-foreground border-input hover:border-primary/50"
                            )}
                          >
                            {priority}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["Pending", "In Progress", "Completed"] as TaskStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, status }))
                            }
                            className={cn(
                              "px-2 py-2 rounded-lg text-xs font-medium transition-all border",
                              formData.status === status
                                ? status === "Completed"
                                  ? "bg-green-500 text-white border-green-500"
                                  : status === "In Progress"
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-input hover:border-primary/50"
                            )}
                          >
                            {status}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Date & 8. Start Time & 9. End Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Date
                      </span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Start Time
                      </span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        End Time
                      </span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    />
                  </div>
                </div>

                {/* Duration Display */}
                {formData.startTime && formData.endTime && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">
                      Duration: <span className="font-semibold text-primary">{duration}</span>
                    </span>
                  </div>
                )}

                {/* 10. Remarks */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Additional notes or observations..."
                    rows={2}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                      "resize-none placeholder:text-muted-foreground"
                    )}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "w-full py-3 rounded-lg font-medium transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Record Task
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div variants={itemVariants}>
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Tasks
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest 5 recorded tasks
                </p>
              </div>
              <div className="divide-y divide-border max-h-[600px] overflow-auto">
                {recentTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="text-sm font-medium text-primary">
                            {task.id}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.department} - {task.category}
                      </p>
                      <p className="text-xs text-foreground line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{task.staffName}</span>
                        {task.startTime && task.endTime && (
                          <>
                            <span className="text-border">|</span>
                            <Clock className="w-3 h-3" />
                            <span>{calculateDuration(task.startTime, task.endTime)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {recentTasks.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No tasks recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
