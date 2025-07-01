
import { supabase } from "@/integrations/supabase/client";
import type { Organization, OrganizationDetails, Profile, TaskSummary } from "@/types/database";

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
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: employeeData.email,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
      user_metadata: {
        full_name: employeeData.fullName,
        role: employeeData.role,
      },
    });

    if (authError) throw authError;
    if (!user) throw new Error("User creation failed.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        organization_id: employeeData.organizationId,
        full_name: employeeData.fullName,
        employee_id: employeeData.employeeId,
        role: employeeData.role as Profile["role"],
        designation: employeeData.designation || "",
        mobile_number: employeeData.mobileNumber || "",
      })
      .select()
      .single();

    if (profileError) {
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
    const { data: tasks, error } = await supabase
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

  async generateUserPin(userId: string) {
    const { data, error } = await supabase.rpc("generate_user_pin", {
      p_user_id: userId,
    });
    if (error) {
      console.error("Error generating user PIN:", error);
      throw error;
    }
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
  },

  async bulkImportEmployees(
    organization_id: string,
    employees: {
      email: string;
      full_name: string;
      role: string;
      employee_id: string;
      designation?: string;
      mobile_number?: string;
    }[]
  ) {
    console.log("Bulk import called with:", { organization_id, employees });
    const { data, error } = await supabase
      .from("profiles")
      .insert(
        employees.map(e => ({
          organization_id: organization_id,
          ...e,
        }))
      )
      .select();

    if (error) {
        console.error("Bulk import error:", error);
        throw error;
    }
    return data as Profile[];
  }
};

export default organizationManagementService;
