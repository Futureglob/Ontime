import { supabase } from "@/integrations/supabase/client";

export interface OrganizationUser {
  id: string;
  full_name: string;
  email: string;
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
  priority?: string;
  assigned_to?: string;
  assigned_user_name?: string;
  created_at: string;
  due_date?: string;
}

// Define a type for the shape of the task data returned from the query
type TaskFromQuery = {
  id: string;
  title: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
};

export const organizationManagementService = {
  async getOrganizationDetails(orgId: string): Promise<OrganizationDetails> {
    try {
      // The `rpc` call is not strongly typed by default for functions not in generated types.
      // Using a type assertion here is a pragmatic approach to call the custom database function.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("get_organization_details", {
        org_id: orgId,
      });

      if (error) throw error;
      if (!data) throw new Error("Organization not found.");

      // We cast the result to our expected interface.
      const details = data as OrganizationDetails;

      return {
        ...details,
        users: details.users.map((user: OrganizationUser) => ({
            ...user,
            email: user.email || "no-email@system.com" // Provide a fallback email for users without one
        }))
      };
    } catch (error) {
      console.error("Error fetching organization details:", error);
      throw error;
    }
  },

  async getOrganizationTasks(orgId: string, limit: number = 50): Promise<TaskSummary[]> {
    try {
      // Query only the columns that exist in the tasks table
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          assigned_to,
          created_at,
          profiles!tasks_assigned_to_fkey (
            full_name
          )
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Map the query result to the TaskSummary interface, providing fallbacks for nullable fields
      return (tasks as TaskFromQuery[] || []).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status || "pending",
        priority: "medium", // Default priority since column doesn't exist
        assigned_to: task.assigned_to || undefined,
        assigned_user_name: task.profiles?.full_name || "Unassigned",
        created_at: task.created_at,
        due_date: undefined // Default since column doesn't exist
      }));
    } catch (error) {
      console.error("Error fetching organization tasks:", error);
      return [];
    }
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
        if (!email || email === "no-email@system.com") {
            throw new Error("User does not have a valid email address.");
        }
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
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId);

      if ((taskCount || 0) > 0) {
        throw new Error("Cannot delete user with assigned tasks. Please reassign or complete tasks first.");
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

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
      console.error("Error exporting organization ", error);
      throw error;
    }
  }
};

export default organizationManagementService;
