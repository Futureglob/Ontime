import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export const analyticsService = {
  async getDashboardStats(organizationId: string) {
    const {  tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status, priority, due_date")
      .eq("organization_id", organizationId);

    if (tasksError) throw tasksError;

    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => ["assigned", "in_progress"].includes(t.status)).length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "completed").length,
      highPriority: tasks.filter(t => t.priority === "high").length,
    };

    return stats;
  },

  async getTaskStatusDistribution(organizationId: string) {
    // The rpc call is conceptual. The actual implementation would be:
    const {  statusData, error: statusError } = await supabase
      .from("tasks")
      .select("status")
      .eq("organization_id", organizationId);

    if (statusError) throw statusError;

    const distribution = statusData.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  },

  async getTaskPriorityDistribution(organizationId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select("priority")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const distribution = data.reduce((acc, { priority }) => {
      if (priority) {
        acc[priority] = (acc[priority] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  },

  async getTasksCompletedOverTime(organizationId: string, period: "day" | "week" | "month") {
    let startDate: Date;
    const now = new Date();

    if (period === "day") startDate = startOfDay(now);
    else if (period === "week") startDate = startOfWeek(now);
    else startDate = startOfMonth(now);

    const { data, error } = await supabase
      .from("tasks")
      .select("completed_at")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("completed_at", startDate.toISOString());

    if (error) throw error;

    // This data would need to be grouped by day/hour on the client side
    return data;
  },

  async getEmployeePerformance(organizationId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        full_name,
        tasks_assigned:tasks!tasks_assigned_to_fkey(status),
        tasks_created:tasks!tasks_created_by_fkey(id)
      `)
      .eq("organization_id", organizationId);

    if (error) throw error;

    const performance = data.map(employee => ({
      name: employee.full_name,
      tasksAssigned: employee.tasks_assigned.length,
      tasksCompleted: employee.tasks_assigned.filter(t => t.status === "completed").length,
    }));

    return performance;
  },

  async getLocationAnalytics(organizationId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select("location_lat, location_lng, status")
      .eq("organization_id", organizationId)
      .not("location_lat", "is", null)
      .not("location_lng", "is", null);

    if (error) throw error;

    return data.map(d => ({
        lat: d.location_lat,
        lng: d.location_lng,
        status: d.status
    }));
  },

  async getSystemHealth() {
    // This is a conceptual function.
    // It might involve checking DB connection, API response times, etc.
    try {
      const { data, error } = await supabase.from("organizations").select("id").limit(1);
      if (error) throw error;
      return { status: "ok", db_connection: true };
    } catch (error: any) {
      return { status: "error", db_connection: false, message: error.message };
    }
  },
  
  async getCreditUsage(organizationId: string) {
    const { data, error } = await supabase
      .from("credits")
      .select("total_credits, used_credits")
      .eq("organization_id", organizationId)
      .single();

    if (error) throw error;
    return data;
  }
};
