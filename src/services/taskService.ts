import { supabase } from "@/integrations/supabase/client";
import { Task, EnrichedTask, Profile, Client } from "@/types/database";

export const taskService = {
  async getTasks(organizationId: string): Promise<EnrichedTask[]> {
    try {
      // Get tasks first
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      if (!tasks) return [];

      // Get all unique profile IDs
      const profileIds = [...new Set([
        ...tasks.map(t => t.assigned_to).filter(Boolean),
        ...tasks.map(t => t.created_by).filter(Boolean)
      ])];

      // Get profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);

      // Get all unique client IDs
      const clientIds = [...new Set(tasks.map(t => t.client_id).filter(Boolean))];
      
      // Get clients separately
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);

      // Combine the data
      const enrichedTasks: EnrichedTask[] = tasks.map(task => ({
        ...task,
        assigned_to_profile: profiles?.find(p => p.id === task.assigned_to),
        created_by_profile: profiles?.find(p => p.id === task.created_by),
        client: clients?.find(c => c.id === task.client_id)
      }));

      return enrichedTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async getTaskById(taskId: string): Promise<EnrichedTask> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;

    // Get related data separately
    const [assignedProfile, createdByProfile, client] = await Promise.all([
      task.assigned_to ? supabase.from('profiles').select('*').eq('id', task.assigned_to).single() : null,
      task.created_by ? supabase.from('profiles').select('*').eq('id', task.created_by).single() : null,
      task.client_id ? supabase.from('clients').select('*').eq('id', task.client_id).single() : null
    ]);

    return {
      ...task,
      assigned_to_profile: assignedProfile?.data || undefined,
      created_by_profile: createdByProfile?.data || undefined,
      client: client?.data || undefined
    };
  },

  async getTasksByAssignee(userId: string): Promise<EnrichedTask[]> {
    return this.getTasks('').then(tasks => 
      tasks.filter(task => task.assigned_to === userId)
    );
  },

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
};

export default taskService;
