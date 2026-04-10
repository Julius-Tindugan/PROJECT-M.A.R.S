const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type MetadataType = "departments" | "categories" | "staff";

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
  resolutionRate: string;
  customerSatisfaction: string;
}

export interface WeeklyTrend {
  day: string;
  tasks: number;
  resolved: number;
}

export interface MonthlyTrend {
  month: string;
  tasks: number;
  resolved: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

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

export interface ItemRanking {
  rank: number;
  item: string;
  category: string;
  reportCount: number;
  lastReported: string | null;
}

export interface MetadataItem {
  id: number;
  name: string;
}

export interface CreateTaskPayload {
  description: string;
  department: string;
  category: string;
  staffName: string;
  priority: TaskPriority;
  status: TaskStatus;
  date: string;
  startTime?: string;
  endTime?: string;
  remarks?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  startTime?: string;
  endTime?: string;
}

interface CreateTaskResponse {
  success: boolean;
  message: string;
  task: Task;
}

interface UpdateTaskStatusResponse {
  success: boolean;
  message: string;
  task: Task;
}

interface MetadataMutationResponse {
  success: boolean;
  message: string;
  item?: MetadataItem;
}

const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await parseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message?: string }).message)
        : `API Error: ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/tasks`);
    return handleResponse<Task[]>(response);
  },

  async getRecentTasks(limit = 5): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.slice(0, limit);
  },

  async createTask(task: CreateTaskPayload): Promise<CreateTaskResponse> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(task),
    });

    return handleResponse<CreateTaskResponse>(response);
  },

  async updateTaskStatus(taskId: string, payload: UpdateTaskStatusPayload): Promise<UpdateTaskStatusResponse> {
    const response = await fetch(`${API_URL}/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });

    return handleResponse<UpdateTaskStatusResponse>(response);
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(response);
  },

  async getWeeklyTrends(): Promise<WeeklyTrend[]> {
    const response = await fetch(`${API_URL}/dashboard/weekly-trends`);
    return handleResponse<WeeklyTrend[]>(response);
  },

  async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    const response = await fetch(`${API_URL}/dashboard/monthly-trends`);
    return handleResponse<MonthlyTrend[]>(response);
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await fetch(`${API_URL}/analytics/categories`);
    return handleResponse<CategoryDistribution[]>(response);
  },

  async getDepartmentRankings(): Promise<DepartmentRanking[]> {
    const response = await fetch(`${API_URL}/rankings/departments`);
    return handleResponse<DepartmentRanking[]>(response);
  },

  async getItemRankings(): Promise<ItemRanking[]> {
    const response = await fetch(`${API_URL}/rankings/items`);
    return handleResponse<ItemRanking[]>(response);
  },

  async getMetadata(type: MetadataType): Promise<MetadataItem[]> {
    const response = await fetch(`${API_URL}/metadata/${type}`);
    return handleResponse<MetadataItem[]>(response);
  },

  async createMetadata(type: MetadataType, name: string): Promise<MetadataMutationResponse> {
    const response = await fetch(`${API_URL}/metadata/${type}`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ name }),
    });

    return handleResponse<MetadataMutationResponse>(response);
  },

  async updateMetadata(type: MetadataType, id: number, name: string): Promise<MetadataMutationResponse> {
    const response = await fetch(`${API_URL}/metadata/${type}/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({ name }),
    });

    return handleResponse<MetadataMutationResponse>(response);
  },

  async deleteMetadata(type: MetadataType, id: number): Promise<MetadataMutationResponse> {
    const response = await fetch(`${API_URL}/metadata/${type}/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    return handleResponse<MetadataMutationResponse>(response);
  },

  async resetMetadata(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/metadata/reset`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    return handleResponse<{ success: boolean; message: string }>(response);
  },

  async getDepartments(): Promise<string[]> {
    const items = await this.getMetadata("departments");
    return items.map((item) => item.name);
  },

  async getCategories(): Promise<string[]> {
    const items = await this.getMetadata("categories");
    return items.map((item) => item.name);
  },

  async getStaff(): Promise<string[]> {
    const items = await this.getMetadata("staff");
    return items.map((item) => item.name);
  },
};

export const calculateDuration = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return "-";

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
  if (totalMinutes < 0) totalMinutes += 24 * 60;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export default api;
