
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskStatusRequest } from "@/types/database";

export const taskService = {
  async createTask(taskData: CreateTaskRequest, assignedBy: string, organizationId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .insert([{
        ...taskData,
        assigned_by: assignedBy,
        organization_id: organizationId,
        status: TaskStatus.ASSIGNED
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async getTasksByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, employee_id),
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTasksByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
      `)
      .eq("assigned_to", employeeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateTaskStatus(taskId: string, statusUpdate: UpdateTaskStatusRequest, updatedBy: string) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .update({ status: statusUpdate.status })
      .eq("id", taskId)
      .select()
      .single();

    if (taskError) throw taskError;

    const { error: historyError } = await supabase
      .from("task_status_history")
      .insert([{
        task_id: taskId,
        status: statusUpdate.status,
        updated_by: updatedBy,
        notes: statusUpdate.notes
      }]);

    if (historyError) throw historyError;
    return task as Task;
  },

  async assignTask(taskId: string, assignedTo: string) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ assigned_to: assignedTo })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async getTaskStatusHistory(taskId: string) {
    const { data, error } = await supabase
      .from("task_status_history")
      .select(`
        *,
        updated_by_profile:profiles!task_status_history_updated_by_fkey(full_name)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateTaskTiming(taskId: string, updates: { travel_distance?: number; travel_duration?: number; working_hours?: number }) {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }
};
