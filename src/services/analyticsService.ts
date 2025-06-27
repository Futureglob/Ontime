// import { supabase } from "@/integrations/supabase/client"; // This is unused for now as the service is mocked

export interface TaskOverview {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalEmployees: number;
  activeEmployees: number;
  completionRate: number;
  avgCompletionTime: number;
  totalWorkingHours: number;
  averageTasksPerEmployee: number;
  totalTravelDistance: number;
}

export interface TaskTrend {
  date: string;
  completed: number;
  created: number;
  pending?: number;
}

export interface TaskByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TimeAnalytic {
  hour: number;
  taskCount: number;
  completionRate: number;
}

export interface EmployeePerformance {
    name: string;
    completed: number;
    pending: number;
    overdue: number;
    efficiency: number;
}

export interface LocationAnalytic {
    location: string;
    taskCount: number;
    completionRate: number;
}

export const analyticsService = {
  async getTaskAnalytics(organizationId?: string, dateRange?: { start: Date; end: Date; }) {
    console.log("getTaskAnalytics called with", organizationId, dateRange);
    return {
      totalTasks: 100,
      completedTasks: 80,
      pendingTasks: 15,
      overdueTasks: 5,
      completionRate: 80,
      avgCompletionTime: 4.5, // in hours
    };
  },

  async getEmployeePerformance(organizationId?: string, dateRange?: { start: Date; end: Date; }): Promise<EmployeePerformance[]> {
    console.log("getEmployeePerformance called with", organizationId, dateRange);
    return [
      { name: "John Doe", completed: 25, pending: 3, overdue: 1, efficiency: 89 },
      { name: "Jane Smith", completed: 30, pending: 2, overdue: 0, efficiency: 94 },
      { name: "Mike Johnson", completed: 20, pending: 5, overdue: 2, efficiency: 74 },
    ];
  },

  async getLocationAnalytics(organizationId?: string, dateRange?: { start: Date; end: Date; }): Promise<LocationAnalytic[]> {
    console.log("getLocationAnalytics called with", organizationId, dateRange);
    return [
      { location: "Downtown", taskCount: 45, completionRate: 85 },
      { location: "Suburbs", taskCount: 35, completionRate: 78 },
      { location: "Industrial", taskCount: 70, completionRate: 82 },
    ];
  },

  async getTimeSeriesData(organizationId?: string, days: number = 30) {
    console.log("getTimeSeriesData called with", organizationId, days);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        completed: Math.floor(Math.random() * 20) + 10,
        created: Math.floor(Math.random() * 15) + 15,
      });
    }
    return data;
  },

  async getTaskOverview(organizationId: string, dateRange: any): Promise<TaskOverview> {
    console.log("getTaskOverview called with", organizationId, dateRange);
    // Mock implementation
    return {
      totalTasks: 150,
      completedTasks: 120,
      inProgressTasks: 10,
      pendingTasks: 25,
      overdueTasks: 5,
      totalEmployees: 45,
      activeEmployees: 42,
      completionRate: 80,
      avgCompletionTime: 4.5,
      totalWorkingHours: 340.5,
      averageTasksPerEmployee: 3.5,
      totalTravelDistance: 150.2,
    };
  },

  async getTaskTrends(organizationId: string, dateRange: any): Promise<TaskTrend[]> {
    console.log("getTaskTrends called with", organizationId, dateRange);
    // Mock implementation
    return [
      { date: "2024-01-01", completed: 10, created: 15, pending: 5 },
      { date: "2024-01-02", completed: 12, created: 18, pending: 6 },
      { date: "2024-01-03", completed: 8, created: 12, pending: 4 }
    ];
  },

  async getTasksByStatus(organizationId: string): Promise<TaskByStatus[]> {
    console.log("getTasksByStatus called with", organizationId);
    // Mock implementation
    return [
      { status: "Completed", count: 120, percentage: 80 },
      { status: "Pending", count: 25, percentage: 17 },
      { status: "Overdue", count: 5, percentage: 3 }
    ];
  },

  async getTimeAnalytics(organizationId: string, dateRange: any): Promise<TimeAnalytic[]> {
    console.log("getTimeAnalytics called with", organizationId, dateRange);
    // Mock implementation
    return [
      { hour: 8, taskCount: 15, completionRate: 90 },
      { hour: 10, taskCount: 25, completionRate: 85 },
      { hour: 14, taskCount: 30, completionRate: 88 },
      { hour: 16, taskCount: 20, completionRate: 75 }
    ];
  }
};
