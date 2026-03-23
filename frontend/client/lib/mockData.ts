// Mock Data Store for M.A.R.S (Maintenance, Analytics, & Recording System)
// This provides comprehensive mock data for frontend-only mode

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  TASKS: "mars_tasks",
  USER: "mars_user",
  THEME: "theme",
  DEPARTMENTS: "mars_departments",
  CATEGORIES: "mars_categories",
  STAFF: "mars_staff",
} as const;

// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DEPARTMENTS = [
  "Emergency Room (ER)",
  "Radiology",
  "Billing",
  "Pharmacy",
  "Cashier",
  "Laboratory",
  "OPD (Outpatient)",
  "IPD (Inpatient)",
  "ICU",
  "Operating Room",
  "Medical Records",
  "Human Resources",
  "Admitting",
  "Nursing Station 1",
  "Nursing Station 2",
  "Administration",
];

const DEFAULT_CATEGORIES = [
  "Computer Hardware",
  "Network",
  "Printer",
  "Software",
  "CCTV",
  "Bizbox System Encoding",
  "Email/Communication",
  "Server Maintenance",
  "Data Backup",
  "System Installation",
];

const DEFAULT_STAFF = [
  "John Santos",
  "Maria Garcia",
  "Carlos Reyes",
  "Ana Cruz",
  "Miguel Torres",
];

// ============================================================
// DEPARTMENTS CRUD
// ============================================================

export const loadDepartments = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading departments:", e);
  }
  return [...DEFAULT_DEPARTMENTS];
};

export const saveDepartments = (departments: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  } catch (e) {
    console.error("Error saving departments:", e);
  }
};

export const addDepartment = (name: string): { success: boolean; message: string } => {
  const departments = loadDepartments();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, message: "Department name cannot be empty" };
  }

  if (departments.some(d => d.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, message: "Department already exists" };
  }

  departments.push(trimmedName);
  saveDepartments(departments);
  return { success: true, message: "Department added successfully" };
};

export const updateDepartment = (oldName: string, newName: string): { success: boolean; message: string } => {
  const departments = loadDepartments();
  const trimmedNewName = newName.trim();

  if (!trimmedNewName) {
    return { success: false, message: "Department name cannot be empty" };
  }

  const index = departments.findIndex(d => d === oldName);
  if (index === -1) {
    return { success: false, message: "Department not found" };
  }

  if (departments.some((d, i) => i !== index && d.toLowerCase() === trimmedNewName.toLowerCase())) {
    return { success: false, message: "Department name already exists" };
  }

  departments[index] = trimmedNewName;
  saveDepartments(departments);
  return { success: true, message: "Department updated successfully" };
};

export const deleteDepartment = (name: string): { success: boolean; message: string } => {
  const departments = loadDepartments();
  const index = departments.findIndex(d => d === name);

  if (index === -1) {
    return { success: false, message: "Department not found" };
  }

  departments.splice(index, 1);
  saveDepartments(departments);
  return { success: true, message: "Department deleted successfully" };
};

// ============================================================
// CATEGORIES CRUD
// ============================================================

export const loadCategories = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading categories:", e);
  }
  return [...DEFAULT_CATEGORIES];
};

export const saveCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error("Error saving categories:", e);
  }
};

export const addCategory = (name: string): { success: boolean; message: string } => {
  const categories = loadCategories();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, message: "Category name cannot be empty" };
  }

  if (categories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, message: "Category already exists" };
  }

  categories.push(trimmedName);
  saveCategories(categories);
  return { success: true, message: "Category added successfully" };
};

export const updateCategory = (oldName: string, newName: string): { success: boolean; message: string } => {
  const categories = loadCategories();
  const trimmedNewName = newName.trim();

  if (!trimmedNewName) {
    return { success: false, message: "Category name cannot be empty" };
  }

  const index = categories.findIndex(c => c === oldName);
  if (index === -1) {
    return { success: false, message: "Category not found" };
  }

  if (categories.some((c, i) => i !== index && c.toLowerCase() === trimmedNewName.toLowerCase())) {
    return { success: false, message: "Category name already exists" };
  }

  categories[index] = trimmedNewName;
  saveCategories(categories);
  return { success: true, message: "Category updated successfully" };
};

export const deleteCategory = (name: string): { success: boolean; message: string } => {
  const categories = loadCategories();
  const index = categories.findIndex(c => c === name);

  if (index === -1) {
    return { success: false, message: "Category not found" };
  }

  categories.splice(index, 1);
  saveCategories(categories);
  return { success: true, message: "Category deleted successfully" };
};

