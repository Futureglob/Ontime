import { supabase } from "@/integrations/supabase/client";

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

export interface LocationAnalytics {
  location: string;
  taskCount: number;
  completionRate: number;
  averageDistance: number;
  averageDuration: number;
}

export const analyticsService = {
  async getTaskOverview(organizationId: string, dateRange?: { from?: Date; to?: Date }): Promise<TaskOverview> {
    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organizationId);

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      const { data: tasks, error: tasksError } = await query;
      if (tasksError) throw tasksError;

      const { data: employees, error: employeesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId);
      if (employeesError) throw employeesError;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
      const pendingTasks = tasks?.filter(t => t.status === "assigned").length || 0;
      
      const overdueTasks = tasks.filter(
        (task) =>
          task.status !== "completed" &&
          task.due_date &&
          new Date(task.due_date) < new Date()
      ).length;

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(e => e.is_active).length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const completionTimes = tasks
        .filter((task) => task.completed_at && task.due_date)
        .map((task) =>
          new Date(task.completed_at as string).getTime() - new Date(task.due_date as string).getTime()
        );

      const avgTimeToComplete =
        completionTimes.reduce((a, b) => a + b, 0) /
        (completionTimes.length || 1);

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        totalEmployees,
        activeEmployees,
        completionRate,
        avgCompletionTime: avgTimeToComplete,
        totalWorkingHours: completedTasks * 4.5,
        averageTasksPerEmployee: activeEmployees > 0 ? totalTasks / activeEmployees : 0,
        totalTravelDistance: 0,
      };
    } catch (error) {
      console.error("Error fetching task overview:", error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalEmployees: 0,
        activeEmployees: 0,
        completionRate: 0,
        avgCompletionTime: 0,
        totalWorkingHours: 0,
        averageTasksPerEmployee: 0,
        totalTravelDistance: 0,
      };
    }
  },

  async getEmployeePerformance(organizationId: string, dateRange?: { start: Date; end: Date; }): Promise<EmployeePerformance[]> {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("role", "employee");
      if (employeesError) throw employeesError;

      const performance = await Promise.all(
        (employees || []).map(async (employee) => {
          let taskQuery = supabase
            .from("tasks")
            .select("*")
            .eq("assignee_id", employee.id);

          if (dateRange?.start && dateRange?.end) {
            taskQuery = taskQuery
              .gte("created_at", dateRange.start.toISOString())
              .lte("created_at", dateRange.end.toISOString());
          }

          const { data: tasks } = await taskQuery;
          const userTasks = tasks || [];

          const completed = userTasks.filter(t => t.status === "completed").length;
          const pending = userTasks.filter(t => t.status === "assigned").length;
          const overdue = userTasks.filter(t => {
            if (!t.due_date) return false;
            return new Date(t.due_date) < new Date() && t.status !== "completed";
          }).length;

          const total = userTasks.length;
          const efficiency = total > 0 ? (completed / total) * 100 : 0;

          return {
            name: employee.full_name || "Unknown Employee",
            completed,
            pending,
            overdue,
            efficiency: Math.round(efficiency),
          };
        })
      );

      return performance;
    } catch (error) {
      console.error("Error fetching employee performance:", error);
      return [];
    }
  },

  async getLocationAnalytics(organizationId: string, dateRange?: { start: Date; end: Date; }): Promise<LocationAnalytics[]> {
    try {
      let query = supabase
        .from("tasks")
        .select("location, status")
        .eq("organization_id", organizationId)
        .not("location", "is", null);

      if (dateRange?.start && dateRange?.end) {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }

      const { data: tasks, error } = await query;
      if (error) throw error;

      const locationMap = new Map<string, { total: number; completed: number }>();

      (tasks || []).forEach(task => {
        if (!task.location) return;
        
        const current = locationMap.get(task.location) || { total: 0, completed: 0 };
        current.total += 1;
        if (task.status === "completed") {
          current.completed += 1;
        }
        locationMap.set(task.location, current);
      });

      return Array.from(locationMap.entries()).map(([location, stats]) => ({
        location,
        taskCount: stats.total,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        averageDistance: 0,
        averageDuration: 0,
      }));
    } catch (error) {
      console.error("Error fetching location analytics:", error);
      return [];
    }
  },

  async getTimeSeriesData(organizationId: string, days: number = 30): Promise<TaskTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("created_at, status, updated_at")
        .eq("organization_id", organizationId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      const dateMap = new Map<string, { created: number; completed: number }>();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        dateMap.set(dateStr, { created: 0, completed: 0 });
      }

      (tasks || []).forEach(task => {
        const createdDate = new Date(task.created_at).toISOString().split("T")[0];
        const current = dateMap.get(createdDate);
        if (current) {
          current.created += 1;
        }
      });

      (tasks || []).filter(t => t.status === "completed").forEach(task => {
        const completedDate = new Date(task.updated_at || task.created_at).toISOString().split("T")[0];
        const current = dateMap.get(completedDate);
        if (current) {
          current.completed += 1;
        }
      });

      return Array.from(dateMap.entries()).map(([date, stats]) => ({
        date,
        created: stats.created,
        completed: stats.completed,
      }));
    } catch (error) {
      console.error("Error fetching time series data:", error);
      return [];
    }
  },

  async getTaskAnalytics(organizationId?: string, dateRange?: { start: Date; end: Date; }) {
    if (!organizationId) return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, completionRate: 0, avgCompletionTime: 0 };
    const overview = await this.getTaskOverview(organizationId, dateRange ? { from: dateRange.start, to: dateRange.end } : undefined);
    return {
      totalTasks: overview.totalTasks,
      completedTasks: overview.completedTasks,
      pendingTasks: overview.pendingTasks,
      overdueTasks: overview.overdueTasks,
      completionRate: overview.completionRate,
      avgCompletionTime: overview.avgCompletionTime,
    };
  },

  async getTaskTrends(organizationId: string, dateRange?: { from?: Date; to?: Date }): Promise<TaskTrend[]> {
    const days = dateRange?.from && dateRange?.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    return this.getTimeSeriesData(organizationId, days);
  },

  async getTasksByStatus(organizationId: string): Promise<TaskByStatus[]> {
    try {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("organization_id", organizationId);

      if (error) throw error;

      const statusMap = new Map<string, number>();
      const total = tasks?.length || 0;

      (tasks || []).forEach(task => {
        const count = statusMap.get(task.status) || 0;
        statusMap.set(task.status, count + 1);
      });

      return Array.from(statusMap.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    } catch (error) {
      console.error("Error fetching tasks by status:", error);
      return [];
    }
  },

  async getTimeAnalytics(organizationId: string, dateRange?: { from?: Date; to?: Date }): Promise<TimeAnalytic[]> {
    try {
      let query = supabase
        .from("tasks")
        .select("created_at, status")
        .eq("organization_id", organizationId);

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      const { data: tasks, error } = await query;
      if (error) throw error;

      const hourMap = new Map<number, { total: number; completed: number }>();

      (tasks || []).forEach(task => {
        const hour = new Date(task.created_at).getHours();
        const current = hourMap.get(hour) || { total: 0, completed: 0 };
        current.total += 1;
        if (task.status === "completed") {
          current.completed += 1;
        }
        hourMap.set(hour, current);
      });

      return Array.from(hourMap.entries()).map(([hour, stats]) => ({
        hour,
        taskCount: stats.total,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      }));
    } catch (error) {
      console.error("Error fetching time analytics:", error);
      return [];
    }
  }
};
