
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export interface OrganizationDetails extends Organization {
  userCount: number;
  taskCount: number;
  completedTasks: number;
}

export interface OrganizationUser extends Profile {
  email?: string;
  status?: string;
}

export interface TaskSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

const organizationManagementService = {
  async getEmployees(organizationId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data || [];
  },

  async addEmployee(employeeData: {
    email: string;
    fullName: string;
    role: string;
    employeeId: string;
    organizationId: string;
    designation?: string;
    mobileNumber?: string;
  }) {
    const {  { user }, error: authError } = await supabase.auth.admin.createUser({
      email: employeeData.email,
      password: Math.random().toString(36).slice(-8), // Insecure, for dev only
      email_confirm: true,
      user_meta {
        full_name: employeeData.fullName,
        role: employeeData.role,
      },
    });

    if (authError) throw authError;
    if (!user) throw new Error("User creation failed.");

    const {  profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        organization_id: employeeData.organizationId,
        full_name: employeeData.fullName,
        employee_id: employeeData.employeeId,
        role: employeeData.role,
        designation: employeeData.designation || "",
        mobile_number: employeeData.mobileNumber || "",
      })
      .select()
      .single();

    if (profileError) {
      // Clean up created user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
    }
    return profile;
  },

  async updateEmployee(employeeId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEmployee(employeeId: string) {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", employeeId);

    if (error) throw error;
    return true;
  },

  async getOrganizationSettings(organizationId: string) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrganizationSettings(organizationId: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
    const [orgResult, usersResult, tasksResult] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", organizationId).single(),
      supabase.from("profiles").select("id", { count: "exact" }).eq("organization_id", organizationId),
      supabase.from("tasks").select("id, status").eq("organization_id", organizationId)
    ]);

    if (orgResult.error) throw orgResult.error;
    if (!orgResult.data) throw new Error("Organization not found");
    
    if (usersResult.error) throw usersResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const userCount = usersResult.count || 0;
    const taskCount = tasksResult.data?.length || 0;
    const completedTasks = tasksResult.data?.filter(t => t.status === "completed").length || 0;

    return {
      ...orgResult.data,
      userCount,
      taskCount,
      completedTasks
    };
  },

  async getOrganizationTasks(organizationId: string): Promise<TaskSummary> {
    const {  tasks, error } = await supabase
      .from("tasks")
      .select("status, due_date")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const now = new Date();
    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.status === "completed").length || 0;
    const pending = tasks?.filter(t => t.status === "pending").length || 0;
    const overdue = tasks?.filter(t => 
      t.status !== "completed" && t.due_date && new Date(t.due_date) < now
    ).length || 0;

    return { total, completed, pending, overdue };
  },

  async generatePinForUser(userId: string) {
    const { data, error } = await supabase.rpc("generate_user_pin", {
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  },

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    return true;
  },

  async exportOrganizationData(organizationId: string) {
    const [profiles, tasks, clients] = await Promise.all([
      supabase.from("profiles").select("*").eq("organization_id", organizationId),
      supabase.from("tasks").select("*").eq("organization_id", organizationId),
      supabase.from("clients").select("*").eq("organization_id", organizationId)
    ]);

    return {
      profiles: profiles.data || [],
      tasks: tasks.data || [],
      clients: clients.data || []
    };
  }
};

export default organizationManagementService;
