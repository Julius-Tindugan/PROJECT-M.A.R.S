const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface DashboardStats {
  totalTasks: number;
  totalTasksTrend: string;
  mostFrequentIssue: string;
  mostFrequentIssueCount: number;
  topDepartment: string;
  topDepartmentReports: number;
  pending: number;
  completed: number;
  completionRate: number;
  avgResponseTime: string;
  resolutionRate: string;
  customerSatisfaction: string;
}

export interface WeeklyTrend {
  day: string;
  tasks: number;
  resolved: number;
}

export interface DepartmentData {
  dept: string;
  volume: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(response);
  },

  async getWeeklyTrends(): Promise<WeeklyTrend[]> {
    const response = await fetch(`${API_URL}/dashboard/weekly-trends`);
    return handleResponse<WeeklyTrend[]>(response);
  },

  async getDepartments(): Promise<DepartmentData[]> {
    const response = await fetch(`${API_URL}/dashboard/departments`);
    return handleResponse<DepartmentData[]>(response);
  },

  async createTask(task: CreateTaskPayload): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(task),
    });
    return handleResponse(response);
  },
};

export default api;
