import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface TaskOverview {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number; // in hours
}

export interface EmployeePerformance {
  employeeId: string;
  name: string;
  avatarUrl?: string;
  completed: number;
  pending: number;
  overdue: number;
  efficiency: number; // e.g., tasks per day
}

export interface LocationAnalytics {
  totalDistance: number; // in km
  averageDistance: number; // in km
  averageDuration: number; // in minutes
}

export interface ClientSatisfaction {
  totalClients: number;
  // Will require a feedback/ratings table
}

export interface CreditUsage {
  used: number;
  limit: number;
  remaining: number;
  usagePercentage: number;
}

const analyticsService = {
  async getTaskOverview(organizationId: string): Promise<TaskOverview> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("status, created_at, completed_at, due_date")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const now = new Date();
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
    const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
    const overdueTasks = tasks?.filter(t => t.status !== "completed" && t.due_date && new Date(t.due_date) < now).length || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const completedTasksWithTimes = tasks?.filter(t => t.status === "completed" && t.created_at && t.completed_at) || [];
    const totalCompletionTime = completedTasksWithTimes.reduce((acc, t) => {
      const start = new Date(t.created_at as string).getTime();
      const end = new Date(t.completed_at as string).getTime();
      return acc + (end - start);
    }, 0);
    const avgCompletionTime = completedTasksWithTimes.length > 0 ? (totalCompletionTime / completedTasksWithTimes.length) / (1000 * 60 * 60) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      avgCompletionTime,
    };
  },

  async getEmployeePerformance(organizationId: string): Promise<EmployeePerformance[]> {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("organization_id", organizationId);

    if (profileError) throw profileError;

    const performanceData: EmployeePerformance[] = await Promise.all(
      (profiles || []).map(async (p: Partial<Profile>) => {
        const { data: tasks, error: taskError } = await supabase
          .from("tasks")
          .select("status, due_date")
          .eq("assigned_to", p.id as string);

        if (taskError) return {
          employeeId: p.id as string,
          name: p.full_name as string,
          avatarUrl: p.avatar_url || undefined,
          completed: 0,
          pending: 0,
          overdue: 0,
          efficiency: 0,
        };

        const now = new Date();
        const completed = tasks?.filter(t => t.status === "completed").length || 0;
        const pending = tasks?.filter(t => t.status === "pending").length || 0;
        const overdue = tasks?.filter(t => t.status !== "completed" && t.due_date && new Date(t.due_date) < now).length || 0;
        
        // Dummy efficiency calculation
        const efficiency = completed > 0 ? Math.random() * 10 : 0;

        return {
          employeeId: p.id as string,
          name: p.full_name as string,
          avatarUrl: p.avatar_url || undefined,
          completed,
          pending,
          overdue,
          efficiency,
        };
      })
    );

    return performanceData;
  },

  async getLocationAnalytics(organizationId: string): Promise<LocationAnalytics> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("location_lat, location_lng")
      .eq("organization_id", organizationId)
      .not("location_lat", "is", null);

    if (error) throw error;

    // Dummy data for now as we don't have distance/duration data
    const totalDistance = (tasks?.length || 0) * (Math.random() * 10 + 5);
    const averageDistance = (tasks?.length || 0) > 0 ? totalDistance / (tasks?.length || 1) : 0;
    const averageDuration = (tasks?.length || 0) > 0 ? Math.random() * 30 + 15 : 0;

    return {
      totalDistance,
      averageDistance,
      averageDuration,
    };
  },

  async getOrganizationStats(organizationId: string) {
    const [taskData, employeeData] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact" }).eq("organization_id", organizationId),
      supabase.from("profiles").select("id, is_active", { count: "exact" }).eq("organization_id", organizationId),
    ]);

    if (taskData.error) throw taskData.error;
    if (employeeData.error) throw employeeData.error;

    const totalTasks = taskData.count || 0;
    const totalEmployees = employeeData.count || 0;
    const activeEmployees = employeeData.data?.filter(e => e.is_active).length || 0;

    // Dummy data for working hours and travel distance
    const totalWorkingHours = totalEmployees * 40 * (Math.random() * 0.2 + 0.9); // 40h/week
    const totalTravelDistance = totalTasks * (Math.random() * 5 + 2);
    const averageTasksPerEmployee = totalEmployees > 0 ? totalTasks / totalEmployees : 0;

    return {
      totalTasks,
      totalEmployees,
      activeEmployees,
      totalWorkingHours,
      totalTravelDistance,
      averageTasksPerEmployee,
    };
  },

  async getCreditUsage(): Promise<CreditUsage> {
    // Placeholder implementation since credits columns don"t exist
    return { used: 0, limit: 1000, remaining: 1000, usagePercentage: 0 };
  }
};

export default analyticsService;
