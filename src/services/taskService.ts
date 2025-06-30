
        
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "./authService";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type EnrichedTask = Task & {
  created_by_profile?: Profile | null;
  assigned_to_profile?: Profile | null;
};

// Mock data for development when database is not available
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete project documentation",
    description: "Write comprehensive documentation for the OnTime project",
    status: "in_progress",
    assigned_to: "user-1",
    created_by: "admin-1",
    organization_id: "org-1",
    deadline: "2025-07-02T10:00:00Z",
    completed_at: null,
    location_lat: null,
    location_lng: null,
    location_address: null,
    attachments: [],
    created_at: "2025-06-30T07:00:00Z",
    updated_at: "2025-06-30T07:00:00Z",
    client_info: null,
    location: null,
    task_type: "documentation",
  },
];

// Helper function to enrich tasks with profile data
const enrichTasks = async (tasks: Task[]): Promise<EnrichedTask[]> => {
    if (!tasks || tasks.length === 0) {
        return [];
    }

    const userIds = new Set<string>();
    tasks.forEach(task => {
        if (task.created_by) userIds.add(task.created_by);
        if (task.assigned_to) userIds.add(task.assigned_to);
    });

    if (userIds.size === 0) {
        return tasks.map(t => ({ ...t, created_by_profile: null, assigned_to_profile: null }));
    }

    const {  profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));

    if (error) {
        console.error("Error fetching profiles for tasks:", error);
        return tasks.map(t => ({ ...t, created_by_profile: null, assigned_to_profile: null }));
    }

    const profilesMap = new Map<string, Profile>();
    profiles.forEach(p => profilesMap.set(p.id, p as Profile));

    return tasks.map(task => ({
        ...task,
        created_by_profile: profilesMap.get(task.created_by || '') || null,
        assigned_to_profile: profilesMap.get(task.assigned_to || '') || null,
    }));
};


export const taskService = {
  async getTasks(): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database query failed for getTasks, using mock data:", error);
        return mockTasks as EnrichedTask[];
      }

      return enrichTasks(data || []);
    } catch (error) {
      console.warn("Error fetching tasks, using mock ", error);
      return mockTasks as EnrichedTask[];
    }
  },

  async getTasksForUser(userId: string): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database query failed for getTasksForUser, using mock ", error);
        return mockTasks as EnrichedTask[];
      }

      return enrichTasks(data || []);
    } catch (error) {
      console.warn("Error fetching user tasks, using mock ", error);
      return mockTasks as EnrichedTask[];
    }
  },

  async getTasksForOrganization(organizationId: string): Promise<EnrichedTask[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq('organization_id', organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database query failed for getTasksForOrganization, using mock ", error);
        return mockTasks as EnrichedTask[];
      }

      return enrichTasks(data || []);
    } catch (error) {
      console.warn("Error fetching org tasks, using mock ", error);
      return mockTasks as EnrichedTask[];
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
        console.warn("Database query failed for getTaskById, using mock ", error);
        const mockTask = mockTasks.find(task => task.id === id) || null;
        return mockTask ? (mockTask as EnrichedTask) : null;
      }
      
      if (!data) return null;

      const enriched = await enrichTasks([data]);
      return enriched[0] || null;

    } catch (error) {
      console.warn("Error fetching task, using mock ", error);
      const mockTask = mockTasks.find(task => task.id === id) || null;
      return mockTask ? (mockTask as EnrichedTask) : null;
    }
  },

  async createTask(task: TaskInsert): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    } catch (error) {
      console.warn("Error creating task, simulating creation:", error);
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        client_info: null,
        location: null,
        task_type: "general",
        ...task,
      };
      mockTasks.unshift(newTask);
      return newTask;
    }
  },

  async updateTask(id: string, updates: TaskUpdate): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    } catch (error) {
      console.warn("Error updating task, simulating update:", error);
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates, updated_at: new Date().toISOString() } as Task;
        return mockTasks[taskIndex];
      }
      throw new Error("Task not found");
    }
  },

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return this.updateTask(id, { status, completed_at: status === 'completed' ? new Date().toISOString() : null });
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.warn("Error deleting task, simulating deletion:", error);
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1);
      }
    }
  },
};
