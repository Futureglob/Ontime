import { supabase } from "@/integrations/supabase/client";
import { Task, EnrichedTask, TaskStatus, TaskPriority, Profile, Client } from "@/types/database";

const taskService = {
  transformProfileData(data: Record<string, unknown>): Profile {
    return {
      id: data.id as string,
      user_id: (data.user_id || data.id) as string,
      organization_id: data.organization_id as string || undefined,
      employee_id: data.employee_id as string || undefined,
      full_name: data.full_name as string,
      designation: data.designation as string || undefined,
      mobile_number: data.mobile_number as string,
      bio: data.bio as string || null,
      skills: data.skills as string || null,
      address: data.address as string || null,
      emergency_contact: data.emergency_contact as string || null,
      role: data.role as UserRole,
      is_active: data.is_active as boolean,
      pin: data.pin as string || undefined,
      avatar_url: data.avatar_url as string || undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  transformClientData(data: Record<string, unknown>): Client {
    return {
      id: data.id as string,
      organization_id: data.organization_id as string,
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      address: data.address as string,
      is_active: data.is_active !== false,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  transformTaskData(data: Record<string, unknown>): Task {
    return {
      id: data.id as string,
      title: data.title as string,
      description: data.description as string,
      status: data.status as Task["status"],
      priority: data.priority as Task["priority"],
      assigned_to: data.assigned_to as string,
      organization_id: data.organization_id as string,
      created_by: data.created_by as string,
      due_date: data.due_date as string,
      location: data.location as string,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  async getTasks(organizationId: string): Promise<EnrichedTask[]> {
    try {
      if (!organizationId) return [];

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

      // Combine the data with proper type casting
      const enrichedTasks: EnrichedTask[] = tasks.map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        assigned_to_profile: profiles?.find(p => p.id === task.assigned_to) 
          ? this.transformProfileData(profiles.find(p => p.id === task.assigned_to)!)
          : undefined,
        created_by_profile: profiles?.find(p => p.id === task.created_by) 
          ? this.transformProfileData(profiles.find(p => p.id === task.created_by)!)
          : undefined,
        client: clients?.find(c => c.id === task.client_id) 
          ? this.transformClientData(clients.find(c => c.id === task.client_id)!)
          : undefined
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
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      assigned_to_profile: assignedProfile?.data 
        ? this.transformProfileData(assignedProfile.data)
        : undefined,
      created_by_profile: createdByProfile?.data 
        ? this.transformProfileData(createdByProfile.data)
        : undefined,
      client: client?.data 
        ? this.transformClientData(client.data)
        : undefined
    };
  },

  async getTasksByAssignee(userId: string): Promise<EnrichedTask[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!tasks) return [];

      // Get related data for enrichment
      const profileIds = [...new Set([
        ...tasks.map(t => t.assigned_to).filter(Boolean),
        ...tasks.map(t => t.created_by).filter(Boolean)
      ])];

      const clientIds = [...new Set(tasks.map(t => t.client_id).filter(Boolean))];

      const [profiles, clients] = await Promise.all([
        profileIds.length > 0 ? supabase.from('profiles').select('*').in('id', profileIds) : { data: [] },
        clientIds.length > 0 ? supabase.from('clients').select('*').in('id', clientIds) : { data: [] }
      ]);

      return tasks.map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        assigned_to_profile: profiles.data?.find(p => p.id === task.assigned_to) 
          ? this.transformProfileData(profiles.data.find(p => p.id === task.assigned_to)!)
          : undefined,
        created_by_profile: profiles.data?.find(p => p.id === task.created_by) 
          ? this.transformProfileData(profiles.data.find(p => p.id === task.created_by)!)
          : undefined,
        client: clients.data?.find(c => c.id === task.client_id) 
          ? this.transformClientData(clients.data.find(c => c.id === task.client_id)!)
          : undefined
      }));
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      return [];
    }
  },

  async createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    return this.transformTaskData(data);
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority
    };
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
