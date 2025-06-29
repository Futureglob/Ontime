    import { supabase } from "@/integrations/supabase/client";
    import { authService } from "./authService";

    interface OrganizationFromDB {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
      secondary_color: string | null;
      created_at: string;
      updated_at: string;
      contact_person: string | null;
      contact_email: string | null;
      is_active: boolean;
    }

    export interface OrganizationDetails {
      id: string;
      name: string;
      contact_person: string | null;
      contact_email: string | null;
      is_active: boolean;
      created_at: string;
      user_count: number;
      task_count: number;
      users: OrganizationUser[];
    }

    export interface OrganizationUser {
      id: string;
      full_name: string;
      email: string;
      employee_id: string | null;
      designation: string | null;
      mobile_number: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
      pin_hash: string | null;
      pin_expires_at: string | null;
      failed_pin_attempts: number;
      pin_locked_until: string | null;
    }

    export interface TaskSummary {
      id: string;
      title: string;
      status: string;
      assigned_user_name: string;
      created_at: string;
    }

    export const organizationManagementService = {
      async getOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
        try {
          // Get organization basic info
          const { data, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", organizationId)
            .single();

          if (orgError) throw orgError;

          const org = data as OrganizationFromDB;

          // Get users count and details
          const { data: users, error: usersError } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              employee_id,
              designation,
              mobile_number,
              role,
              is_active,
              created_at,
              pin_hash,
              pin_expires_at,
              failed_pin_attempts,
              pin_locked_until
            `)
            .eq("organization_id", organizationId);

          if (usersError) throw usersError;

          // Get tasks count
          const { count: taskCount, error: taskError } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId);

          if (taskError) throw taskError;

          // Add email from auth.users for each user
          const usersWithEmail = await Promise.all(
            (users || []).map(async (user) => {
              try {
                const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user.id);
                return {
                  ...user,
                  email: authUser?.email || "no-email@system.com"
                };
              } catch {
                return {
                  ...user,
                  email: "no-email@system.com"
                };
              }
            })
          );

          return {
            id: org.id,
            name: org.name,
            contact_person: org.contact_person,
            contact_email: org.contact_email,
            is_active: org.is_active,
            created_at: org.created_at,
            user_count: users?.length || 0,
            task_count: taskCount || 0,
            users: usersWithEmail
          };
        } catch (error) {
          console.error("Error fetching organization details:", error);
          throw error;
        }
      },

      async getOrganizationTasks(organizationId: string): Promise<TaskSummary[]> {
        try {
          const { data, error } = await supabase
            .from("tasks")
            .select(`
              id,
              title,
              status,
              created_at,
              assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
            `)
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching organization tasks:", error);
            if (error.code === '42703') { // PostgreSQL error for undefined column
                return [];
            }
            throw error;
          }
          
          type RawTask = {
            id: string;
            title: string;
            status: string;
            created_at: string;
            assigned_to_profile: { full_name: string; } | null;
          };

          return (data as RawTask[] || []).map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            assigned_user_name: task.assigned_to_profile?.full_name || "Unassigned",
            created_at: task.created_at,
          }));
        } catch (error) {
          console.error("Error fetching organization tasks:", error);
          return [];
        }
      },

      async sendPasswordResetEmail(email: string): Promise<void> {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          
          if (error) throw error;
        } catch (error) {
          console.error("Error sending password reset email:", error);
          throw error;
        }
      },

      async generateUserPin(userId: string, adminId: string): Promise<string> {
        try {
          const pin = await authService.generatePinForUser(userId, adminId);
          return pin;
        } catch (error) {
          console.error("Error generating PIN:", error);
          throw error;
        }
      },

      async resetUserPin(userId: string, adminId: string): Promise<string> {
        try {
          const pin = await authService.resetUserPin(userId, adminId);
          return pin;
        } catch (error) {
          console.error("Error resetting PIN:", error);
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
          // First, delete from profiles table
          const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

          if (profileError) throw profileError;

          // Then delete from auth.users (requires admin privileges)
          const { error: authError } = await supabase.auth.admin.deleteUser(userId);
          
          if (authError) {
            console.warn("Could not delete from auth.users:", authError);
            // Don't throw here as profile deletion succeeded
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          throw error;
        }
      },

      async exportOrganizationData(organizationId: string): Promise<string> {
        try {
          const [orgDetails, tasks] = await Promise.all([
            this.getOrganizationDetails(organizationId),
            this.getOrganizationTasks(organizationId)
          ]);

          const exportData = {
            organization: orgDetails,
            tasks: tasks,
            exportedAt: new Date().toISOString(),
            exportedBy: "Super Admin"
          };

          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error("Error exporting organization ", error);
          throw error;
        }
      }
    };

    export default organizationManagementService;
  
