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
  location: string;
  taskCount: number;
  completionRate: number;
  totalDistance: number;
  averageDistance: number;
  averageDuration: number;
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
    if (!organizationId) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        avgCompletionTime: 0,
      };
    }

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("status, created_at")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
    const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
    
    // Since we don't have due_date, we'll calculate overdue based on created_at + 7 days
    const now = new Date();
    const overdueTasks = tasks?.filter(t => {
      if (t.status === "completed") return false;
      const createdDate = new Date(t.created_at);
      const dueDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from creation
      return dueDate < now;
    }).length || 0;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Since we don't have completed_at, we'll use a dummy calculation
    const avgCompletionTime = completedTasks > 0 ? Math.random() * 48 + 24 : 0; // Random 24-72 hours

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
    if (!organizationId) return [];

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("organization_id", organizationId);

    if (profileError) throw profileError;

    const performanceData: EmployeePerformance[] = await Promise.all(
      (profiles || []).map(async (p: Partial<Profile>) => {
        const { data: tasks, error: taskError } = await supabase
          .from("tasks")
          .select("status, created_at")
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
        
        // Calculate overdue based on created_at + 7 days
        const overdue = tasks?.filter(t => {
          if (t.status === "completed") return false;
          const createdDate = new Date(t.created_at);
          const dueDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));
          return dueDate < now;
        }).length || 0;
        
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

  async getLocationAnalytics(organizationId: string): Promise<LocationAnalytics[]> {
    if (!organizationId) return [];

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("location_lat, location_lng, status")
      .eq("organization_id", organizationId)
      .not("location_lat", "is", null);

    if (error) throw error;

    // Group tasks by location (simplified - using lat/lng as location identifier)
    const locationGroups: Record<string, any[]> = {};
    tasks?.forEach(task => {
      const locationKey = `${task.location_lat?.toFixed(2)},${task.location_lng?.toFixed(2)}`;
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = [];
      }
      locationGroups[locationKey].push(task);
    });

    const locationAnalytics: LocationAnalytics[] = Object.entries(locationGroups).map(([locationKey, locationTasks]) => {
      const completedTasks = locationTasks.filter(t => t.status === "completed").length;
      const completionRate = locationTasks.length > 0 ? (completedTasks / locationTasks.length) * 100 : 0;
      
      return {
        location: `Location ${locationKey}`,
        taskCount: locationTasks.length,
        completionRate,
        totalDistance: locationTasks.length * (Math.random() * 10 + 5),
        averageDistance: Math.random() * 10 + 5,
        averageDuration: Math.random() * 30 + 15,
      };
    });

    return locationAnalytics;
  },

  async getOrganizationStats(organizationId: string) {
    if (!organizationId) {
      return {
        totalTasks: 0,
        totalEmployees: 0,
        activeEmployees: 0,
        totalWorkingHours: 0,
        totalTravelDistance: 0,
        averageTasksPerEmployee: 0,
      };
    }

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
    // Placeholder implementation since credits columns don't exist
    return { used: 0, limit: 1000, remaining: 1000, usagePercentage: 0 };
  }
};

export default analyticsService;