import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type EnrichedTask = Task & {
  created_by_profile?: Profile | null;
  assigned_to_profile?: Profile | null;
};

// A simplified task type until relationships are fixed
export type SimpleTask = Task;


export const taskService = {
  async getTasks(organizationId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assigned_to_profile:profiles!tasks_assignee_id_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*),
        photos:task_photos(*)
      `
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
    return data || [];
  },

  async getTask(taskId: string): Promise<EnrichedTask | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assigned_to_profile:profiles!tasks_assignee_id_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*),
        photos:task_photos(*)
      `
      )
      .eq("id", taskId)
      .single();

    if (error) {
      console.error("Error fetching task:", error);
      throw error;
    }
    return data;
  },

  async getTasksForUser(userId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assigned_to_profile:profiles!tasks_assignee_id_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*),
        client:clients(*),
        photos:task_photos(*)
      `
      )
      .or(`assignee_id.eq.${userId},created_by.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tasks:", error);
      throw error;
    }
    return data || [];
  },

  async createTask(task: TaskInsert): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error.message);
      return null;
    }
    return data;
  },

  async updateTask(id: string, updates: TaskUpdate): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error.message);
      return null;
    }
    return data;
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting task:", error.message);
    }
  },

  async getTaskCount(): Promise<number> {
    const { count, error } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Error getting task count:", error.message);
      return 0;
    }
    return count || 0;
  },
};
