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
  // Simplified to fetch tasks without joins to prevent crashes
  async getTasks(): Promise<SimpleTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error.message);
      return [];
    }
    return data || [];
  },

  // Simplified for now
  async getTasksForUser(): Promise<SimpleTask[]> {
    const {  authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("User not found", authError);
      return [];
    }
    const userId = authData.user.id;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tasks:", error.message);
      return [];
    }
    return data || [];
  },

  async getTasksForOrganization(organizationId: string): Promise<SimpleTask[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching org tasks:", error.message);
      return [];
    }
    return data || [];
  },

  async getTaskById(id: string): Promise<SimpleTask | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching task by id:", error.message);
      return null;
    }
    return data;
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

  async getTaskCountForUser(): Promise<number> {
    const {  authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("User not found", authError);
      return 0;
    }
    const userId = authData.user.id;

    const { count, error } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);

    if (error) {
      console.error("Error getting user task count:", error.message);
      return 0;
    }
    return count || 0;
  },
};
