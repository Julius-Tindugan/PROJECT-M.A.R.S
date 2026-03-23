import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User, Calendar, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadDepartments,
  loadCategories,
  loadStaff,
  loadTasks,
  saveTasks,
  generateTaskId,
  calculateDuration,
  Task,
  TaskStatus,
  TaskPriority,
} from "@/lib/mockData";

interface RecordTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function RecordTaskModal({ isOpen, onClose }: RecordTaskModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);

  // Load dynamic data and reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartments(loadDepartments());
      setCategories(loadCategories());
      setStaffList(loadStaff());
      setFormData({
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.description || !formData.department || !formData.category || !formData.staffName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newTask: Task = {
        id: generateTaskId(),
        description: formData.description,
        department: formData.department,
        category: formData.category,
        staffName: formData.staffName,
        priority: formData.priority,
        status: formData.status,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        remarks: formData.remarks,
        createdAt: new Date().toISOString(),
      };

      const tasks = loadTasks();
      tasks.unshift(newTask);
      saveTasks(tasks);

      toast.success(`Task ${newTask.id} recorded successfully!`);
      onClose();
    } catch (error) {
      toast.error("Failed to record task");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const duration = calculateDuration(formData.startTime, formData.endTime);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full border border-border max-h-[90vh] overflow-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Record New Task
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Log IT maintenance activity
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
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

                {/* 2. Department & 3. Category - Row */}
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

                {/* 5. Priority & 6. Status - Row */}
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

                {/* 7. Date & 8. Start Time & 9. End Time - Row */}
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

                {/* Buttons */}
                <div className="flex gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-muted transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Recording..." : "Record Task"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
