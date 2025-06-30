
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

// Mock data for development when database is not available
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete project documentation",
    description: "Write comprehensive documentation for the OnTime project",
    status: "in_progress",
    priority: "high",
    assigned_to: "user-1",
    created_by: "admin-1",
    organization_id: "org-1",
    due_date: "2025-07-02T10:00:00Z",
    completed_at: null,
    location_lat: null,
    location_lng: null,
    location_address: null,
    attachments: [],
    created_at: "2025-06-30T07:00:00Z",
    updated_at: "2025-06-30T07:00:00Z",
  },
  {
    id: "2",
    title: "Review client feedback",
    description: "Go through client feedback and prepare response",
    status: "pending",
    priority: "medium",
    assigned_to: "user-1",
    created_by: "admin-1",
    organization_id: "org-1",
    due_date: "2025-07-01T15:00:00Z",
    completed_at: null,
    location_lat: null,
    location_lng: null,
    location_address: null,
    attachments: [],
    created_at: "2025-06-29T09:00:00Z",
    updated_at: "2025-06-29T09:00:00Z",
  },
  {
    id: "3",
    title: "Update system configurations",
    description: "Update server configurations for better performance",
    status: "completed",
    priority: "low",
    assigned_to: "user-1",
    created_by: "admin-1",
    organization_id: "org-1",
    due_date: "2025-06-29T12:00:00Z",
    completed_at: "2025-06-29T11:30:00Z",
    location_lat: null,
    location_lng: null,
    location_address: null,
    attachments: [],
    created_at: "2025-06-28T14:00:00Z",
    updated_at: "2025-06-29T11:30:00Z",
  },
];

export const taskService = {
  async getTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!assigned_to(*), created_by_profile:profiles!created_by(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock ", error);
        return mockTasks;
      }

      return (data as any[]) || [];
    } catch (error) {
      console.warn("Error fetching tasks, using mock ", error);
      return mockTasks;
    }
  },

  async getTasksForUser(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!assigned_to(*), created_by_profile:profiles!created_by(*)")
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock data for user tasks:", error);
        return mockTasks;
      }

      return (data as any[]) || [];
    } catch (error) {
      console.warn("Error fetching user tasks, using mock ", error);
      return mockTasks;
    }
  },

  async getTasksForOrganization(organizationId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!assigned_to(*), created_by_profile:profiles!created_by(*)")
        .eq('organization_id', organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock data for org tasks:", error);
        return mockTasks;
      }

      return (data as any[]) || [];
    } catch (error) {
      console.warn("Error fetching org tasks, using mock ", error);
      return mockTasks;
    }
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!assigned_to(*), created_by_profile:profiles!created_by(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.warn("Database not available, using mock data for getTaskById:", error);
        return mockTasks.find(task => task.id === id) || null;
      }

      return data as any;
    } catch (error) {
      console.warn("Error fetching task, using mock ", error);
      return mockTasks.find(task => task.id === id) || null;
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
        mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
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
