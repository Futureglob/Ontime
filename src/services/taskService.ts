
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
    assigned_to: null,
    created_by: null,
    organization_id: null,
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
    assigned_to: null,
    created_by: null,
    organization_id: null,
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
    assigned_to: null,
    created_by: null,
    organization_id: null,
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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock data:", error);
        return mockTasks;
      }

      return data || [];
    } catch (error) {
      console.warn("Error fetching tasks, using mock data:", error);
      return mockTasks;
    }
  },

  async getTasksForUser(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock data:", error);
        return mockTasks;
      }

      return data || [];
    } catch (error) {
      console.warn("Error fetching user tasks, using mock data:", error);
      return mockTasks;
    }
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.warn("Database not available, using mock data:", error);
        return mockTasks.find(task => task.id === id) || null;
      }

      return data;
    } catch (error) {
      console.warn("Error fetching task, using mock data:", error);
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

      if (error) {
        console.warn("Database not available, simulating task creation:", error);
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: task.title || "New Task",
          description: task.description || null,
          status: task.status || "pending",
          priority: task.priority || "medium",
          assigned_to: task.assigned_to || null,
          created_by: task.created_by || null,
          organization_id: task.organization_id || null,
          due_date: task.due_date || null,
          completed_at: null,
          location_lat: task.location_lat || null,
          location_lng: task.location_lng || null,
          location_address: task.location_address || null,
          attachments: task.attachments || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockTasks.unshift(newTask);
        return newTask;
      }

      return data;
    } catch (error) {
      console.warn("Error creating task, simulating creation:", error);
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: task.title || "New Task",
        description: task.description || null,
        status: task.status || "pending",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || null,
        created_by: task.created_by || null,
        organization_id: task.organization_id || null,
        due_date: task.due_date || null,
        completed_at: null,
        location_lat: task.location_lat || null,
        location_lng: task.location_lng || null,
        location_address: task.location_address || null,
        attachments: task.attachments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

      if (error) {
        console.warn("Database not available, simulating task update:", error);
        const taskIndex = mockTasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
          mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
          return mockTasks[taskIndex];
        }
        throw new Error("Task not found");
      }

      return data;
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

  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) {
        console.warn("Database not available, simulating task deletion:", error);
        const taskIndex = mockTasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
          mockTasks.splice(taskIndex, 1);
        }
        return;
      }
    } catch (error) {
      console.warn("Error deleting task, simulating deletion:", error);
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1);
      }
    }
  },

  async getTasksByStatus(status: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database not available, using mock data:", error);
        return mockTasks.filter(task => task.status === status);
      }

      return data || [];
    } catch (error) {
      console.warn("Error fetching tasks by status, using mock data:", error);
      return mockTasks.filter(task => task.status === status);
    }
  },

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date().toISOString();
    
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .lt("due_date", now)
        .neq("status", "completed")
        .order("due_date", { ascending: true });

      if (error) {
        console.warn("Database not available, using mock data:", error);
        return mockTasks.filter(task => 
          task.due_date && 
          new Date(task.due_date) < new Date() && 
          task.status !== "completed"
        );
      }

      return data || [];
    } catch (error) {
      console.warn("Error fetching overdue tasks, using mock data:", error);
      return mockTasks.filter(task => 
        task.due_date && 
        new Date(task.due_date) < new Date() && 
        task.status !== "completed"
      );
    }
  },
};
