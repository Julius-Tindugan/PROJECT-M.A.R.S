import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  compareAsc,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  Plus,
  Search,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task, TaskStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type CalendarTaskFilter = "Open" | TaskStatus | "All";

interface TaskCalendarSectionProps {
  tasks: Task[];
}

interface TaskDayBucket {
  key: string;
  date: Date;
  tasks: Task[];
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
}

interface TaskDueItem {
  task: Task;
  dueAt: Date;
}

const TASK_STATUS_FILTERS: { key: CalendarTaskFilter; label: string }[] = [
  { key: "Open", label: "Open" },
  { key: "Pending", label: "Pending" },
  { key: "In Progress", label: "In Progress" },
  { key: "Completed", label: "Completed" },
  { key: "All", label: "All" },
];

const STATUS_SORT_ORDER: Record<TaskStatus, number> = {
  Pending: 0,
  "In Progress": 1,
  Completed: 2,
};

const PRIORITY_SORT_ORDER: Record<Task["priority"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const parseTaskDate = (task: Task): Date | null => {
  if (!task.date) {
    return null;
  }

  const parsedDate = new Date(`${task.date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return startOfDay(parsedDate);
};

const parseTaskDueAt = (task: Task): Date | null => {
  if (!task.date) {
    return null;
  }

  const fallbackTime = task.endTime || task.startTime || "23:59";
  const dueAt = new Date(`${task.date}T${fallbackTime}:00`);

  if (Number.isNaN(dueAt.getTime())) {
    return null;
  }

  return dueAt;
};

const formatTaskSchedule = (task: Task): string => {
  const start = task.startTime;
  const end = task.endTime;

  if (!start && !end) {
    return "No schedule set";
  }

  if (start && end) {
    return `${toClockTime(start)} - ${toClockTime(end)}`;
  }

  if (start) {
    return `Starts ${toClockTime(start)}`;
  }

  return `Ends ${toClockTime(end)}`;
};

const toClockTime = (timeValue: string): string => {
  if (!timeValue) {
    return "";
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return TIME_FORMATTER.format(date);
};

const getStatusBadgeClass = (status: TaskStatus): string => {
  if (status === "Pending") {
    return "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400";
  }

  if (status === "In Progress") {
    return "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400";
};

const getPriorityBadgeClass = (priority: Task["priority"]): string => {
  if (priority === "Critical") {
    return "bg-red-500/10 text-red-700 border-red-300 dark:text-red-400";
  }

  if (priority === "High") {
    return "bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-400";
  }

  if (priority === "Medium") {
    return "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400";
};

export function TaskCalendarSection({ tasks }: TaskCalendarSectionProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [activeFilter, setActiveFilter] = useState<CalendarTaskFilter>("Open");
  const [searchTerm, setSearchTerm] = useState("");

  const dayBuckets = useMemo(() => {
    const buckets = new Map<string, TaskDayBucket>();

    for (const task of tasks) {
      const taskDate = parseTaskDate(task);
      if (!taskDate) {
        continue;
      }

      const dateKey = format(taskDate, "yyyy-MM-dd");
      const existingBucket = buckets.get(dateKey);

      if (existingBucket) {
        existingBucket.tasks.push(task);

        if (task.status === "Pending") {
          existingBucket.pendingCount += 1;
        } else if (task.status === "In Progress") {
          existingBucket.inProgressCount += 1;
        } else {
          existingBucket.completedCount += 1;
        }

        continue;
      }

      buckets.set(dateKey, {
        key: dateKey,
        date: taskDate,
        tasks: [task],
        pendingCount: task.status === "Pending" ? 1 : 0,
        inProgressCount: task.status === "In Progress" ? 1 : 0,
        completedCount: task.status === "Completed" ? 1 : 0,
      });
    }

    for (const bucket of buckets.values()) {
      bucket.tasks.sort((first, second) => {
        if (STATUS_SORT_ORDER[first.status] !== STATUS_SORT_ORDER[second.status]) {
          return STATUS_SORT_ORDER[first.status] - STATUS_SORT_ORDER[second.status];
        }

        if (PRIORITY_SORT_ORDER[first.priority] !== PRIORITY_SORT_ORDER[second.priority]) {
          return PRIORITY_SORT_ORDER[first.priority] - PRIORITY_SORT_ORDER[second.priority];
        }

        return first.id.localeCompare(second.id);
      });
    }

    return buckets;
  }, [tasks]);

  const monthlySummary = useMemo(() => {
    return Array.from(dayBuckets.values()).reduce(
      (accumulator, bucket) => {
        if (!isSameMonth(bucket.date, visibleMonth)) {
          return accumulator;
        }

        accumulator.pending += bucket.pendingCount;
        accumulator.inProgress += bucket.inProgressCount;
        accumulator.completed += bucket.completedCount;
        accumulator.total += bucket.tasks.length;

        return accumulator;
      },
      { pending: 0, inProgress: 0, completed: 0, total: 0 }
    );
  }, [dayBuckets, visibleMonth]);

  const completionRate =
    monthlySummary.total > 0
      ? Math.round((monthlySummary.completed / monthlySummary.total) * 100)
      : 0;

  const dayCells = useMemo(() => {
    const firstVisibleDay = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const lastVisibleDay = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    const cells: Date[] = [];

    let current = firstVisibleDay;
    while (current <= lastVisibleDay) {
      cells.push(current);
      current = addDays(current, 1);
    }

    return cells;
  }, [visibleMonth]);

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

  const selectedDayBucket = dayBuckets.get(selectedDateKey) ?? {
    key: selectedDateKey,
    date: selectedDate,
    tasks: [],
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
  };

  const selectedDayTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return selectedDayBucket.tasks.filter((task) => {
      const matchesFilter =
        activeFilter === "All"
          ? true
          : activeFilter === "Open"
          ? task.status === "Pending" || task.status === "In Progress"
          : task.status === activeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        task.id.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch) ||
        task.department.toLowerCase().includes(normalizedSearch) ||
        task.category.toLowerCase().includes(normalizedSearch) ||
        task.staffName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeFilter, searchTerm, selectedDayBucket.tasks]);

  const openTaskSnapshot = useMemo(() => {
    const now = new Date();
    const dueItems: TaskDueItem[] = tasks
      .filter((task) => task.status !== "Completed")
      .map((task) => {
        const dueAt = parseTaskDueAt(task);

        return dueAt
          ? {
              task,
              dueAt,
            }
          : null;
      })
      .filter((item): item is TaskDueItem => item !== null)
      .sort((first, second) => compareAsc(first.dueAt, second.dueAt));

    const overdue = dueItems.filter((item) => item.dueAt < now);
    const upcoming = dueItems.filter((item) => item.dueAt >= now);

    return {
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      nextUpcoming: upcoming.slice(0, 3),
    };
  }, [tasks]);

  return (
    <section className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              Task Calendar Planner
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Calendar ledger for pending, in-progress, and completed tasks with day-level visibility.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/record-task"
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors",
                "hover:bg-primary/90"
              )}
            >
              <Plus className="h-4 w-4" />
              Record Task
            </Link>
            <Link
              to="/task-logs"
              className={cn(
                "inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-medium text-foreground transition-colors",
                "hover:bg-muted"
              )}
            >
              <ListTodo className="h-4 w-4" />
              Open Task Logs
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-sm font-semibold text-foreground">{monthlySummary.pending}</p>
          </div>
          <div className="rounded-md border border-blue-500/25 bg-blue-500/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">In Progress</p>
            <p className="text-sm font-semibold text-foreground">{monthlySummary.inProgress}</p>
          </div>
          <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completed</p>
            <p className="text-sm font-semibold text-foreground">{monthlySummary.completed}</p>
          </div>
          <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Month Total</p>
            <p className="text-sm font-semibold text-foreground">{monthlySummary.total}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completion Rate</p>
            <p className="text-sm font-semibold text-foreground">{completionRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr]">
        <div className="border-b border-border p-4 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{format(visibleMonth, "MMMM yyyy")}</p>
              <p className="text-xs text-muted-foreground">Click a date to inspect task details.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = startOfDay(new Date());
                  setVisibleMonth(startOfMonth(today));
                  setSelectedDate(today);
                }}
              >
                Today
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
            ))}

            {dayCells.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const bucket = dayBuckets.get(dayKey);
              const isCurrentMonth = isSameMonth(day, visibleMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  type="button"
                  key={dayKey}
                  onClick={() => setSelectedDate(startOfDay(day))}
                  className={cn(
                    "min-h-[100px] rounded-lg border p-2 text-left transition-colors",
                    isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground/70",
                    bucket?.tasks.length ? "border-primary/20 hover:bg-primary/5" : "border-border hover:bg-muted/40",
                    isSelected && "ring-2 ring-primary/70 border-primary/40",
                    isToday && "shadow-[inset_0_0_0_1px] shadow-primary/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("text-xs font-semibold", isToday && "text-primary")}>{format(day, "d")}</span>
                    {bucket?.tasks.length ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {bucket.tasks.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1">
                    {bucket?.pendingCount ? (
                      <p className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        P {bucket.pendingCount}
                      </p>
                    ) : null}
                    {bucket?.inProgressCount ? (
                      <p className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                        IP {bucket.inProgressCount}
                      </p>
                    ) : null}
                    {bucket?.completedCount ? (
                      <p className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        C {bucket.completedCount}
                      </p>
                    ) : null}
                    {!bucket?.tasks.length && isCurrentMonth ? (
                      <p className="pt-1 text-[10px] text-muted-foreground/80">No tasks</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">{format(selectedDayBucket.date, "EEEE, MMM d, yyyy")}</h3>
              <p className="text-xs text-muted-foreground">
                {(selectedDayBucket.pendingCount + selectedDayBucket.inProgressCount) > 0
                  ? `${selectedDayBucket.pendingCount + selectedDayBucket.inProgressCount} open tasks for this day`
                  : "No open tasks for this day"}
              </p>
            </div>
            <Badge variant="outline" className="text-[11px]">
              {selectedDayBucket.tasks.length} total
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TASK_STATUS_FILTERS.map((filterItem) => (
              <button
                key={filterItem.key}
                type="button"
                onClick={() => setActiveFilter(filterItem.key)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  activeFilter === filterItem.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {filterItem.label}
              </button>
            ))}
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search selected-day tasks"
              className="h-9 pl-9"
            />
          </div>

          <div className="mt-4 rounded-lg border border-border">
            <ScrollArea className="h-[360px]">
              <div className="space-y-3 p-3">
                {selectedDayTasks.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    No tasks match the selected filter for this date.
                  </div>
                ) : (
                  selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md border border-border bg-background p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary">{task.id}</p>
                          <p className="line-clamp-2 text-sm text-foreground">{task.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.department} - {task.category} - {task.staffName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 text-[10px]", getStatusBadgeClass(task.status))}
                        >
                          {task.status}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", getPriorityBadgeClass(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTaskSchedule(task)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                <TriangleAlert className="h-3.5 w-3.5" />
                Overdue Open
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">{openTaskSnapshot.overdueCount}</p>
            </div>

            <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                <Timer className="h-3.5 w-3.5" />
                Upcoming Open
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">{openTaskSnapshot.upcomingCount}</p>
            </div>
          </div>

          {openTaskSnapshot.nextUpcoming.length > 0 ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next Open Tasks
              </p>
              <div className="mt-2 space-y-1.5">
                {openTaskSnapshot.nextUpcoming.map((entry) => (
                  <p key={entry.task.id} className="text-xs text-foreground">
                    <span className="font-semibold text-primary">{entry.task.id}</span>{" "}
                    {entry.task.description} ({format(entry.dueAt, "MMM d, h:mm a")})
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
