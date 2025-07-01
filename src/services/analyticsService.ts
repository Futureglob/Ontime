
import { supabase } from "@/integrations/supabase/client";

export interface TaskOverview {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
}

export interface LocationAnalytics {
  location: string;
  taskCount: number;
  completionRate: number;
}

export interface TaskTrend {
  date: string;
  created: number;
  completed: number;
}

const analyticsService = {
  async getDashboardStats(organizationId: string) {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("status, priority, due_date")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const now = new Date();
    const totalTasks = tasks?.length || 0;
    const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
    const overdueTasks = tasks?.filter(t => 
      t.status !== "completed" && new Date(t.due_date) < now
    ).length || 0;
    const highPriority = tasks?.filter(t => t.priority === "high").length || 0;

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      highPriority
    };
  },

  async getTaskStatusDistribution(organizationId: string) {
    const { data: statusData, error } = await supabase
      .from("tasks")
      .select("status")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const distribution = statusData?.reduce((acc: Record<string, number>, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return distribution;
  },

  async getTaskOverview(organizationId: string): Promise<TaskOverview> {
    const stats = await this.getDashboardStats(organizationId);
    return {
      total: stats.totalTasks,
      pending: stats.pendingTasks,
      completed: stats.completedTasks,
      overdue: stats.overdueTasks
    };
  },

  async getEmployeePerformance(organizationId: string): Promise<EmployeePerformance[]> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        assigned_to,
        status,
        profiles!tasks_assigned_to_fkey(full_name)
      `)
      .eq("organization_id", organizationId);

    if (error) throw error;

    const performanceMap = new Map<string, EmployeePerformance>();
    
    tasks?.forEach(task => {
      if (task.assigned_to) {
        const existing = performanceMap.get(task.assigned_to) || {
          employeeId: task.assigned_to,
          employeeName: (task.profiles as any)?.full_name || "Unknown",
          tasksCompleted: 0,
          tasksAssigned: 0,
          completionRate: 0
        };
        
        existing.tasksAssigned++;
        if (task.status === "completed") {
          existing.tasksCompleted++;
        }
        existing.completionRate = existing.tasksAssigned > 0 
          ? (existing.tasksCompleted / existing.tasksAssigned) * 100 
          : 0;
        
        performanceMap.set(task.assigned_to, existing);
      }
    });

    return Array.from(performanceMap.values());
  },

  async getLocationAnalytics(organizationId: string): Promise<LocationAnalytics[]> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("location_address, status")
      .eq("organization_id", organizationId)
      .not("location_address", "is", null);

    if (error) throw error;

    const locationMap = new Map<string, { total: number; completed: number }>();
    
    tasks?.forEach(task => {
      if (task.location_address) {
        const existing = locationMap.get(task.location_address) || { total: 0, completed: 0 };
        existing.total++;
        if (task.status === "completed") {
          existing.completed++;
        }
        locationMap.set(task.location_address, existing);
      }
    });

    return Array.from(locationMap.entries()).map(([location, stats]) => ({
      location,
      taskCount: stats.total,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }));
  },

  async getTimeSeriesData(organizationId: string, days: number = 30): Promise<TaskTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("created_at, completed_at")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString());

    if (error) throw error;

    const trendMap = new Map<string, { created: number; completed: number }>();
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      trendMap.set(dateStr, { created: 0, completed: 0 });
    }

    tasks?.forEach(task => {
      const createdDate = new Date(task.created_at).toISOString().split("T")[0];
      const existing = trendMap.get(createdDate);
      if (existing) {
        existing.created++;
      }

      if (task.completed_at) {
        const completedDate = new Date(task.completed_at).toISOString().split("T")[0];
        const completedExisting = trendMap.get(completedDate);
        if (completedExisting) {
          completedExisting.completed++;
        }
      }
    });

    return Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      created: stats.created,
      completed: stats.completed
    }));
  },

  async getCreditUsage(organizationId: string) {
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("credits_used, credits_limit")
      .eq("id", organizationId)
      .single();

    if (error) throw error;

    return {
      used: organization?.credits_used || 0,
      limit: organization?.credits_limit || 1000,
      percentage: organization?.credits_limit 
        ? ((organization.credits_used || 0) / organization.credits_limit) * 100 
        : 0
    };
  }
};

export default analyticsService;
