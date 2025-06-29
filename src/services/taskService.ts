import { supabase } from "@/integrations/supabase/client";
import { Task, CreateTaskRequest, TaskStatus, TaskWithAssignee } from "@/types/database";

export const taskService = {
  async createTask(taskData: CreateTaskRequest, assignedBy: string, organizationId: string): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          ...taskData,
          assigned_by: assignedBy,
          organization_id: organizationId,
          status: "assigned",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTasksForOrganization(organizationId: string): Promise<TaskWithAssignee[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(
          full_name,
          designation
        ),
        assigner:profiles!tasks_assigned_by_fkey(
          full_name
        )
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TaskWithAssignee[];
  },

  async getTaskById(taskId: string): Promise<TaskWithAssignee | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(
          full_name,
          designation,
          mobile_number
        ),
        assigner:profiles!tasks_assigned_by_fkey(
          full_name
        )
      `)
      .eq("id", taskId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async updateTaskStatus(taskId: string, statusUpdate: { status: TaskStatus; notes?: string }, updatedBy: string): Promise<Task> {
    const { status, notes } = statusUpdate;

    const { data, error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    if (status) {
        const { error: historyError } = await supabase.from("task_status_history").insert({
            task_id: taskId,
            status: status,
            notes: notes,
            updated_by: updatedBy,
        });
        if (historyError) {
            console.error("Error creating status history:", historyError);
        }
    }

    return data;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

    if (error) throw error;
    return data || [];
  },

  // Add the missing method that Sidebar is trying to use
  async getTasksForUser(userId: string): Promise<Task[]> {
    return this.getUserTasks(userId);
  }
};
