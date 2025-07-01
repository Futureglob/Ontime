
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedTask, Task, TaskPhoto } from "@/types/database";

const taskService = {
  async getTasks(organizationId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        created_by_profile:profiles!tasks_created_by_fkey(*),
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        client:clients(*),
        task_photos(*)
      `)
      .eq("organization_id", organizationId);

    if (error) throw error;
    
    return (data?.map(task => ({
      ...task,
      photos: task.task_photos as TaskPhoto[]
    })) || []) as EnrichedTask[];
  },

  async getTaskById(taskId: string): Promise<EnrichedTask | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        created_by_profile:profiles!tasks_created_by_fkey(*),
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        client:clients(*),
        task_photos(*)
      `)
      .eq("id", taskId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      photos: data.task_photos as TaskPhoto[]
    } as EnrichedTask;
  },

  async getTasksByAssignee(userId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        created_by_profile:profiles!tasks_created_by_fkey(*),
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        client:clients(*),
        task_photos(*)
      `)
      .eq("assigned_to", userId);

    if (error) throw error;
    
    return (data?.map(task => ({
      ...task,
      photos: task.task_photos as TaskPhoto[]
    })) || []) as EnrichedTask[];
  },

  async createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at" | "completed_at">) {
    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
    return true;
  },

  async getTaskHistory(taskId: string) {
    // This might need a dedicated history table later
    // For now, we can just return some basic info
    const task = await this.getTaskById(taskId);
    return [
      { event: "Created", timestamp: task?.created_at, user: task?.created_by_profile?.full_name },
      { event: "Last Updated", timestamp: task?.updated_at, user: "System" },
    ].filter(item => item.timestamp);
  }
};

export default taskService;
