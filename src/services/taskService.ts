import { supabase } from "@/integrations/supabase/client";
import type { Task, EnrichedTask } from "@/types/database";

const taskService = {
  async getTasks(organizationId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*)
      `)
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as EnrichedTask[];
  },

  async getTaskById(taskId: string): Promise<EnrichedTask> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*)
      `)
      .eq("id", taskId)
      .single();

    if (error) throw error;
    return data as EnrichedTask;
  },

  async getTasksByAssignee(userId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*)
      `)
      .eq("assigned_to", userId);

    if (error) throw error;
    return data as EnrichedTask[];
  },

  async createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
  }
};

export default taskService;
