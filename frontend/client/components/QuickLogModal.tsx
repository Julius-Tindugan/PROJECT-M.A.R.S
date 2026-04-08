import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Clock, User, Calendar, FileText, Zap, Building2, Tag, UserPlus, RotateCcw } from "lucide-react";
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

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: (task: Task) => void;
}

const initialFormState = {
  description: "",
  department: "",
  category: "",
  staffName: "",
  requestedBy: "",
  priority: "Medium" as TaskPriority,
  status: "Pending" as TaskStatus,
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  remarks: "",
};

export function QuickLogModal({ isOpen, onClose, onTaskAdded }: QuickLogModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [deptResponse, catResponse, staffResponse] = await Promise.all([
            api.getDepartmentsList({ names_only: true }),
            api.getCategoriesList({ names_only: true }),
            api.getStaffList({ names_only: true }),
          ]);

          setDepartments(Array.isArray(deptResponse) ? deptResponse : []);
          setCategories(Array.isArray(catResponse) ? catResponse : []);
          setStaffList(Array.isArray(staffResponse) ? staffResponse : []);
          setFormData({
            ...initialFormState,
            date: new Date().toISOString().split("T")[0],
          });
          setActiveStep(0);
        } catch (error) {
          console.error("Error loading quick log modal data:", error);
          toast.error("Failed to load form data");
        }
      };

      loadData();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createTask = async (): Promise<Task | null> => {
    if (!formData.description || !formData.department || !formData.category || !formData.staffName) {
      toast.error("Please fill in all required fields");
      return null;
    }

    setIsSubmitting(true);

    try {
      const response = await api.createTask({
        description: formData.description,
        department: formData.department,
        category: formData.category,
        staff: formData.staffName,
        requester: formData.requestedBy,
        priority: formData.priority,
        status: formData.status,
        date: formData.date,
        starttime: formData.startTime,
        endtime: formData.endTime,
        remarks: formData.remarks,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to record task");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTask = await createTask();
    if (newTask) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Task {newTask.id} recorded!</span>
          <span className="text-sm opacity-90">{newTask.department} - {newTask.category}</span>
        </div>,
        { duration: 3000 }
      );
      onTaskAdded?.(newTask);
      onClose();
    }
  };

  const handleSaveAndCreateNew = async () => {
    const newTask = await createTask();
    if (newTask) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Task {newTask.id} recorded!</span>
          <span className="text-sm opacity-90">Ready for next task entry</span>
        </div>,
        { duration: 2500 }
      );
      onTaskAdded?.(newTask);
      // Reset form for new entry
      setFormData({
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
      });
      setActiveStep(0);
    }
  };

  const duration = calculateDuration(formData.startTime, formData.endTime);

  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Assignment", icon: User },
    { title: "Time & Priority", icon: Clock },
  ];

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return formData.description && formData.department && formData.category;
      case 1:
        return formData.staffName;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const isComplete = formData.description && formData.department && formData.category && formData.staffName;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Quick Log</h2>
                      <p className="text-sm text-muted-foreground">Record a new IT maintenance task</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mt-6">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;
                    return (
                      <button
                        key={step.title}
                        onClick={() => setActiveStep(index)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1 justify-center",
                          isActive && "bg-primary text-primary-foreground",
                          isCompleted && "bg-primary/20 text-primary",
                          !isActive && !isCompleted && "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <StepIcon className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">
                  {/* Step 1: Basic Info */}
                  {activeStep === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      {/* Description */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Description <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Describe the issue and the fix applied..."
                          rows={3}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                            "resize-none placeholder:text-muted-foreground"
                          )}
                        />
                      </div>

                      {/* Department & Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            Department <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
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
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Tag className="w-4 h-4 text-primary" />
                            Category <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
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
                    </motion.div>
                  )}

                  {/* Step 2: Assignment */}
                  {activeStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      {/* Staff Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                          <User className="w-4 h-4 text-primary" />
                          Assigned Staff <span className="text-destructive">*</span>
                        </label>
                        <select
                          name="staffName"
                          value={formData.staffName}
                          onChange={handleChange}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          )}
                        >
                          <option value="">Select Staff Member</option>
                          {staffList.map((staff) => (
                            <option key={staff} value={staff}>
                              {staff}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Requested By */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                          <UserPlus className="w-4 h-4 text-primary" />
                          Requested By
                          <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          name="requestedBy"
                          value={formData.requestedBy}
                          onChange={handleChange}
                          placeholder="Enter the name of the person who requested this task..."
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                            "placeholder:text-muted-foreground"
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                          Name of the staff or personnel from the department who reported or requested this task
                        </p>
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Remarks (Optional)
                        </label>
                        <textarea
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleChange}
                          placeholder="Additional notes or observations..."
                          rows={3}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                            "resize-none placeholder:text-muted-foreground"
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Time & Priority */}
                  {activeStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Priority Level
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(["Low", "Medium", "High", "Critical"] as TaskPriority[]).map(
                            (priority) => (
                              <button
                                key={priority}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, priority }))}
                                className={cn(
                                  "px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2",
                                  formData.priority === priority
                                    ? priority === "Critical"
                                      ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/25"
                                      : priority === "High"
                                      ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                                      : priority === "Medium"
                                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                                      : "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25"
                                    : "bg-background text-foreground border-input hover:border-primary/50"
                                )}
                              >
                                {priority}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Initial Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["Pending", "In Progress", "Completed"] as TaskStatus[]).map(
                            (status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, status }))}
                                className={cn(
                                  "px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2",
                                  formData.status === status
                                    ? status === "Completed"
                                      ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/25"
                                      : status === "In Progress"
                                      ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                                      : "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                                    : "bg-background text-foreground border-input hover:border-primary/50"
                                )}
                              >
                                {status}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Start Time
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            End Time
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            )}
                          />
                        </div>
                      </div>

                      {/* Duration Display */}
                      {formData.startTime && formData.endTime && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20"
                        >
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <span className="text-sm text-foreground">Calculated Duration: </span>
                            <span className="font-bold text-primary">{duration}</span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {activeStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveStep(activeStep - 1)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                          "border border-input text-foreground hover:bg-muted"
                        )}
                      >
                        Back
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                        "border border-input text-foreground hover:bg-muted"
                      )}
                    >
                      Cancel
                    </button>

                    {activeStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep(activeStep + 1)}
                        disabled={!canProceed()}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-sm font-medium transition-all",
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        Continue
                      </button>
                    ) : (
                      <>
                        {/* Save and Create New Button */}
                        <motion.button
                          type="button"
                          onClick={handleSaveAndCreateNew}
                          disabled={isSubmitting || !isComplete}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            "border-2 border-primary text-primary hover:bg-primary/10",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center gap-2"
                          )}
                        >
                          {isSubmitting ? (
                            <span>Saving...</span>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              Save & New
                            </>
                          )}
                        </motion.button>

                        {/* Record Task Button */}
                        <motion.button
                          type="submit"
                          disabled={isSubmitting || !isComplete}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center gap-2 shadow-lg shadow-primary/25"
                          )}
                        >
                          {isSubmitting ? (
                            <span>Recording...</span>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Record Task
                            </>
                          )}
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
