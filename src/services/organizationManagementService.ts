
import { supabase } from "@/integrations/supabase/client";

export interface OrganizationUser {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  employee_id?: string;
  designation?: string;
  mobile_number?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  contact_person?: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  task_count: number;
  users: OrganizationUser[];
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to?: string;
  assigned_user_name?: string;
  created_at: string;
  due_date?: string;
}

export const organizationManagementService = {
  async getOrganizationDetails(orgId: string): Promise<OrganizationDetails> {
    try {
      // Get organization basic info
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgError) throw orgError;

      // Get all users in this organization
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          employee_id,
          designation,
          mobile_number,
          is_active,
          created_at,
          updated_at
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Get task count
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      // Format users data
      const formattedUsers: OrganizationUser[] = (users || []).map(user => ({
        id: user.id,
        full_name: user.full_name || "Unknown User",
        email: "Email not available", // We can't easily get email from auth.users
        role: user.role || "employee",
        employee_id: user.employee_id,
        designation: user.designation,
        mobile_number: user.mobile_number,
        is_active: user.is_active ?? true,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at
      }));

      return {
        id: org.id,
        name: org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color,
        secondary_color: org.secondary_color,
        contact_person: org.contact_person,
        contact_email: org.contact_email,
        is_active: org.is_active ?? true,
        created_at: org.created_at,
        user_count: formattedUsers.length,
        task_count: taskCount || 0,
        users: formattedUsers
      };
    } catch (error) {
      console.error("Error fetching organization details:", error);
      throw error;
    }
  },

  async getOrganizationTasks(orgId: string, limit: number = 50): Promise<TaskSummary[]> {
    try {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          priority,
          assigned_to,
          created_at,
          due_date,
          profiles!tasks_assigned_to_fkey (
            full_name
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        status: task.status || "pending",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to,
        assigned_user_name: task.profiles?.full_name || "Unassigned",
        created_at: task.created_at,
        due_date: task.due_date
      }));
    } catch (error) {
      console.error("Error fetching organization tasks:", error);
      return [];
    }
  },

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Note: This requires admin privileges in Supabase
      // In a real implementation, you would need to use the Supabase Admin API
      // For now, we'll simulate the password reset process
      
      console.log("Password reset would be performed for user:", userId);
      console.log("New password length:", newPassword.length);
      
      // In a real implementation, you would:
      // 1. Use Supabase Admin SDK to update the user's password
      // 2. Send a password reset email
      // 3. Log the action for audit purposes
      
      // Simulated implementation:
      throw new Error("Password reset functionality requires Supabase Admin API access. Please implement using service role credentials.");
      
    } catch (error) {
      console.error("Error resetting user password:", error);
      throw error;
    }
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  },

  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      // First, check if user has any assigned tasks
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId);

      if ((taskCount || 0) > 0) {
        throw new Error("Cannot delete user with assigned tasks. Please reassign or complete tasks first.");
      }

      // Delete the profile (this won't delete the auth user, just the profile)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Note: To fully delete the auth user, you would need admin privileges
      console.log("Profile deleted. Auth user still exists and would need admin API to delete.");
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  async exportOrganizationData(orgId: string): Promise<string> {
    try {
      const orgDetails = await this.getOrganizationDetails(orgId);
      const tasks = await this.getOrganizationTasks(orgId, 1000);

      const exportData = {
        organization: {
          id: orgDetails.id,
          name: orgDetails.name,
          contact_person: orgDetails.contact_person,
          contact_email: orgDetails.contact_email,
          created_at: orgDetails.created_at,
          user_count: orgDetails.user_count,
          task_count: orgDetails.task_count
        },
        users: orgDetails.users,
        tasks: tasks,
        exported_at: new Date().toISOString(),
        exported_by: "Super Admin"
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Error exporting organization data:", error);
      throw error;
    }
  }
};

export default organizationManagementService;