// ============================================================
// STAFF CRUD
// ============================================================

export const loadStaff = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading staff:", e);
  }
  return [...DEFAULT_STAFF];
};

export const saveStaff = (staff: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  } catch (e) {
    console.error("Error saving staff:", e);
  }
};

export const addStaff = (name: string): { success: boolean; message: string } => {
  const staff = loadStaff();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, message: "Staff name cannot be empty" };
  }

  if (staff.some(s => s.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, message: "Staff member already exists" };
  }

  staff.push(trimmedName);
  saveStaff(staff);
  return { success: true, message: "Staff member added successfully" };
};

export const updateStaff = (oldName: string, newName: string): { success: boolean; message: string } => {
  const staff = loadStaff();
  const trimmedNewName = newName.trim();

  if (!trimmedNewName) {
    return { success: false, message: "Staff name cannot be empty" };
  }

  const index = staff.findIndex(s => s === oldName);
  if (index === -1) {
    return { success: false, message: "Staff member not found" };
  }

  if (staff.some((s, i) => i !== index && s.toLowerCase() === trimmedNewName.toLowerCase())) {
    return { success: false, message: "Staff name already exists" };
  }

  staff[index] = trimmedNewName;
  saveStaff(staff);
  return { success: true, message: "Staff member updated successfully" };
};

export const deleteStaff = (name: string): { success: boolean; message: string } => {
  const staff = loadStaff();
  const index = staff.findIndex(s => s === name);

  if (index === -1) {
    return { success: false, message: "Staff member not found" };
  }

  staff.splice(index, 1);
  saveStaff(staff);
  return { success: true, message: "Staff member deleted successfully" };
};

// Reset all data to defaults
export const resetToDefaults = (): void => {
  saveDepartments(DEFAULT_DEPARTMENTS);
  saveCategories(DEFAULT_CATEGORIES);
  saveStaff(DEFAULT_STAFF);
};

// ============================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================

// These are now function calls - components should use loadDepartments(), loadCategories(), loadStaff() directly
export const DEPARTMENTS = loadDepartments();
export const TASK_CATEGORIES = loadCategories();
export const IT_STAFF = loadStaff();

// ============================================================
// TASK TYPES AND INTERFACE
// ============================================================

export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: string;
  description: string;
  department: string;
  category: string;
  staffName: string;
  priority: TaskPriority;
  status: TaskStatus;
  date: string;
  startTime: string;
  endTime: string;
  remarks: string;
  createdAt: string;
}

// Calculate duration from start and end time
export const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "-";

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// ============================================================
// MOCK TASKS DATA
// ============================================================

