import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  api,
  calculateDuration,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecordTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskRecorded?: (task: Task) => void;
}

type SubmitMode = "record" | "recordAndNew";

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

const requiredFields = ["description", "department", "category", "staffName"] as const;

export function RecordTaskModal({ isOpen, onClose, onTaskRecorded }: RecordTaskModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("record");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);

  const requiredFieldsCompleted = useMemo(() => {
    return requiredFields.filter((field) => {
      const value = formData[field];
      return typeof value === "string" && value.trim().length > 0;
    }).length;
  }, [formData]);

  const completionPercent = Math.round((requiredFieldsCompleted / requiredFields.length) * 100);
  const canSubmit = requiredFieldsCompleted === requiredFields.length && !isSubmitting && !isLoadingMetadata;
  const duration = calculateDuration(formData.startTime, formData.endTime);

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      date: new Date().toISOString().split("T")[0],
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);

      try {
        const [departmentData, categoryData, staffData] = await Promise.all([
          api.getDepartments(),
          api.getCategories(),
          api.getStaff(),
        ]);

        setDepartments(departmentData);
        setCategories(categoryData);
        setStaffList(staffData);
        resetForm();
      } catch (error) {
        console.error(error);
        toast.error("Failed to load task form data");
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error("Please complete all required fields before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.createTask({
        description: formData.description,
        department: formData.department,
        category: formData.category,
        staffName: formData.staffName,
        priority: formData.priority,
        status: formData.status,
        date: formData.date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        remarks: formData.remarks || undefined,
      });

      onTaskRecorded?.(response.task);

      if (submitMode === "recordAndNew") {
        toast.success(`Task ${response.task.id} recorded. Ready for your next entry.`);
        resetForm();
        return;
      }

      toast.success(`Task ${response.task.id} recorded successfully!`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to record task");
    } finally {
      setIsSubmitting(false);
      setSubmitMode("record");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">Record New Task</DialogTitle>
              <DialogDescription className="mt-1">
                Capture maintenance details quickly with required field guidance.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(92vh-84px)] flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-foreground">
                <p className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Form progress
                </p>
                <p>
                  {requiredFieldsCompleted}/{requiredFields.length} required fields complete
                </p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-primary/15">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Task Summary</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What happened and what was done to fix it?"
                  rows={4}
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                    "resize-none transition-all placeholder:text-muted-foreground",
                    "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Add enough context so other staff can continue the work if needed.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Assignment</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={isLoadingMetadata}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isLoadingMetadata}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      Staff Name <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <select
                    name="staffName"
                    value={formData.staffName}
                    onChange={handleChange}
                    disabled={isLoadingMetadata}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-60"
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
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Priority</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["Low", "Medium", "High", "Critical"] as TaskPriority[]).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, priority }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                        formData.priority === priority
                          ? priority === "Critical"
                            ? "border-red-500 bg-red-500 text-white"
                            : priority === "High"
                            ? "border-orange-500 bg-orange-500 text-white"
                            : priority === "Medium"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-emerald-500 bg-emerald-500 text-white"
                          : "border-input bg-background text-foreground hover:border-primary/40"
                      )}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Status</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["Pending", "In Progress", "Completed"] as TaskStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, status }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                        formData.status === status
                          ? status === "Completed"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : status === "In Progress"
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:border-primary/40"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      Date
                    </span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </span>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      End Time
                    </span>
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                      "transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    )}
                  />
                </div>
              </div>

              {formData.startTime && formData.endTime && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Duration: <span className="font-semibold text-primary">{duration}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Additional Notes</h3>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add extra context, blockers, or follow-up notes"
                rows={3}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground",
                  "resize-none transition-all placeholder:text-muted-foreground",
                  "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              />
            </div>
          </div>

          <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Required fields must be completed before recording.
              </span>

              {isLoadingMetadata && (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading department, category, and staff options...
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={cn(
                  "rounded-lg border border-input px-4 py-2.5 text-sm font-medium text-foreground transition-colors",
                  "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                onClick={() => setSubmitMode("recordAndNew")}
                className={cn(
                  "rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all",
                  "hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isSubmitting && submitMode === "recordAndNew" ? "Saving..." : "Save & New"}
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                onClick={() => setSubmitMode("record")}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all",
                  "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isSubmitting && submitMode === "record" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Task"
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
