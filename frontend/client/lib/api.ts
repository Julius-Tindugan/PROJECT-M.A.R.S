/**
 * M.A.R.S API Client
 * Complete API integration for Maintenance, Analytics, & Recording System
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Task {
  id: string;
  taskId: string;
  dbId: number;
  description: string;
  department: string;
  category: string;
  staffName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  requestedBy?: string;
  date: string;
  startTime: string;
  endTime: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  history?: TaskHistoryEntry[];
}

export interface TaskHistoryEntry {
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

export interface CreateTaskPayload {
  description: string;
  department?: string;
  department_id?: number;
  category?: string;
  category_id?: number;
  staff?: string;
  staff_id?: number;
  priority?: string;
  priority_id?: number;
  status?: string;
  status_id?: number;
  requester?: string;
  date: string;
  starttime?: string;
  endtime?: string;
  remarks?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

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

export interface DepartmentData {
  dept: string;
  volume: number;
}

export interface DepartmentRanking {
  rank: number;
  department: string;
  totalReports: number;
  resolved: number;
  pending: number;
  inProgress: number;
  avgResolutionTime: string;
  heatLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ItemRanking {
  rank: number;
  item: string;
  category: string;
  reportCount: number;
  lastReported: string;
}

export interface Department {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Priority {
  id: number;
  name: string;
  level: number;
  color?: string;
}

export interface Status {
  id: number;
  name: string;
  order: number;
  color?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ============================================================
// API CLIENT
// ============================================================

export const api = {
  // ============================================================
  // DASHBOARD ENDPOINTS
  // ============================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(response);
  },

  async getWeeklyTrends(): Promise<WeeklyTrend[]> {
    const response = await fetch(`${API_URL}/dashboard/weekly-trends`);
    return handleResponse<WeeklyTrend[]>(response);
  },

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    const response = await fetch(`${API_URL}/dashboard/monthly-trends?months=${months}`);
    return handleResponse<MonthlyTrend[]>(response);
  },

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await fetch(`${API_URL}/dashboard/category-distribution`);
    return handleResponse<CategoryDistribution[]>(response);
  },

  async getDepartments(): Promise<DepartmentData[]> {
    const response = await fetch(`${API_URL}/dashboard/departments`);
    return handleResponse<DepartmentData[]>(response);
  },

  async getDepartmentRankings(): Promise<DepartmentRanking[]> {
    const response = await fetch(`${API_URL}/dashboard/department-rankings`);
    return handleResponse<DepartmentRanking[]>(response);
  },

  async getPendingTasksForDashboard(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/dashboard/pending-tasks`);
    return handleResponse<Task[]>(response);
  },

  async getTodaySummary(): Promise<{
    date: string;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  }> {
    const response = await fetch(`${API_URL}/dashboard/today`);
    return handleResponse(response);
  },

  // ============================================================
  // TASKS ENDPOINTS
  // ============================================================

  async getTasks(params: {
    search?: string;
    status?: string;
    status_id?: number;
    department?: string;
    department_id?: number;
    category?: string;
    category_id?: number;
    staff?: string;
    staff_id?: number;
    priority?: string;
    priority_id?: number;
    date_from?: string;
    date_to?: string;
    date?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
    paginate?: boolean;
  } = {}): Promise<PaginatedResponse<Task> | ApiResponse<Task[]>> {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}/tasks${queryString}`);
    return handleResponse(response);
  },

  async getTask(id: number | string): Promise<ApiResponse<Task>> {
    const response = await fetch(`${API_URL}/tasks/${id}`);
    return handleResponse<ApiResponse<Task>>(response);
  },

  async createTask(task: CreateTaskPayload): Promise<ApiResponse<Task>> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(task),
    });
    return handleResponse<ApiResponse<Task>>(response);
  },

  async updateTask(id: number | string, task: UpdateTaskPayload): Promise<ApiResponse<Task>> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(task),
    });
    return handleResponse<ApiResponse<Task>>(response);
  },

  async deleteTask(id: number | string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  async updateTaskStatus(id: number | string, status: string): Promise<ApiResponse<{ id: string; status: string }>> {
    const response = await fetch(`${API_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async getTasksByDate(date: string): Promise<ApiResponse<Task[]>> {
    const response = await fetch(`${API_URL}/tasks/by-date?date=${date}`);
    return handleResponse<ApiResponse<Task[]>>(response);
  },

  async getTasksByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Task[]>> {
    const response = await fetch(`${API_URL}/tasks/date-range?start_date=${startDate}&end_date=${endDate}`);
    return handleResponse<ApiResponse<Task[]>>(response);
  },

  async getPendingTasks(limit: number = 10): Promise<ApiResponse<Task[]>> {
    const response = await fetch(`${API_URL}/tasks/pending?limit=${limit}`);
    return handleResponse<ApiResponse<Task[]>>(response);
  },

  async getRecentTasks(limit: number = 5): Promise<ApiResponse<Task[]>> {
    const response = await fetch(`${API_URL}/tasks/recent?limit=${limit}`);
    return handleResponse<ApiResponse<Task[]>>(response);
  },

  // ============================================================
  // DEPARTMENTS ENDPOINTS
  // ============================================================

  async getDepartmentsList(params: { active?: boolean; names_only?: boolean } = {}): Promise<ApiResponse<Department[]> | string[]> {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}/departments${queryString}`);
    return handleResponse(response);
  },

  async getDepartment(id: number): Promise<ApiResponse<Department>> {
    const response = await fetch(`${API_URL}/departments/${id}`);
    return handleResponse<ApiResponse<Department>>(response);
  },

  async createDepartment(name: string, active: boolean = true): Promise<ApiResponse<Department>> {
    const response = await fetch(`${API_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, active }),
    });
    return handleResponse<ApiResponse<Department>>(response);
  },

  async updateDepartment(id: number, data: { name?: string; active?: boolean }): Promise<ApiResponse<Department>> {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Department>>(response);
  },

  async deleteDepartment(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  async getDepartmentStats(id: number): Promise<ApiResponse<{
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    completion_rate: number;
  }>> {
    const response = await fetch(`${API_URL}/departments/${id}/stats`);
    return handleResponse(response);
  },

  // ============================================================
  // CATEGORIES ENDPOINTS
  // ============================================================

  async getCategoriesList(params: { active?: boolean; names_only?: boolean } = {}): Promise<ApiResponse<Category[]> | string[]> {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}/categories${queryString}`);
    return handleResponse(response);
  },

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    const response = await fetch(`${API_URL}/categories/${id}`);
    return handleResponse<ApiResponse<Category>>(response);
  },

  async createCategory(name: string, active: boolean = true): Promise<ApiResponse<Category>> {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, active }),
    });
    return handleResponse<ApiResponse<Category>>(response);
  },

  async updateCategory(id: number, data: { name?: string; active?: boolean }): Promise<ApiResponse<Category>> {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Category>>(response);
  },

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  // ============================================================
  // STAFF ENDPOINTS
  // ============================================================

  async getStaffList(params: { active?: boolean; names_only?: boolean } = {}): Promise<ApiResponse<Staff[]> | string[]> {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}/staff${queryString}`);
    return handleResponse(response);
  },

  async getStaffMember(id: number): Promise<ApiResponse<Staff>> {
    const response = await fetch(`${API_URL}/staff/${id}`);
    return handleResponse<ApiResponse<Staff>>(response);
  },

  async createStaff(data: { name: string; email?: string; phone?: string; active?: boolean }): Promise<ApiResponse<Staff>> {
    const response = await fetch(`${API_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Staff>>(response);
  },

  async updateStaff(id: number, data: { name?: string; email?: string; phone?: string; active?: boolean }): Promise<ApiResponse<Staff>> {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<Staff>>(response);
  },

  async deleteStaff(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  async getStaffStats(id: number): Promise<ApiResponse<{
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    completion_rate: number;
  }>> {
    const response = await fetch(`${API_URL}/staff/${id}/stats`);
    return handleResponse(response);
  },

  // ============================================================
  // REPORTS ENDPOINTS
  // ============================================================

  async getItemRankings(): Promise<ItemRanking[]> {
    const response = await fetch(`${API_URL}/reports/item-rankings`);
    return handleResponse<ItemRanking[]>(response);
  },

  async getStaffPerformance(): Promise<Array<{
    id: number;
    name: string;
    totalTasks: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
    avgResolutionTime: string;
  }>> {
    const response = await fetch(`${API_URL}/reports/staff-performance`);
    return handleResponse(response);
  },

  async getDepartmentLoad(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<Array<{
    department: string;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
    categoryBreakdown: Array<{ category: string; count: number }>;
  }>> {
    const response = await fetch(`${API_URL}/reports/department-load?period=${period}`);
    return handleResponse(response);
  },

  async getPriorityDistribution(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<Array<{
    priority: string;
    count: number;
    percentage: number;
    color: string;
  }>> {
    const response = await fetch(`${API_URL}/reports/priority-distribution?period=${period}`);
    return handleResponse(response);
  },

  async getStatusDistribution(): Promise<Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>> {
    const response = await fetch(`${API_URL}/reports/status-distribution`);
    return handleResponse(response);
  },

  async getDailyTrends(days: number = 30): Promise<Array<{
    date: string;
    label: string;
    tasks: number;
    resolved: number;
  }>> {
    const response = await fetch(`${API_URL}/reports/daily-trends?days=${days}`);
    return handleResponse(response);
  },

  async getComprehensiveReport(startDate: string, endDate: string): Promise<{
    period: { start: string; end: string };
    summary: {
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
      completionRate: number;
    };
    byDepartment: Array<{ department: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    byStaff: Array<{ staff: string; total: number; completed: number }>;
  }> {
    const response = await fetch(`${API_URL}/reports/comprehensive?start_date=${startDate}&end_date=${endDate}`);
    return handleResponse(response);
  },

  // ============================================================
  // UTILITY ENDPOINTS
  // ============================================================

  async getPriorities(): Promise<Priority[]> {
    const response = await fetch(`${API_URL}/priorities`);
    return handleResponse<Priority[]>(response);
  },

  async getStatuses(): Promise<Status[]> {
    const response = await fetch(`${API_URL}/statuses`);
    return handleResponse<Status[]>(response);
  },

  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await fetch(`${API_URL}/health`);
    return handleResponse(response);
  },
};

export default api;