export const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [
    {
      id: "T-2024-001",
      description: "Desktop computer not booting - replaced faulty RAM module",
      department: "Emergency Room (ER)",
      category: "Computer Hardware",
      staffName: "John Santos",
      priority: "Critical",
      status: "Completed",
      date: "2024-03-20",
      startTime: "08:30",
      endTime: "10:15",
      remarks: "RAM module replaced successfully. System running normally.",
      createdAt: "2024-03-20T08:30:00",
    },
    {
      id: "T-2024-002",
      description: "PACS system connectivity issues - reconfigured network switch",
      department: "Radiology",
      category: "Network",
      staffName: "Maria Garcia",
      priority: "High",
      status: "Completed",
      date: "2024-03-20",
      startTime: "09:00",
      endTime: "11:30",
      remarks: "Network switch port reconfigured. PACS connection restored.",
      createdAt: "2024-03-20T09:00:00",
    },
    {
      id: "T-2024-003",
      description: "Receipt printer paper jam - cleared jam and replaced roller",
      department: "Billing",
      category: "Printer",
      staffName: "Carlos Reyes",
      priority: "Medium",
      status: "Completed",
      date: "2024-03-20",
      startTime: "10:45",
      endTime: "11:00",
      remarks: "Roller replaced. Advised staff on proper paper loading.",
      createdAt: "2024-03-20T10:45:00",
    },
    {
      id: "T-2024-004",
      description: "Encoding new medicine inventory into Bizbox system",
      department: "Pharmacy",
      category: "Bizbox System Encoding",
      staffName: "Ana Cruz",
      priority: "Medium",
      status: "In Progress",
      date: "2024-03-21",
      startTime: "08:00",
      endTime: "",
      remarks: "Currently encoding 150 new items. Expected completion by EOD.",
      createdAt: "2024-03-21T08:00:00",
    },
    {
      id: "T-2024-005",
      description: "POS software update required - scheduling update",
      department: "Cashier",
      category: "Software",
      staffName: "Miguel Torres",
      priority: "Low",
      status: "Pending",
      date: "2024-03-21",
      startTime: "",
      endTime: "",
      remarks: "Scheduled for after business hours.",
      createdAt: "2024-03-21T09:30:00",
    },
    {
      id: "T-2024-006",
      description: "Lab workstation monitor flickering - replaced display cable",
      department: "Laboratory",
      category: "Computer Hardware",
      staffName: "John Santos",
      priority: "High",
      status: "Completed",
      date: "2024-03-19",
      startTime: "14:00",
      endTime: "15:30",
      remarks: "VGA cable was loose. Replaced with new HDMI cable.",
      createdAt: "2024-03-19T14:00:00",
    },
    {
      id: "T-2024-007",
      description: "WiFi connectivity drop - replaced access point",
      department: "ICU",
      category: "Network",
      staffName: "Maria Garcia",
      priority: "Critical",
      status: "Completed",
      date: "2024-03-19",
      startTime: "16:00",
      endTime: "18:00",
      remarks: "Old AP was malfunctioning. Installed new UniFi AP.",
      createdAt: "2024-03-19T16:00:00",
    },
    {
      id: "T-2024-008",
      description: "Weekly backup verification and cleanup",
      department: "Medical Records",
      category: "Data Backup",
      staffName: "Carlos Reyes",
      priority: "High",
      status: "Completed",
      date: "2024-03-18",
      startTime: "07:00",
      endTime: "08:30",
      remarks: "All backups verified. Old logs cleaned up.",
      createdAt: "2024-03-18T07:00:00",
    },
    {
      id: "T-2024-009",
      description: "Wristband printer not working - replaced print head",
      department: "Admitting",
      category: "Printer",
      staffName: "Ana Cruz",
      priority: "High",
      status: "Completed",
      date: "2024-03-18",
      startTime: "11:00",
      endTime: "13:00",
      remarks: "Print head was worn out. New head installed and calibrated.",
      createdAt: "2024-03-18T11:00:00",
    },
    {
      id: "T-2024-010",
      description: "Camera #5 offline in parking area - power supply replaced",
      department: "Administration",
      category: "CCTV",
      staffName: "Miguel Torres",
      priority: "Medium",
      status: "Completed",
      date: "2024-03-18",
      startTime: "14:00",
      endTime: "16:00",
      remarks: "Power adapter was faulty. Replaced with new 12V adapter.",
      createdAt: "2024-03-18T14:00:00",
    },
    {
      id: "T-2024-011",
      description: "HRIS software login issues - password reset and cache cleared",
      department: "Human Resources",
      category: "Software",
      staffName: "John Santos",
      priority: "Low",
      status: "Completed",
      date: "2024-03-17",
      startTime: "09:00",
      endTime: "09:30",
      remarks: "User password reset. Browser cache cleared.",
      createdAt: "2024-03-17T09:00:00",
    },
    {
      id: "T-2024-012",
      description: "Keyboard replacement - spilled coffee damage",
      department: "OPD (Outpatient)",
      category: "Computer Hardware",
      staffName: "Maria Garcia",
      priority: "Low",
      status: "Completed",
      date: "2024-03-17",
      startTime: "10:30",
      endTime: "11:00",
      remarks: "Replaced with spare keyboard from inventory.",
      createdAt: "2024-03-17T10:30:00",
    },
    {
      id: "T-2024-013",
      description: "Medical imaging transfer slow - bandwidth optimization",
      department: "Operating Room",
      category: "Network",
      staffName: "Carlos Reyes",
      priority: "Critical",
      status: "In Progress",
      date: "2024-03-21",
      startTime: "11:00",
      endTime: "",
      remarks: "Analyzing network traffic. QoS rules being configured.",
      createdAt: "2024-03-21T11:00:00",
    },
    {
      id: "T-2024-014",
      description: "Medication label printer maintenance required",
      department: "Nursing Station 1",
      category: "Printer",
      staffName: "Ana Cruz",
      priority: "Medium",
      status: "Pending",
      date: "2024-03-21",
      startTime: "",
      endTime: "",
      remarks: "Scheduled for routine maintenance.",
      createdAt: "2024-03-21T13:00:00",
    },
    {
      id: "T-2024-015",
      description: "Email server sync issues - Outlook configuration fix",
      department: "Administration",
      category: "Email/Communication",
      staffName: "Miguel Torres",
      priority: "Medium",
      status: "Completed",
      date: "2024-03-16",
      startTime: "08:00",
      endTime: "10:00",
      remarks: "Outlook profile recreated. Exchange sync restored.",
      createdAt: "2024-03-16T08:00:00",
    },
    {
      id: "T-2024-016",
      description: "Invoice printer faded prints - replaced toner cartridge",
      department: "Cashier",
      category: "Printer",
      staffName: "John Santos",
      priority: "Medium",
      status: "Completed",
      date: "2024-03-15",
      startTime: "14:00",
      endTime: "14:30",
      remarks: "New toner installed. Print quality restored.",
      createdAt: "2024-03-15T14:00:00",
    },
    {
      id: "T-2024-017",
      description: "CPU overheating - cleaned fans and reapplied thermal paste",
      department: "Billing",
      category: "Computer Hardware",
      staffName: "Maria Garcia",
      priority: "High",
      status: "Completed",
      date: "2024-03-15",
      startTime: "15:00",
      endTime: "17:00",
      remarks: "Heavy dust buildup. Full cleaning performed.",
      createdAt: "2024-03-15T15:00:00",
    },
    {
      id: "T-2024-018",
      description: "Drug inventory system connectivity restored",
      department: "Pharmacy",
      category: "Network",
      staffName: "Carlos Reyes",
      priority: "High",
      status: "Completed",
      date: "2024-03-14",
      startTime: "09:00",
      endTime: "10:30",
      remarks: "Network cable was damaged. Replaced with new Cat6.",
      createdAt: "2024-03-14T09:00:00",
    },
    {
      id: "T-2024-019",
      description: "Nurse station camera angle adjustment",
      department: "IPD (Inpatient)",
      category: "CCTV",
      staffName: "Ana Cruz",
      priority: "Low",
      status: "Completed",
      date: "2024-03-14",
      startTime: "11:00",
      endTime: "11:30",
      remarks: "Camera repositioned per nursing supervisor request.",
      createdAt: "2024-03-14T11:00:00",
    },
    {
      id: "T-2024-020",
      description: "Patient monitoring software update installation",
      department: "Nursing Station 2",
      category: "Software",
      staffName: "Miguel Torres",
      priority: "High",
      status: "Pending",
      date: "2024-03-21",
      startTime: "",
      endTime: "",
      remarks: "Update downloaded. Waiting for approval from dept head.",
      createdAt: "2024-03-21T14:00:00",
    },
  ];
  return tasks;
};

