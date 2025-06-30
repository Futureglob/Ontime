
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

export const taskService = {
  async getTasks(): Promise<EnrichedTask[]> {
    try {
      // First get tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        return [];
      }

      if (!tasks || tasks.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set([
        ...tasks.map(t => t.created_by),
        ...tasks.map(t => t.assigned_to)
      ].filter(Boolean))];

      // Get profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich tasks with profile data
      return tasks.map(task => ({
        ...task,
        created_by_profile: task.created_by ? profileMap.get(task.created_by) || null : null,
        assigned_to_profile: task.assigned_to ? profileMap.get(task.assigned_to) || null : null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasks:", error);
      return [];
    }
  },

  async getTasksForUser(userId: string): Promise<EnrichedTask[]> {
    try {
      // First get tasks for user
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching user tasks:", tasksError);
        return [];
      }

      if (!tasks || tasks.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set([
        ...tasks.map(t => t.created_by),
        ...tasks.map(t => t.assigned_to)
      ].filter(Boolean))];

      // Get profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich tasks with profile data
      return tasks.map(task => ({
        ...task,
        created_by_profile: task.created_by ? profileMap.get(task.created_by) || null : null,
        assigned_to_profile: task.assigned_to ? profileMap.get(task.assigned_to) || null : null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasksForUser:", error);
      return [];
    }
  },

  async getTasksForOrganization(organizationId: string): Promise<EnrichedTask[]> {
    try {
      // First get tasks for organization
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching org tasks:", tasksError);
        return [];
      }

      if (!tasks || tasks.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set([
        ...tasks.map(t => t.created_by),
        ...tasks.map(t => t.assigned_to)
      ].filter(Boolean))];

      // Get profiles separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich tasks with profile data
      return tasks.map(task => ({
        ...task,
        created_by_profile: task.created_by ? profileMap.get(task.created_by) || null : null,
        assigned_to_profile: task.assigned_to ? profileMap.get(task.assigned_to) || null : null
      })) as EnrichedTask[];
    } catch (error) {
      console.error("Error in getTasksForOrganization:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<EnrichedTask | null> {
    try {
      // First get the task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (taskError || !task) {
        console.error("Error fetching task by id:", taskError);
        return null;
      }

      // Get profiles for created_by and assigned_to
      const userIds = [task.created_by, task.assigned_to].filter(Boolean);
      
      if (userIds.length === 0) {
        return {
          ...task,
          created_by_profile: null,
          assigned_to_profile: null
        } as EnrichedTask;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return {
        ...task,
        created_by_profile: task.created_by ? profileMap.get(task.created_by) || null : null,
        assigned_to_profile: task.assigned_to ? profileMap.get(task.assigned_to) || null : null
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
