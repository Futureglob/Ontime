
import { supabase } from "@/integrations/supabase/client";

export interface SuperAdmin {
  id: string;
  user_id: string;
  permissions: Record<string, boolean>;
  created_at: string;
  created_by: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface SystemSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string;
  updated_by: string;
  updated_at: string;
}

export interface OrganizationStats {
  id: string;
  name: string;
  total_users: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  created_at: string;
}

// Interim type for profile data as Supabase types might be incomplete
interface ProfileData {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
  // Add other fields from profiles table if needed by this service
}


export const superAdminService = {
  // Check if current user is super admin
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_super_admin' as any, { user_id: userId });
      
      if (error) {
        console.warn("RPC 'check_super_admin' failed or doesn't exist, falling back to profile role check:", error.message);
        const {  profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile for super admin check:", profileError);
          return false;
        }
        return profile?.role === "admin";
      }
      
      return !!data;
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  },

  // Get all super admins
  async getSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("role", "admin");

      if (error) throw error;
      
      return (data || []).map(profile => {
        const p = profile as ProfileData;
        return {
          id: p.id,
          user_id: p.id,
          permissions: {},
          created_at: p.created_at || new Date().toISOString(),
          created_by: "system", // This should ideally be the user who granted super admin
          user: {
            email: p.email || "N/A",
            full_name: p.full_name || "N/A"
          }
        };
      });
    } catch (error) {
      console.error("Error fetching super admins:", error);
      return [];
    }
  },

  // Add super admin
  async addSuperAdmin(userId: string, permissions: Record<string, boolean> = {}): Promise<SuperAdmin> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .select("id, full_name, email, role, created_at")
        .single();

      if (error) throw error;
      
      const p = data as ProfileData;
      return {
        id: p.id,
        user_id: p.id,
        permissions,
        created_at: p.created_at || new Date().toISOString(),
        created_by: "system", // This should ideally be the user who granted super admin
        user: {
          email: p.email || "N/A",
          full_name: p.full_name || "N/A"
        }
      };
    } catch (error) {
      console.error("Error adding super admin:", error);
      throw error;
    }
  },

  // Remove super admin (by setting role back to a default, e.g., manager)
  async removeSuperAdmin(userIdToRemove: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "manager" }) // Or "employee", depending on desired default
        .eq("id", userIdToRemove);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing super admin (revoking admin role):", error);
      throw error;
    }
  },

  // Update super admin permissions (Placeholder - requires a dedicated super_admins table)
  async updateSuperAdminPermissions(superAdminId: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      console.log("Permissions update called for (placeholder):", superAdminId, permissions);
      // This would be implemented when we have proper super_admins table with a permissions column
      // For now, this function doesn't do anything to the DB regarding permissions.
      // Example:
      // const { error } = await supabase
      //   .from("super_admins" as any) // Assuming 'super_admins' table exists
      //   .update({ permissions })
      //   .eq("id", superAdminId); // Or .eq("user_id", superAdminId)
      // if (error) throw error;
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  // Get system settings (Placeholder - requires a system_settings table)
  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      // Mock data as 'system_settings' table might not exist or be typed
      console.warn("'getSystemSettings' is returning mock data.");
      return [
        {
          id: "1",
          key: "app_name",
          value: { name: "OnTime" },
          description: "Application name",
          updated_by: "system",
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          key: "maintenance_mode",
          value: { enabled: false },
          description: "System Maintenance Mode",
          updated_by: "system",
          updated_at: new Date().toISOString()
        }
      ];
      // Example for actual table:
      // const { data, error } = await supabase
      //   .from("system_settings" as any) // Assuming 'system_settings' table exists
      //   .select("*");
      // if (error) throw error;
      // return data || [];
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  },

  // Update system setting (Placeholder)
  async updateSystemSetting(key: string, value: Record<string, unknown>, description?: string): Promise<void> {
    try {
      console.warn(`'updateSystemSetting' for key '${key}' is a placeholder.`);
      // Example for actual table:
      // const currentUser = (await supabase.auth.getUser()).data.user;
      // const { error } = await supabase
      //   .from("system_settings" as any) // Assuming 'system_settings' table exists
      //   .update({ value, description, updated_by: currentUser?.id, updated_at: new Date().toISOString() })
      //   .eq("key", key);
      // if (error) throw error;
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  },

  // Get organization statistics
  async getOrganizationStats(): Promise<OrganizationStats[]> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, created_at");

      if (error) throw error;

      const statsPromises = (data || []).map(async (org) => {
        const [usersResult, tasksResult] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact" }).eq("organization_id", org.id),
          supabase.from("tasks").select("id, status", { count: "exact" }).eq("organization_id", org.id)
        ]);

        const tasksData = tasksResult.data as { id: string; status: string }[] || [];
        return {
          id: org.id,
          name: org.name,
          created_at: org.created_at,
          total_users: usersResult.count || 0,
          total_tasks: tasksResult.count || 0,
          active_tasks: tasksData.filter(task => 
            ["assigned", "accepted", "in_progress"].includes(task.status)
          ).length,
          completed_tasks: tasksData.filter(task => 
            task.status === "completed"
          ).length
        };
      });

      return Promise.all(statsPromises);
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      return [];
    }
  },

  async getSystemAnalytics(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: string;
      organization?: string;
    }>;
  }> {
    try {
      const [orgsResult, usersResult, tasksResult] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("tasks").select("id, status") // Fetch all statuses to filter locally
      ]);

      const totalOrganizations = orgsResult.count || 0;
      const totalUsers = usersResult.count || 0;
      
      const tasksData = tasksResult.data as { id: string; status: string }[] || [];
      const totalTasks = tasksData.length;
      const activeTasks = tasksData.filter(task => 
        ["assigned", "accepted", "in_progress"].includes(task.status)
      ).length;
      const completedTasks = tasksData.filter(task => 
        task.status === "completed"
      ).length;

      const recentActivity = [
        {
          type: "system_analytics",
          description: "System-wide analytics overview generated.",
          timestamp: new Date().toISOString(),
        }
      ];

      return {
        totalOrganizations,
        totalUsers,
        totalTasks,
        activeTasks,
        completedTasks,
        recentActivity
      };
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      throw error; // Re-throw to allow caller to handle
    }
  },
  
  async updateOrganizationStatus(organizationId: string, isActive: boolean): Promise<void> {
    try {
      // Assuming 'organizations' table has an 'is_active' boolean column
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: isActive } as any) // Cast to any if 'is_active' not in generated types
        .eq("id", organizationId);

      if (error) throw error;
      console.log(`Organization ${organizationId} status updated to ${isActive ? 'active' : 'inactive'}.`);
    } catch (error) {
      console.error("Error updating organization status:", error);
      throw error;
    }
  },

  async getUserActivity(): Promise<Array<{
    user_id: string;
    user_name: string;
    organization: string;
    activity_type: string;
    description: string;
    timestamp: string;
  }>> {
    try {
      console.warn("'getUserActivity' is returning mock data.");
      // This would typically involve querying an audit log table.
      return [
        {
          user_id: "example-user-1",
          user_name: "John Doe",
          organization: "Org A",
          activity_type: "task_created",
          description: "Created task 'Fix Leaky Faucet'",
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          user_id: "example-user-2",
          user_name: "Jane Smith",
          organization: "Org B",
          activity_type: "login_success",
          description: "User logged in successfully",
          timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ];
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  }
};

export default superAdminService;