// ============================================================
// TASKS CRUD
// ============================================================

export const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading tasks from localStorage:", e);
  }
  return generateMockTasks();
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error("Error saving tasks to localStorage:", e);
  }
};

export const generateTaskId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `T-${year}-${random}`;
};

// ============================================================
// ANALYTICS DATA
// ============================================================

export interface WeeklyTrendData {
  day: string;
  tasks: number;
  resolved: number;
}

export const getWeeklyTrendData = (): WeeklyTrendData[] => [
  { day: "Mon", tasks: 18, resolved: 15 },
  { day: "Tue", tasks: 24, resolved: 20 },
  { day: "Wed", tasks: 22, resolved: 19 },
  { day: "Thu", tasks: 28, resolved: 24 },
  { day: "Fri", tasks: 32, resolved: 27 },
  { day: "Sat", tasks: 12, resolved: 10 },
  { day: "Sun", tasks: 8, resolved: 7 },
];

export interface MonthlyTrendData {
  month: string;
  tasks: number;
  resolved: number;
}

export const getMonthlyTrendData = (): MonthlyTrendData[] => [
  { month: "Jan", tasks: 145, resolved: 132 },
  { month: "Feb", tasks: 168, resolved: 155 },
  { month: "Mar", tasks: 187, resolved: 172 },
];

export interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export const getCategoryDistribution = (): CategoryData[] => [
  { category: "Printer", count: 89, percentage: 28, color: "#f59e0b" },
  { category: "Computer Hardware", count: 72, percentage: 22, color: "#3b82f6" },
  { category: "Network", count: 58, percentage: 18, color: "#10b981" },
  { category: "Software", count: 45, percentage: 14, color: "#8b5cf6" },
  { category: "Bizbox System Encoding", count: 32, percentage: 10, color: "#ec4899" },
  { category: "CCTV", count: 18, percentage: 6, color: "#06b6d4" },
  { category: "Email/Communication", count: 8, percentage: 2, color: "#84cc16" },
];

