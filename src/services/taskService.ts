
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type EnrichedTask = Task & {
  created_by_profile: Profile | null;
  assigned_to_profile: Profile | null;
};

export const taskService = {
  async getTasks(): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }

      return (data || []).map(task => ({
        ...task,
        created_by_profile: null,
        assigned_to_profile: null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasks:", error);
      return [];
    }
  },

  async getTasksForUser(): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user tasks:", error);
        return [];
      }

      return (data || []).map(task => ({
        ...task,
        created_by_profile: null,
        assigned_to_profile: null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasksForUser:", error);
      return [];
    }
  },

  async getTasksForOrganization(organizationId: string): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching org tasks:", error);
        return [];
      }

      return (data || []).map(task => ({
        ...task,
        created_by_profile: null,
        assigned_to_profile: null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasksForOrganization:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<EnrichedTask | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching task by id:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        ...data,
        created_by_profile: null,
        assigned_to_profile: null
      } as EnrichedTask;
    } catch (error) {
      console.error("Error in getTaskById:", error);
      return null;
    }
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
    return this.updateTask(id, { 
      status, 
      completed_at: status === 'completed' ? new Date().toISOString() : null 
    });
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getTaskCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Error getting task count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getTaskCount:", error);
      return 0;
    }
  },

  async getTaskCountForUser(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Error getting user task count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getTaskCountForUser:", error);
      return 0;
    }
  },
};
