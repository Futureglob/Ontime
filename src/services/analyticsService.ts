
import { supabase } from "@/integrations/supabase/client";

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  averageCompletionTime: number;
  totalWorkingHours: number;
}

export interface LocationAnalytics {
  location: string;
  taskCount: number;
  completionRate: number;
  averageDistance: number;
  averageDuration: number;
}

export interface TimeSeriesData {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  activeEmployees: number;
}

export interface OrganizationMetrics {
  totalEmployees: number;
  activeEmployees: number;
  totalTasks: number;
  completedTasks: number;
  averageTasksPerEmployee: number;
  totalWorkingHours: number;
  totalTravelDistance: number;
}

export const analyticsService = {
  async getTaskAnalytics(organizationId?: string, dateRange?: { start: Date; end: Date }): Promise<TaskAnalytics> {
    let query = supabase
      .from("tasks")
      .select("status, created_at, updated_at, working_hours");

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (dateRange) {
      query = query
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
    const pendingTasks = tasks?.filter(t => t.status === "assigned").length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
    
    const now = new Date();
    const overdueTasks = tasks?.filter(t => 
      t.status !== "completed" && 
      new Date(t.created_at) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length || 0;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const completedTasksWithHours = tasks?.filter(t => t.status === "completed" && t.working_hours) || [];
    const averageCompletionTime = completedTasksWithHours.length > 0 
      ? completedTasksWithHours.reduce((sum, t) => sum + (t.working_hours || 0), 0) / completedTasksWithHours.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime
    };
  },

  async getEmployeePerformance(organizationId?: string, dateRange?: { start: Date; end: Date }): Promise<EmployeePerformance[]> {
    let query = supabase
      .from("tasks")
      .select(`
        assigned_to,
        assigned_to_profile,
        status,
        working_hours,
        created_at
      `);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (dateRange) {
      query = query
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    const employeeMap = new Map<string, {
      name: string;
      assigned: number;
      completed: number;
      totalHours: number;
    }>();

    tasks?.forEach(task => {
      if (!task.assigned_to) return;

      const employeeId = task.assigned_to;
      const employeeName = task.assigned_to_profile?.full_name || "Unknown Employee";

      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          name: employeeName,
          assigned: 0,
          completed: 0,
          totalHours: 0
        });
      }

      const employee = employeeMap.get(employeeId)!;
      employee.assigned++;

      if (task.status === "completed") {
        employee.completed++;
        employee.totalHours += task.working_hours || 0;
      }
    });

    return Array.from(employeeMap.entries()).map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.name,
      tasksAssigned: data.assigned,
      tasksCompleted: data.completed,
      completionRate: data.assigned > 0 ? (data.completed / data.assigned) * 100 : 0,
      averageCompletionTime: data.completed > 0 ? data.totalHours / data.completed : 0,
      totalWorkingHours: data.totalHours
    }));
  },

  async getLocationAnalytics(organizationId?: string): Promise<LocationAnalytics[]> {
    let query = supabase
      .from("tasks")
      .select("location, status, travel_distance, travel_duration");

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    const locationMap = new Map<string, {
      total: number;
      completed: number;
      totalDistance: number;
      totalDuration: number;
      count: number;
    }>();

    tasks?.forEach(task => {
      if (!task.location) return;

      const location = task.location;
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          total: 0,
          completed: 0,
          totalDistance: 0,
          totalDuration: 0,
          count: 0
        });
      }

      const loc = locationMap.get(location)!;
      loc.total++;

      if (task.status === "completed") {
        loc.completed++;
      }

      if (task.travel_distance) {
        loc.totalDistance += task.travel_distance;
        loc.count++;
      }

      if (task.travel_duration) {
        loc.totalDuration += task.travel_duration;
      }
    });

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      taskCount: data.total,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      averageDistance: data.count > 0 ? data.totalDistance / data.count : 0,
      averageDuration: data.count > 0 ? data.totalDuration / data.count : 0
    }));
  },

  async getTimeSeriesData(organizationId?: string, days: number = 30): Promise<TimeSeriesData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    let tasksQuery = supabase
      .from("tasks")
      .select("created_at, updated_at, status, assigned_to");

    if (organizationId) {
      tasksQuery = tasksQuery.eq("organization_id", organizationId);
    }

    tasksQuery = tasksQuery
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const { data: tasks, error } = await tasksQuery;
    if (error) throw error;

    const dateMap = new Map<string, {
      created: number;
      completed: number;
      activeEmployees: Set<string>;
    }>();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap.set(dateStr, {
        created: 0,
        completed: 0,
        activeEmployees: new Set()
      });
    }

    tasks?.forEach(task => {
      const createdDate = new Date(task.created_at).toISOString().split("T")[0];
      const updatedDate = new Date(task.updated_at).toISOString().split("T")[0];

      if (dateMap.has(createdDate)) {
        const dayData = dateMap.get(createdDate)!;
        dayData.created++;
        if (task.assigned_to) {
          dayData.activeEmployees.add(task.assigned_to);
        }
      }

      if (task.status === "completed" && dateMap.has(updatedDate)) {
        dateMap.get(updatedDate)!.completed++;
      }
    });

    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      tasksCreated: data.created,
      tasksCompleted: data.completed,
      activeEmployees: data.activeEmployees.size
    }));
  },

  async getOrganizationMetrics(organizationId?: string): Promise<OrganizationMetrics> {
    let profilesQuery = supabase
      .from("profiles")
      .select("id, is_active");

    let tasksQuery = supabase
      .from("tasks")
      .select("status, working_hours, travel_distance");

    if (organizationId) {
      profilesQuery = profilesQuery.eq("organization_id", organizationId);
      tasksQuery = tasksQuery.eq("organization_id", organizationId);
    }

    const [profilesResult, tasksResult] = await Promise.all([
      profilesQuery,
      tasksQuery
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const profiles = profilesResult.data || [];
    const tasks = tasksResult.data || [];

    const totalEmployees = profiles.length;
    const activeEmployees = profiles.filter(p => p.is_active).length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const averageTasksPerEmployee = activeEmployees > 0 ? totalTasks / activeEmployees : 0;
    const totalWorkingHours = tasks.reduce((sum, t) => sum + (t.working_hours || 0), 0);
    const totalTravelDistance = tasks.reduce((sum, t) => sum + (t.travel_distance || 0), 0);

    return {
      totalEmployees,
      activeEmployees,
      totalTasks,
      completedTasks,
      averageTasksPerEmployee,
      totalWorkingHours,
      totalTravelDistance
    };
  },

  async getTaskStatusHistory(taskId: string) {
    const { data, error } = await supabase
      .from("task_status_history")
      .select(`
        *,
        profiles!task_status_history_updated_by_fkey(full_name)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLocationLogs(organizationId?: string, dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from("location_logs")
      .select(`
        *,
        profiles!location_logs_user_id_fkey(full_name),
        tasks!location_logs_task_id_fkey(title)
      `);

    if (dateRange) {
      query = query
        .gte("recorded_at", dateRange.start.toISOString())
        .lte("recorded_at", dateRange.end.toISOString());
    }

    const { data, error } = await query.order("recorded_at", { ascending: false });
    if (error) throw error;
    return data;
  }
};

export default analyticsService;