export interface DepartmentRanking {
  rank: number;
  department: string;
  totalReports: number;
  resolved: number;
  pending: number;
  inProgress: number;
  avgResolutionTime: string;
  heatLevel: "low" | "medium" | "high" | "critical";
}

export const getDepartmentRankings = (): DepartmentRanking[] => [
  {
    rank: 1,
    department: "Cashier",
    totalReports: 45,
    resolved: 38,
    pending: 4,
    inProgress: 3,
    avgResolutionTime: "1.8 hrs",
    heatLevel: "critical",
  },
  {
    rank: 2,
    department: "Billing",
    totalReports: 42,
    resolved: 36,
    pending: 3,
    inProgress: 3,
    avgResolutionTime: "2.1 hrs",
    heatLevel: "critical",
  },
  {
    rank: 3,
    department: "Emergency Room (ER)",
    totalReports: 38,
    resolved: 35,
    pending: 2,
    inProgress: 1,
    avgResolutionTime: "1.2 hrs",
    heatLevel: "high",
  },
  {
    rank: 4,
    department: "Pharmacy",
    totalReports: 32,
    resolved: 28,
    pending: 2,
    inProgress: 2,
    avgResolutionTime: "2.5 hrs",
    heatLevel: "high",
  },
  {
    rank: 5,
    department: "Laboratory",
    totalReports: 28,
    resolved: 24,
    pending: 2,
    inProgress: 2,
    avgResolutionTime: "2.8 hrs",
    heatLevel: "medium",
  },
  {
    rank: 6,
    department: "Radiology",
    totalReports: 25,
    resolved: 22,
    pending: 2,
    inProgress: 1,
    avgResolutionTime: "3.0 hrs",
    heatLevel: "medium",
  },
  {
    rank: 7,
    department: "Medical Records",
    totalReports: 22,
    resolved: 19,
    pending: 1,
    inProgress: 2,
    avgResolutionTime: "2.2 hrs",
    heatLevel: "medium",
  },
  {
    rank: 8,
    department: "Admitting",
    totalReports: 18,
    resolved: 16,
    pending: 1,
    inProgress: 1,
    avgResolutionTime: "1.9 hrs",
    heatLevel: "low",
  },
  {
    rank: 9,
    department: "OPD (Outpatient)",
    totalReports: 15,
    resolved: 13,
    pending: 1,
    inProgress: 1,
    avgResolutionTime: "2.4 hrs",
    heatLevel: "low",
  },
  {
    rank: 10,
    department: "IPD (Inpatient)",
    totalReports: 12,
    resolved: 11,
    pending: 0,
    inProgress: 1,
    avgResolutionTime: "2.6 hrs",
    heatLevel: "low",
  },
];

export interface DashboardStats {
  totalTasks: number;
  totalTasksTrend: string;
  mostFrequentIssue: string;
  mostFrequentIssueCount: number;
  topDepartment: string;
  topDepartmentReports: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
  avgResponseTime: string;
  dailyAverage: number;
}

export const getDashboardStats = (): DashboardStats => ({
  totalTasks: 322,
  totalTasksTrend: "+18% from last month",
  mostFrequentIssue: "Printer Repair",
  mostFrequentIssueCount: 89,
  topDepartment: "Cashier",
  topDepartmentReports: 45,
  pending: 15,
  inProgress: 12,
  completed: 295,
  completionRate: 92,
  avgResponseTime: "2.1 hrs",
  dailyAverage: 11,
});

export interface ItemRanking {
  rank: number;
  item: string;
  category: string;
  reportCount: number;
  lastReported: string;
}

export const getItemRankings = (): ItemRanking[] => [
  { rank: 1, item: "Receipt Printer - Cashier", category: "Printer", reportCount: 18, lastReported: "2024-03-21" },
  { rank: 2, item: "Workstation PC - Billing", category: "Computer Hardware", reportCount: 15, lastReported: "2024-03-20" },
  { rank: 3, item: "Network Switch - ER", category: "Network", reportCount: 12, lastReported: "2024-03-19" },
  { rank: 4, item: "Label Printer - Pharmacy", category: "Printer", reportCount: 11, lastReported: "2024-03-18" },
  { rank: 5, item: "Bizbox Terminal - Cashier", category: "Bizbox System Encoding", reportCount: 10, lastReported: "2024-03-21" },
];
