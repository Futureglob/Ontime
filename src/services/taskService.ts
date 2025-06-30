
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "./profileService";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type EnrichedTask = Task & {
  created_by_profile: Profile | null;
  assigned_to_profile: Profile | null;
};

const selectQuery = "*, created_by_profile:profiles!tasks_created_by_fkey(*), assigned_to_profile:profiles!tasks_assigned_to_fkey(*)";

export const taskService = {
  async getTasks(): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(selectQuery)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
    return (data as EnrichedTask[]) || [];
  },

  async getTasksForUser(userId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(selectQuery)
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tasks:", error);
      return [];
    }
    return (data as EnrichedTask[]) || [];
  },

  async getTasksForOrganization(organizationId: string): Promise<EnrichedTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(selectQuery)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching org tasks:", error);
      return [];
    }
    return (data as EnrichedTask[]) || [];
  },

  async getTaskById(id: string): Promise<EnrichedTask | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select(selectQuery)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching task by id:", error);
      return null;
    }
    return (data as EnrichedTask) || null;
  },

  async createTask(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(id: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return this.updateTask(id, { status, completed_at: status === 'completed' ? new Date().toISOString() : null });
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
